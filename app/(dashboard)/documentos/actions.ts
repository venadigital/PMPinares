"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentProfile } from "@/lib/auth";

const BUCKET = "project-files";
const MAX_FILE_SIZE = 250 * 1024 * 1024;

export async function createFolderAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!isDocumentAdmin(profile.role)) redirect("/documentos?error=No tienes permisos para crear carpetas");
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) redirect("/documentos?error=Supabase no esta configurado");

  const name = String(formData.get("name") ?? "").trim();
  const phaseId = emptyToNull(formData.get("phaseId"));

  if (!name) redirect("/documentos?error=El nombre de la carpeta es obligatorio");

  const admin = createAdminClient();
  const { error } = await admin.from("folders").insert({
    name,
    phase_id: phaseId,
    created_by: profile.id
  });

  if (error) redirect(`/documentos?error=${encodeURIComponent("No se pudo crear la carpeta")}`);

  revalidatePath("/documentos");
  redirect("/documentos?folderCreated=1");
}

export async function uploadDocumentAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!isDocumentAdmin(profile.role)) redirect("/documentos?error=No tienes permisos para subir archivos");
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) redirect("/documentos?error=Supabase no esta configurado");

  const file = formData.get("file");
  const folderId = String(formData.get("folderId") ?? "").trim();
  const documentName = String(formData.get("documentName") ?? "").trim();

  if (!documentName) redirect("/documentos?error=El nombre del documento es obligatorio");
  if (!(file instanceof File) || file.size === 0) redirect("/documentos?error=Selecciona un archivo valido");
  if (file.size > MAX_FILE_SIZE) redirect("/documentos?error=El archivo supera el limite de 250 MB");
  if (!folderId) redirect("/documentos?error=Selecciona una carpeta");

  const admin = createAdminClient();
  const { data: folder, error: folderError } = await admin
    .from("folders")
    .select("id, name, phase_id, phases:phase_id(code)")
    .eq("id", folderId)
    .single();

  if (folderError || !folder) redirect("/documentos?error=La carpeta seleccionada no existe");

  const safeName = sanitizeFileName(file.name);
  const phaseCode = getPhaseCode(folder.phases);
  const storagePath = `${phaseCode ?? "general"}/${folder.id}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (uploadError) redirect(`/documentos?error=${encodeURIComponent("No se pudo subir el archivo")}`);

  const displayName = normalizeDisplayName(documentName, file.name);
  const { error: fileError } = await admin.from("files").insert({
    folder_id: folder.id,
    phase_id: folder.phase_id,
    uploaded_by: profile.id,
    name: displayName,
    mime_type: file.type || null,
    storage_path: storagePath,
    size_bytes: file.size
  });

  if (fileError) {
    await admin.storage.from(BUCKET).remove([storagePath]);
    redirect(`/documentos?error=${encodeURIComponent("El archivo subio, pero no se pudo registrar")}`);
  }

  revalidatePath("/documentos");
  revalidatePath("/dashboard");
  redirect("/documentos?uploaded=1");
}

export async function deleteDocumentAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!isDocumentAdmin(profile.role)) redirect("/documentos?error=No tienes permisos para eliminar archivos");
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) redirect("/documentos?error=Supabase no esta configurado");

  const fileId = String(formData.get("fileId") ?? "").trim();
  if (!fileId) redirect("/documentos?error=Archivo no valido");

  const admin = createAdminClient();
  const { data: file, error: readError } = await admin.from("files").select("id, storage_path").eq("id", fileId).single();

  if (readError || !file) redirect("/documentos?error=El archivo no existe");

  const { error: removeError } = await admin.storage.from(BUCKET).remove([file.storage_path]);
  if (removeError) redirect(`/documentos?error=${encodeURIComponent("No se pudo eliminar el archivo del almacenamiento")}`);

  const { error: deleteError } = await admin.from("files").delete().eq("id", file.id);
  if (deleteError) redirect(`/documentos?error=${encodeURIComponent("No se pudo eliminar el registro del archivo")}`);

  revalidatePath("/documentos");
  revalidatePath("/dashboard");
  redirect("/documentos?deleted=1");
}

function isDocumentAdmin(role: string) {
  return role === "Administrador Vena Digital" || role === "Administrador Pinares";
}

function sanitizeFileName(name: string) {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return normalized.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 140);
}

function normalizeDisplayName(displayName: string, originalName: string) {
  const trimmed = displayName.replace(/\s+/g, " ").trim();
  if (/\.[a-zA-Z0-9]{1,8}$/.test(trimmed)) return trimmed.slice(0, 180);

  const extension = originalName.match(/(\.[a-zA-Z0-9]{1,8})$/)?.[1] ?? "";
  return `${trimmed}${extension}`.slice(0, 180);
}

function emptyToNull(value: FormDataEntryValue | null) {
  const parsed = String(value ?? "").trim();
  return parsed ? parsed : null;
}

function getPhaseCode(phases: unknown) {
  if (Array.isArray(phases)) return typeof phases[0]?.code === "string" ? phases[0].code : null;
  if (phases && typeof phases === "object" && "code" in phases) {
    const code = (phases as { code?: unknown }).code;
    return typeof code === "string" ? code : null;
  }
  return null;
}
