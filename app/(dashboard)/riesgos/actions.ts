"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile, hasPermission } from "@/lib/auth";
import { riskCategories, riskLevels, riskLinkTypes, riskRegulations, riskStatuses, type RiskLinkType } from "@/lib/risks";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import type { RiskLevel } from "@/lib/types";

const BUCKET = "project-files";
const MAX_ATTACHMENT_SIZE = 250 * 1024 * 1024;

export async function createRiskAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureRiskAccess(profile, "create");

  const payload = parseRiskPayload(formData);
  const links = parseRiskLinks(formData);
  if (!payload.title) redirect("/riesgos?error=Completa el titulo del riesgo");
  if (links.length === 0) redirect("/riesgos?error=Selecciona al menos un vinculo para el riesgo");

  const admin = getAdminOrRedirect();
  const { data: risk, error } = await admin.from("risks").insert({ ...payload, created_by: profile.id }).select("id").single();
  if (error || !risk) redirect(`/riesgos?error=${encodeURIComponent(error?.message ?? "No se pudo crear el riesgo")}`);

  await replaceRiskLinks(risk.id, links);
  await uploadRiskAttachments(formData.getAll("attachments"), risk.id, profile.id);

  revalidateRisks();
  redirect("/riesgos?created=1");
}

export async function updateRiskAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureRiskAccess(profile, "edit");

  const riskId = String(formData.get("riskId") ?? "").trim();
  if (!riskId) redirect("/riesgos?error=No se encontro el riesgo");

  const payload = parseRiskPayload(formData);
  const links = parseRiskLinks(formData);
  if (!payload.title) redirect("/riesgos?error=Completa el titulo del riesgo");
  if (links.length === 0) redirect("/riesgos?error=Selecciona al menos un vinculo para el riesgo");

  const admin = getAdminOrRedirect();
  const { error } = await admin.from("risks").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", riskId);
  if (error) redirect(`/riesgos?error=${encodeURIComponent(error.message)}`);

  await replaceRiskLinks(riskId, links);
  await uploadRiskAttachments(formData.getAll("attachments"), riskId, profile.id);

  revalidateRisks();
  redirect("/riesgos?updated=1");
}

export async function deleteRiskAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureRiskAccess(profile, "delete");

  const riskId = String(formData.get("riskId") ?? "").trim();
  if (!riskId) redirect("/riesgos?error=No se encontro el riesgo");

  const admin = getAdminOrRedirect();
  const { data: attachments } = await admin.from("risk_attachments").select("storage_path").eq("risk_id", riskId);
  const paths = (attachments ?? []).map((attachment) => attachment.storage_path).filter(Boolean);
  if (paths.length > 0) await admin.storage.from(BUCKET).remove(paths);

  await admin.from("entity_links").delete().eq("source_type", "risk").eq("source_id", riskId);
  const { error } = await admin.from("risks").delete().eq("id", riskId);
  if (error) redirect(`/riesgos?error=${encodeURIComponent("No se pudo eliminar el riesgo")}`);

  revalidateRisks();
  redirect("/riesgos?deleted=1");
}

export async function deleteRiskAttachmentAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureRiskAccess(profile, "delete");

  const attachmentId = String(formData.get("attachmentId") ?? "").trim();
  if (!attachmentId) redirect("/riesgos?error=No se encontro el adjunto");

  const admin = getAdminOrRedirect();
  const { data: attachment, error: readError } = await admin.from("risk_attachments").select("id, storage_path").eq("id", attachmentId).single();
  if (readError || !attachment) redirect("/riesgos?error=El adjunto no existe");

  await admin.storage.from(BUCKET).remove([attachment.storage_path]);
  const { error } = await admin.from("risk_attachments").delete().eq("id", attachment.id);
  if (error) redirect(`/riesgos?error=${encodeURIComponent("No se pudo eliminar el adjunto")}`);

  revalidateRisks();
  redirect("/riesgos?attachmentDeleted=1");
}

function parseRiskPayload(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: emptyToNull(formData.get("description")),
    category: normalizeEnum(formData.get("category"), riskCategories, "Operativo"),
    level: normalizeEnum(formData.get("level"), riskLevels, "Medio") as RiskLevel,
    regulation: normalizeEnum(formData.get("regulation"), riskRegulations, "No aplica / por definir"),
    status: normalizeEnum(formData.get("status"), riskStatuses, "Abierto")
  };
}

function parseRiskLinks(formData: FormData) {
  return formData.getAll("links")
    .map((value) => String(value).split(":"))
    .filter(([type, id]) => riskLinkTypes.includes(type as RiskLinkType) && Boolean(id))
    .map(([type, id]) => ({ type: type as RiskLinkType, id }));
}

async function replaceRiskLinks(riskId: string, links: { type: RiskLinkType; id: string }[]) {
  const admin = getAdminOrRedirect();
  await admin.from("entity_links").delete().eq("source_type", "risk").eq("source_id", riskId);

  const rows = links.map((link) => ({ source_type: "risk", source_id: riskId, target_type: link.type, target_id: link.id }));
  if (rows.length === 0) return;

  const { error } = await admin.from("entity_links").insert(rows);
  if (error) redirect(`/riesgos?error=${encodeURIComponent("No se pudieron guardar los vinculos del riesgo")}`);
}

async function uploadRiskAttachments(files: FormDataEntryValue[], riskId: string, uploadedBy: string) {
  const selectedFiles = files.filter((file): file is File => file instanceof File && file.size > 0);
  if (selectedFiles.length === 0) return;

  const admin = getAdminOrRedirect();
  for (const file of selectedFiles) {
    if (file.size > MAX_ATTACHMENT_SIZE) redirect(`/riesgos?error=${encodeURIComponent(`El archivo ${file.name} supera el limite de 250 MB`)}`);

    const safeName = sanitizeFileName(file.name);
    const storagePath = `riesgos/${riskId}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

    if (uploadError) redirect(`/riesgos?error=${encodeURIComponent(`No se pudo subir ${file.name}`)}`);

    const { error: attachmentError } = await admin.from("risk_attachments").insert({
      risk_id: riskId,
      uploaded_by: uploadedBy,
      name: file.name,
      mime_type: file.type || null,
      storage_path: storagePath,
      size_bytes: file.size
    });

    if (attachmentError) {
      await admin.storage.from(BUCKET).remove([storagePath]);
      redirect(`/riesgos?error=${encodeURIComponent(`No se pudo registrar ${file.name}`)}`);
    }
  }
}

function ensureRiskAccess(profile: Awaited<ReturnType<typeof getCurrentProfile>>, permission: "create" | "edit" | "delete") {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) redirect("/riesgos?error=Supabase no esta configurado");
  if (!hasPermission(profile, "riesgos", permission)) {
    const message = permission === "delete" ? "Solo administradores pueden eliminar riesgos o adjuntos" : "No tienes permiso para modificar riesgos";
    redirect(`/riesgos?error=${encodeURIComponent(message)}`);
  }
}

function getAdminOrRedirect() {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) redirect("/riesgos?error=Supabase no esta configurado");
  return createAdminClient();
}

function revalidateRisks() {
  revalidatePath("/riesgos");
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
