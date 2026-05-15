"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendProjectEmail } from "@/lib/email";
import { getCurrentProfile, hasPermission } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Priority, Status } from "@/lib/types";

const statuses: Status[] = ["No iniciado", "En progreso", "En revision", "Bloqueado", "Completado"];
const priorities: Priority[] = ["Alta", "Media", "Baja"];
const itemTypes = ["Tarea", "Hito", "Entregable"] as const;
type ItemType = (typeof itemTypes)[number];

interface ExistingTask {
  id: string;
  title: string;
  phase_id: string | null;
  owner_id: string | null;
  item_type: ItemType;
  status?: Status;
  profiles?: { full_name?: string; email?: string } | null;
}

export async function createTaskAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/cronograma?error=Configura Supabase para crear tareas reales");

  const profile = await getCurrentProfile();
  if (!hasPermission(profile, "cronograma", "create")) redirect("/cronograma?error=No tienes permiso para crear tareas");

  const payload = parseTaskPayload(formData);
  const deliverableIds = parseDeliverableIds(formData);
  if (!payload.title) redirect("/cronograma?error=El titulo de la tarea es obligatorio");

  const supabase = await createClient();
  const { data: task, error } = await supabase
    .from("tasks")
    .insert({ ...payload, created_by: profile.id })
    .select("id, title, phase_id, status, item_type, profiles:owner_id(full_name, email)")
    .single();

  if (error) redirect(`/cronograma?error=${encodeURIComponent(error.message)}`);

  const linkError = await syncTaskDeliverableLinks(supabase, task.id, deliverableIds);
  if (linkError) {
    redirect(`/cronograma?error=${encodeURIComponent(linkError)}`);
  }
  await syncLinkedDeliverableStatuses(supabase, task.id, task.item_type, task.status);

  const owner = task?.profiles as { full_name?: string; email?: string } | null;
  if (owner?.email) {
    await sendAssignmentEmail(owner.email, owner.full_name, task.title);
  }

  revalidateSchedulePaths();
  redirect("/cronograma?created=1");
}

export async function updateTaskAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/cronograma?error=Configura Supabase para editar tareas reales");

  const profile = await getCurrentProfile();
  if (!hasPermission(profile, "cronograma", "edit")) redirect("/cronograma?error=No tienes permiso para editar tareas");

  const taskId = String(formData.get("taskId") ?? "");
  const payload = parseTaskPayload(formData);
  const deliverableIds = parseDeliverableIds(formData);
  if (!taskId) redirect("/cronograma?error=No se encontro la tarea");
  if (!payload.title) redirect("/cronograma?error=El titulo de la tarea es obligatorio");

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("tasks")
    .select("id, title, phase_id, owner_id, item_type, status, profiles:owner_id(full_name, email)")
    .eq("id", taskId)
    .single<ExistingTask>();

  if (existingError || !existing) redirect(`/cronograma?error=${encodeURIComponent(existingError?.message ?? "No se encontro la tarea")}`);

  const { data: updated, error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", taskId)
    .select("id, title, phase_id, status, owner_id, item_type, profiles:owner_id(full_name, email)")
    .single();

  if (error) redirect(`/cronograma?error=${encodeURIComponent(error.message)}`);

  const linkError = await syncTaskDeliverableLinks(supabase, taskId, deliverableIds);
  if (linkError) {
    redirect(`/cronograma?error=${encodeURIComponent(linkError)}`);
  }
  const automaticStatus = await syncParentTaskStatusFromSubtasks(supabase, taskId);
  if (automaticStatus) {
    updated.status = automaticStatus;
  }
  await syncLinkedDeliverableStatuses(supabase, taskId, updated.item_type, updated.status);

  const owner = updated?.profiles as { full_name?: string; email?: string } | null;
  if (owner?.email && updated.owner_id && updated.owner_id !== existing.owner_id) {
    await sendAssignmentEmail(owner.email, owner.full_name, updated.title);
  }

  const returnPhase = getReturnPhase(formData);
  revalidateSchedulePaths();
  redirectWithScheduleFlag("edited", returnPhase);
}

export async function updateTaskStatusAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/cronograma?error=Configura Supabase para actualizar tareas reales");

  const profile = await getCurrentProfile();
  if (!hasPermission(profile, "cronograma", "edit")) redirect("/cronograma?error=No tienes permiso para editar tareas");

  const taskId = String(formData.get("taskId") ?? "");
  const status = normalizeEnum(formData.get("status"), statuses, "No iniciado");

  if (!taskId) redirect("/cronograma?error=No se encontro la tarea");

  const supabase = await createClient();
  const { data: task, error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId)
    .select("id, title, phase_id, status, item_type")
    .single();

  if (error) redirect(`/cronograma?error=${encodeURIComponent(error.message)}`);

  const automaticStatus = await syncParentTaskStatusFromSubtasks(supabase, taskId);
  const finalStatus = automaticStatus ?? status;

  if (task?.item_type === "Entregable") {
    await syncLinkedDeliverableStatuses(supabase, taskId, task.item_type, finalStatus);
  }

  const returnPhase = getReturnPhase(formData);
  revalidateSchedulePaths();
  redirectWithScheduleFlag("updated", returnPhase);
}

export async function deleteTaskAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/cronograma?error=Configura Supabase para eliminar tareas reales");

  const profile = await getCurrentProfile();
  if (!hasPermission(profile, "cronograma", "delete")) redirect("/cronograma?error=Solo Administrador Vena Digital y Administrador Pinares pueden eliminar tareas");

  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) redirect("/cronograma?error=No se encontro la tarea");

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("tasks")
    .select("id, title, phase_id, item_type")
    .eq("id", taskId)
    .single<ExistingTask>();

  if (existingError || !existing) redirect(`/cronograma?error=${encodeURIComponent(existingError?.message ?? "No se encontro la tarea")}`);

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) redirect(`/cronograma?error=${encodeURIComponent(error.message)}`);

  const returnPhase = getReturnPhase(formData);
  revalidateSchedulePaths();
  redirectWithScheduleFlag("deleted", returnPhase);
}

export async function createSubtaskAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/cronograma?error=Configura Supabase para crear subtareas reales");

  const profile = await getCurrentProfile();
  if (!hasPermission(profile, "cronograma", "edit")) redirect("/cronograma?error=No tienes permiso para editar tareas");

  const taskId = String(formData.get("taskId") ?? "").trim();
  const title = String(formData.get("subtaskTitle") ?? "").trim();
  if (!taskId) redirect("/cronograma?error=No se encontro la tarea");
  if (!title) redirect("/cronograma?error=El titulo de la subtarea es obligatorio");

  const supabase = await createClient();
  const { error } = await supabase.from("task_subtasks").insert({ task_id: taskId, title, created_by: profile.id });
  if (error) redirect(`/cronograma?error=${encodeURIComponent(error.message)}`);

  await syncComputedTaskAndDeliverableStatus(supabase, taskId);

  const returnPhase = getReturnPhase(formData);
  revalidateSchedulePaths();
  redirectWithScheduleFlag("subtask", returnPhase);
}

export async function toggleSubtaskAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/cronograma?error=Configura Supabase para editar subtareas reales");

  const profile = await getCurrentProfile();
  if (!hasPermission(profile, "cronograma", "edit")) redirect("/cronograma?error=No tienes permiso para editar tareas");

  const subtaskId = String(formData.get("subtaskId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();
  const isCompleted = String(formData.get("isCompleted") ?? "") === "true";
  if (!subtaskId || !taskId) redirect("/cronograma?error=No se encontro la subtarea");

  const supabase = await createClient();
  const { error } = await supabase
    .from("task_subtasks")
    .update({ is_completed: isCompleted, updated_at: new Date().toISOString() })
    .eq("id", subtaskId)
    .eq("task_id", taskId);

  if (error) redirect(`/cronograma?error=${encodeURIComponent(error.message)}`);

  await syncComputedTaskAndDeliverableStatus(supabase, taskId);

  const returnPhase = getReturnPhase(formData);
  revalidateSchedulePaths();
  redirectWithScheduleFlag("subtask", returnPhase);
}

export async function deleteSubtaskAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/cronograma?error=Configura Supabase para eliminar subtareas reales");

  const profile = await getCurrentProfile();
  if (!hasPermission(profile, "cronograma", "delete")) redirect("/cronograma?error=Solo administradores pueden eliminar subtareas");

  const subtaskId = String(formData.get("subtaskId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();
  if (!subtaskId || !taskId) redirect("/cronograma?error=No se encontro la subtarea");

  const supabase = await createClient();
  const { error } = await supabase.from("task_subtasks").delete().eq("id", subtaskId).eq("task_id", taskId);
  if (error) redirect(`/cronograma?error=${encodeURIComponent(error.message)}`);

  await syncComputedTaskAndDeliverableStatus(supabase, taskId);

  const returnPhase = getReturnPhase(formData);
  revalidateSchedulePaths();
  redirectWithScheduleFlag("subtask", returnPhase);
}

function parseTaskPayload(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: emptyToNull(formData.get("description")),
    phase_id: emptyToNull(formData.get("phaseId")),
    owner_id: emptyToNull(formData.get("ownerId")),
    status: normalizeEnum(formData.get("status"), statuses, "No iniciado"),
    priority: normalizeEnum(formData.get("priority"), priorities, "Media"),
    item_type: normalizeEnum(formData.get("itemType"), itemTypes, "Tarea"),
    start_date: emptyToNull(formData.get("startDate")),
    due_date: emptyToNull(formData.get("dueDate"))
  };
}

function mapTaskStatusToDeliverableStatus(status: Status) {
  const map: Record<Status, string> = {
    "No iniciado": "Pendiente",
    "En progreso": "En elaboracion",
    "En revision": "En revision interna",
    Bloqueado: "Requiere ajustes",
    Completado: "Aprobado"
  };
  return map[status];
}

async function syncTaskDeliverableLinks(supabase: Awaited<ReturnType<typeof createClient>>, taskId: string, deliverableIds: string[]) {
  const { error: deleteError } = await supabase.from("task_deliverables").delete().eq("task_id", taskId);
  if (deleteError) {
    if (deliverableIds.length === 0) return null;
    return "No se pudieron actualizar los entregables vinculados. Ejecuta la migracion task_deliverables en Supabase.";
  }

  if (deliverableIds.length === 0) return null;

  const rows = deliverableIds.map((deliverableId) => ({ task_id: taskId, deliverable_id: deliverableId }));
  const { error: insertError } = await supabase.from("task_deliverables").insert(rows);
  if (insertError) {
    return insertError.message;
  }

  return null;
}

async function syncLinkedDeliverableStatuses(supabase: Awaited<ReturnType<typeof createClient>>, taskId: string, itemType: ItemType, status: Status) {
  if (itemType !== "Entregable") return;

  const { data: links, error } = await supabase.from("task_deliverables").select("deliverable_id").eq("task_id", taskId);
  if (error || !links?.length) return;

  await supabase
    .from("deliverables")
    .update({ status: mapTaskStatusToDeliverableStatus(status) })
    .in("id", links.map((link) => link.deliverable_id));
}

async function syncComputedTaskAndDeliverableStatus(supabase: Awaited<ReturnType<typeof createClient>>, taskId: string) {
  const status = await syncParentTaskStatusFromSubtasks(supabase, taskId);
  if (!status) return;

  const { data: task } = await supabase.from("tasks").select("item_type").eq("id", taskId).single<{ item_type: ItemType }>();
  if (task?.item_type === "Entregable") {
    await syncLinkedDeliverableStatuses(supabase, taskId, task.item_type, status);
  }
}

async function syncParentTaskStatusFromSubtasks(supabase: Awaited<ReturnType<typeof createClient>>, taskId: string): Promise<Status | null> {
  const { data: subtasks, error } = await supabase.from("task_subtasks").select("is_completed").eq("task_id", taskId);
  if (error || !subtasks?.length) return null;

  const completed = subtasks.filter((subtask) => subtask.is_completed).length;
  const progress = Math.round((completed / subtasks.length) * 100);
  const status: Status = progress === 0 ? "No iniciado" : progress === 100 ? "Completado" : "En progreso";

  await supabase.from("tasks").update({ status }).eq("id", taskId);
  return status;
}

async function sendAssignmentEmail(email: string, name: string | undefined, taskTitle: string) {
  await sendProjectEmail({
    to: email,
    subject: "Nueva tarea asignada en Pinares Project Control",
    html: `<p>Hola ${name ?? ""},</p><p>Se te asigno una nueva tarea: <strong>${taskTitle}</strong>.</p>`
  });
}

function revalidateSchedulePaths() {
  revalidatePath("/cronograma");
  revalidatePath("/dashboard");
  revalidatePath("/entregables");
}

function getReturnPhase(formData: FormData) {
  const phase = String(formData.get("returnPhase") ?? "all").trim();
  return phase || "all";
}

function parseDeliverableIds(formData: FormData) {
  return Array.from(new Set(formData.getAll("deliverableIds").map((value) => String(value).trim()).filter(Boolean)));
}

function redirectWithScheduleFlag(flag: "edited" | "updated" | "deleted" | "subtask", returnPhase: string) {
  const params = new URLSearchParams({ [flag]: "1", phase: returnPhase });
  redirect(`/cronograma?${params.toString()}`);
}

function emptyToNull(value: FormDataEntryValue | null) {
  const parsed = String(value ?? "").trim();
  return parsed ? parsed : null;
}

function normalizeEnum<T extends readonly string[]>(value: FormDataEntryValue | null, allowed: T, fallback: T[number]): T[number] {
  const parsed = String(value ?? "");
  return allowed.includes(parsed) ? parsed : fallback;
}
