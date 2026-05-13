"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile, hasPermission } from "@/lib/auth";
import { findingClassifications, findingCriticalities, findingStatuses } from "@/lib/findings";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import type { Criticality } from "@/lib/types";

const BUCKET = "project-files";
const MAX_ATTACHMENT_SIZE = 250 * 1024 * 1024;

type FindingStatus = (typeof findingStatuses)[number];
type FindingClassification = (typeof findingClassifications)[number];

export async function createFindingAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureFindingsAccess(profile, "create");

  const payload = parseFindingPayload(formData);
  if (!payload.title || !payload.classification) redirect("/hallazgos?error=Completa titulo y clasificacion");

  const admin = getAdminOrRedirect();
  const { data: finding, error } = await admin
    .from("findings")
    .insert({ ...payload, identified_by: profile.id })
    .select("id")
    .single();

  if (error || !finding) redirect(`/hallazgos?error=${encodeURIComponent(error?.message ?? "No se pudo crear el hallazgo")}`);

  await uploadFindingAttachments(formData.getAll("attachments"), finding.id, profile.id);

  revalidateFindings();
  redirect("/hallazgos?created=1");
}

export async function updateFindingAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureFindingsAccess(profile, "edit");

  const findingId = String(formData.get("findingId") ?? "").trim();
  if (!findingId) redirect("/hallazgos?error=No se encontro el hallazgo");

  const payload = parseFindingPayload(formData);
  if (!payload.title || !payload.classification) redirect("/hallazgos?error=Completa titulo y clasificacion");

  const admin = getAdminOrRedirect();
  const { error } = await admin.from("findings").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", findingId);
  if (error) redirect(`/hallazgos?error=${encodeURIComponent(error.message)}`);

  await uploadFindingAttachments(formData.getAll("attachments"), findingId, profile.id);

  revalidateFindings();
  redirect("/hallazgos?updated=1");
}

export async function deleteFindingAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureFindingsAccess(profile, "delete");

  const findingId = String(formData.get("findingId") ?? "").trim();
  if (!findingId) redirect("/hallazgos?error=No se encontro el hallazgo");

  const admin = getAdminOrRedirect();
  const { data: attachments } = await admin.from("finding_attachments").select("storage_path").eq("finding_id", findingId);
  const paths = (attachments ?? []).map((attachment) => attachment.storage_path).filter(Boolean);
  if (paths.length > 0) await admin.storage.from(BUCKET).remove(paths);

  const { error } = await admin.from("findings").delete().eq("id", findingId);
  if (error) redirect(`/hallazgos?error=${encodeURIComponent("No se pudo eliminar el hallazgo")}`);

  revalidateFindings();
  redirect("/hallazgos?deleted=1");
}

export async function deleteFindingAttachmentAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureFindingsAccess(profile, "delete");

  const attachmentId = String(formData.get("attachmentId") ?? "").trim();
  if (!attachmentId) redirect("/hallazgos?error=No se encontro la evidencia");

  const admin = getAdminOrRedirect();
  const { data: attachment, error: readError } = await admin.from("finding_attachments").select("id, storage_path").eq("id", attachmentId).single();
  if (readError || !attachment) redirect("/hallazgos?error=La evidencia no existe");

  await admin.storage.from(BUCKET).remove([attachment.storage_path]);
  const { error } = await admin.from("finding_attachments").delete().eq("id", attachment.id);
  if (error) redirect(`/hallazgos?error=${encodeURIComponent("No se pudo eliminar la evidencia")}`);

  revalidateFindings();
  redirect("/hallazgos?attachmentDeleted=1");
}

function parseFindingPayload(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: emptyToNull(formData.get("description")),
    classification: normalizeEnum(formData.get("classification"), findingClassifications, "Operativo"),
    criticality: normalizeEnum(formData.get("criticality"), findingCriticalities, "Media") as Criticality,
    status: normalizeEnum(formData.get("status"), findingStatuses, "Identificado"),
    area_id: emptyToNull(formData.get("areaId"))
  };
}

async function uploadFindingAttachments(files: FormDataEntryValue[], findingId: string, uploadedBy: string) {
  const selectedFiles = files.filter((file): file is File => file instanceof File && file.size > 0);
  if (selectedFiles.length === 0) return;

  const admin = getAdminOrRedirect();
  for (const file of selectedFiles) {
    if (file.size > MAX_ATTACHMENT_SIZE) {
      redirect(`/hallazgos?error=${encodeURIComponent(`El archivo ${file.name} supera el limite de 250 MB`)}`);
    }

    const safeName = sanitizeFileName(file.name);
    const storagePath = `hallazgos/${findingId}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

    if (uploadError) redirect(`/hallazgos?error=${encodeURIComponent(`No se pudo subir ${file.name}`)}`);

    const { error: attachmentError } = await admin.from("finding_attachments").insert({
      finding_id: findingId,
      uploaded_by: uploadedBy,
      name: file.name,
      mime_type: file.type || null,
      storage_path: storagePath,
      size_bytes: file.size
    });

    if (attachmentError) {
      await admin.storage.from(BUCKET).remove([storagePath]);
      redirect(`/hallazgos?error=${encodeURIComponent(`No se pudo registrar ${file.name}`)}`);
    }
  }
}

function ensureFindingsAccess(profile: Awaited<ReturnType<typeof getCurrentProfile>>, permission: "create" | "edit" | "delete") {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) redirect("/hallazgos?error=Supabase no esta configurado");
  if (!hasPermission(profile, "hallazgos", permission)) {
    const message = permission === "delete" ? "Solo administradores pueden eliminar hallazgos o evidencias" : "No tienes permiso para modificar hallazgos";
    redirect(`/hallazgos?error=${encodeURIComponent(message)}`);
  }
}

function getAdminOrRedirect() {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) redirect("/hallazgos?error=Supabase no esta configurado");
  return createAdminClient();
}

function revalidateFindings() {
  revalidatePath("/hallazgos");
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
