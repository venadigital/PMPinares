"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile, hasPermission } from "@/lib/auth";
import { sendProjectEmail } from "@/lib/email";
import { projectTaskPriorities, projectTaskStatuses, type ProjectTaskStatus } from "@/lib/project-tasks";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import type { Priority, UserProfile } from "@/lib/types";

const BUCKET = "project-files";
const MAX_ATTACHMENT_SIZE = 250 * 1024 * 1024;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://pinarespm.venadigital.com.co";

type TaskLinkType = "finding" | "risk";

export async function createProjectTaskAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureTaskAccess(profile, "create");

  const payload = parseTaskPayload(formData);
  if (!payload.title) redirect("/tareas?error=Completa el titulo de la tarea");

  const assigneeIds = parseIds(formData, "assigneeIds");
  const links = parseTaskLinks(formData);
  const admin = getAdminOrRedirect();

  const { data: task, error } = await admin.from("project_tasks").insert({ ...payload, created_by: profile.id }).select("id, title, description").single();
  if (error || !task) redirect(`/tareas?error=${encodeURIComponent(error?.message ?? "No se pudo crear la tarea")}`);

  await replaceAssignees(task.id, assigneeIds);
  await replaceTaskLinks(task.id, links);
  await uploadTaskAttachments(formData.getAll("attachments"), task.id, profile.id);
  await notifyAssignees({ taskId: task.id, title: task.title, description: task.description ?? "", assigneeIds, authorName: profile.name });

  revalidateTasks();
  redirect("/tareas?created=1");
}

export async function updateProjectTaskAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureTaskAccess(profile, "edit");

  const taskId = String(formData.get("taskId") ?? "").trim();
  if (!taskId) redirect("/tareas?error=No se encontro la tarea");

  const payload = parseTaskPayload(formData);
  if (!payload.title) redirect("/tareas?error=Completa el titulo de la tarea");

  const assigneeIds = parseIds(formData, "assigneeIds");
  const links = parseTaskLinks(formData);
  const admin = getAdminOrRedirect();
  const { data: currentAssignees } = await admin.from("project_task_assignees").select("profile_id").eq("task_id", taskId);
  const previousAssigneeIds = new Set((currentAssignees ?? []).map((row) => row.profile_id));

  const { data: task, error } = await admin
    .from("project_tasks")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .select("id, title, description")
    .single();

  if (error || !task) redirect(`/tareas?error=${encodeURIComponent(error?.message ?? "No se pudo actualizar la tarea")}`);

  await replaceAssignees(taskId, assigneeIds);
  await replaceTaskLinks(taskId, links);
  await uploadTaskAttachments(formData.getAll("attachments"), taskId, profile.id);

  const newAssigneeIds = assigneeIds.filter((id) => !previousAssigneeIds.has(id));
  await notifyAssignees({ taskId, title: task.title, description: task.description ?? "", assigneeIds: newAssigneeIds, authorName: profile.name });

  revalidateTasks();
  redirect("/tareas?updated=1");
}

export async function createProjectTaskCommentAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureTaskAccess(profile, "edit");

  const taskId = String(formData.get("taskId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!taskId) redirect("/tareas?error=No se encontro la tarea");
  if (!body) redirect("/tareas?error=Escribe un comentario antes de guardar");

  const admin = getAdminOrRedirect();
  const { error } = await admin.from("project_task_comments").insert({ task_id: taskId, author_id: profile.id, body });
  if (error) redirect(`/tareas?error=${encodeURIComponent("No se pudo comentar la tarea")}`);

  revalidateTasks();
  redirect("/tareas?commented=1");
}

export async function deleteProjectTaskAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureTaskAccess(profile, "delete");

  const taskId = String(formData.get("taskId") ?? "").trim();
  if (!taskId) redirect("/tareas?error=No se encontro la tarea");

  const admin = getAdminOrRedirect();
  const { data: attachments } = await admin.from("project_task_attachments").select("storage_path").eq("task_id", taskId);
  const paths = (attachments ?? []).map((attachment) => attachment.storage_path).filter(Boolean);
  if (paths.length > 0) await admin.storage.from(BUCKET).remove(paths);

  const { error } = await admin.from("project_tasks").delete().eq("id", taskId);
  if (error) redirect(`/tareas?error=${encodeURIComponent("No se pudo eliminar la tarea")}`);

  revalidateTasks();
  redirect("/tareas?deleted=1");
}

function parseTaskPayload(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: emptyToNull(formData.get("description")),
    phase_id: emptyToNull(formData.get("phaseId")),
    priority: normalizeEnum(formData.get("priority"), projectTaskPriorities, "Media") as Priority,
    status: normalizeEnum(formData.get("status"), projectTaskStatuses, "Pendiente") as ProjectTaskStatus,
    start_date: emptyToNull(formData.get("startDate")),
    due_date: emptyToNull(formData.get("dueDate"))
  };
}

function parseIds(formData: FormData, key: string) {
  return [...new Set(formData.getAll(key).map((value) => String(value).trim()).filter(Boolean))];
}

function parseTaskLinks(formData: FormData) {
  const findings = parseIds(formData, "findingIds").map((id) => ({ type: "finding" as const, id }));
  const risks = parseIds(formData, "riskIds").map((id) => ({ type: "risk" as const, id }));
  return [...findings, ...risks];
}

async function replaceAssignees(taskId: string, assigneeIds: string[]) {
  const admin = getAdminOrRedirect();
  await admin.from("project_task_assignees").delete().eq("task_id", taskId);
  if (assigneeIds.length === 0) return;

  const { error } = await admin.from("project_task_assignees").insert(assigneeIds.map((profileId) => ({ task_id: taskId, profile_id: profileId })));
  if (error) redirect(`/tareas?error=${encodeURIComponent("No se pudieron guardar los usuarios asignados")}`);
}

async function replaceTaskLinks(taskId: string, links: { type: TaskLinkType; id: string }[]) {
  const admin = getAdminOrRedirect();
  await admin.from("project_task_links").delete().eq("task_id", taskId);
  if (links.length === 0) return;

  const { error } = await admin.from("project_task_links").insert(links.map((link) => ({ task_id: taskId, target_type: link.type, target_id: link.id })));
  if (error) redirect(`/tareas?error=${encodeURIComponent("No se pudieron guardar los vinculos")}`);
}

async function uploadTaskAttachments(files: FormDataEntryValue[], taskId: string, uploadedBy: string) {
  const selectedFiles = files.filter((file): file is File => file instanceof File && file.size > 0);
  if (selectedFiles.length === 0) return;

  const admin = getAdminOrRedirect();
  for (const file of selectedFiles) {
    if (file.size > MAX_ATTACHMENT_SIZE) redirect(`/tareas?error=${encodeURIComponent(`El archivo ${file.name} supera el limite de 250 MB`)}`);

    const safeName = sanitizeFileName(file.name);
    const storagePath = `tareas/${taskId}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

    if (uploadError) redirect(`/tareas?error=${encodeURIComponent(`No se pudo subir ${file.name}`)}`);

    const { error: attachmentError } = await admin.from("project_task_attachments").insert({
      task_id: taskId,
      uploaded_by: uploadedBy,
      name: file.name,
      mime_type: file.type || null,
      storage_path: storagePath,
      size_bytes: file.size
    });

    if (attachmentError) {
      await admin.storage.from(BUCKET).remove([storagePath]);
      redirect(`/tareas?error=${encodeURIComponent(`No se pudo registrar ${file.name}`)}`);
    }
  }
}

async function notifyAssignees({ taskId, title, description, assigneeIds, authorName }: { taskId: string; title: string; description: string; assigneeIds: string[]; authorName: string }) {
  if (assigneeIds.length === 0) return;

  const admin = getAdminOrRedirect();
  const { data: users } = await admin.from("profiles").select("id, full_name, email").in("id", assigneeIds).eq("status", "Activo");
  const taskUrl = buildTaskUrl(taskId);

  await Promise.all((users ?? []).map((user) => sendProjectEmail({
    to: user.email,
    subject: "Nueva tarea asignada en Pinares Project Control",
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6; max-width: 640px;">
        <p>Hola ${escapeHtml(user.full_name)},</p>
        <p><strong>${escapeHtml(authorName)}</strong> te asigno una nueva tarea en <strong>Pinares Project Control</strong>.</p>
        <div style="margin: 20px 0; padding: 16px; border-left: 4px solid #3b82f6; background: #f8fbff; border-radius: 12px;">
          <p style="margin: 0 0 8px; font-weight: 700; color: #0f172a;">${escapeHtml(title)}</p>
          ${description ? `<p style="margin: 0; color: #334155;">${escapeHtml(summarize(description))}</p>` : ""}
        </div>
        <p>Puedes ingresar a la plataforma para revisar el detalle, comentar o actualizar el estado.</p>
        <p style="margin: 24px 0;">
          <a href="${escapeHtml(taskUrl)}" style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: #facc15; color: #0f172a; font-weight: 700; text-decoration: none;">
            Ver tarea en la plataforma
          </a>
        </p>
        <p style="font-size: 13px; color: #64748b;">Si el boton no abre correctamente, copia este enlace:<br/><a href="${escapeHtml(taskUrl)}" style="color: #2563eb;">${escapeHtml(taskUrl)}</a></p>
      </div>
    `
  })));
}

function ensureTaskAccess(profile: UserProfile, permission: "create" | "edit" | "delete") {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) redirect("/tareas?error=Supabase no esta configurado");
  if (!hasPermission(profile, "tareas", permission)) {
    const message = permission === "delete" ? "Solo administradores pueden eliminar tareas" : "No tienes permiso para modificar tareas";
    redirect(`/tareas?error=${encodeURIComponent(message)}`);
  }
}

function getAdminOrRedirect() {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) redirect("/tareas?error=Supabase no esta configurado");
  return createAdminClient();
}

function revalidateTasks() {
  revalidatePath("/tareas");
  revalidatePath("/dashboard");
}

function normalizeEnum<T extends string>(value: FormDataEntryValue | null, allowed: readonly T[], fallback: T): T {
  const parsed = String(value ?? "");
  return allowed.includes(parsed as T) ? (parsed as T) : fallback;
}

function emptyToNull(value: FormDataEntryValue | null) {
  const parsed = String(value ?? "").trim();
  return parsed ? parsed : null;
}

function sanitizeFileName(name: string) {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return normalized.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 140);
}

function buildTaskUrl(taskId: string) {
  const baseUrl = APP_URL.endsWith("/") ? APP_URL : `${APP_URL}/`;
  const url = new URL("tareas", baseUrl);
  url.hash = `task-${taskId}`;
  return url.toString();
}

function summarize(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 420) return normalized;
  return `${normalized.slice(0, 417)}...`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
