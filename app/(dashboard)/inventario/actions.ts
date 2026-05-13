"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile, hasPermission } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import type { Currency, TrafficLight } from "@/lib/types";

const BUCKET = "project-files";
const MAX_ATTACHMENT_SIZE = 250 * 1024 * 1024;
const currencies: Currency[] = ["COP", "USD"];
const lights: TrafficLight[] = ["Verde", "Amarillo", "Rojo"];

export async function createToolAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureInventoryAccess(profile, "create");

  const payload = parseToolPayload(formData);
  if (!payload.name || !payload.internal_owner) {
    redirect("/inventario?error=Completa nombre y responsable interno");
  }

  const admin = getAdminOrRedirect();
  const { data: tool, error } = await admin.from("technology_tools").insert(payload).select("id").single();
  if (error || !tool) redirect(`/inventario?error=${encodeURIComponent(error?.message ?? "No se pudo crear la herramienta")}`);

  await uploadToolAttachments(formData.getAll("attachments"), tool.id, profile.id);

  revalidateInventory();
  redirect("/inventario?created=1");
}

export async function updateToolAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureInventoryAccess(profile, "edit");

  const toolId = String(formData.get("toolId") ?? "").trim();
  if (!toolId) redirect("/inventario?error=No se encontro la herramienta");

  const payload = parseToolPayload(formData);
  if (!payload.name || !payload.internal_owner) {
    redirect("/inventario?error=Completa nombre y responsable interno");
  }

  const admin = getAdminOrRedirect();
  const { error } = await admin.from("technology_tools").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", toolId);
  if (error) redirect(`/inventario?error=${encodeURIComponent(error.message)}`);

  await uploadToolAttachments(formData.getAll("attachments"), toolId, profile.id);

  revalidateInventory();
  redirect("/inventario?updated=1");
}

export async function deleteToolAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureInventoryAccess(profile, "delete");

  const toolId = String(formData.get("toolId") ?? "").trim();
  if (!toolId) redirect("/inventario?error=No se encontro la herramienta");

  const admin = getAdminOrRedirect();
  const { data: attachments } = await admin.from("technology_tool_attachments").select("storage_path").eq("tool_id", toolId);
  const paths = (attachments ?? []).map((attachment) => attachment.storage_path).filter(Boolean);
  if (paths.length > 0) await admin.storage.from(BUCKET).remove(paths);

  const { error } = await admin.from("technology_tools").delete().eq("id", toolId);
  if (error) redirect(`/inventario?error=${encodeURIComponent("No se pudo eliminar la herramienta")}`);

  revalidateInventory();
  redirect("/inventario?deleted=1");
}

export async function deleteToolAttachmentAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureInventoryAccess(profile, "delete");

  const attachmentId = String(formData.get("attachmentId") ?? "").trim();
  if (!attachmentId) redirect("/inventario?error=No se encontro el adjunto");

  const admin = getAdminOrRedirect();
  const { data: attachment, error: readError } = await admin.from("technology_tool_attachments").select("id, storage_path").eq("id", attachmentId).single();
  if (readError || !attachment) redirect("/inventario?error=El adjunto no existe");

  await admin.storage.from(BUCKET).remove([attachment.storage_path]);
  const { error } = await admin.from("technology_tool_attachments").delete().eq("id", attachment.id);
  if (error) redirect(`/inventario?error=${encodeURIComponent("No se pudo eliminar el adjunto")}`);

  revalidateInventory();
  redirect("/inventario?attachmentDeleted=1");
}

function parseToolPayload(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    provider: emptyToNull(formData.get("provider")) ?? "No especificado",
    cost: Number(String(formData.get("cost") ?? "0").replace(",", ".")) || 0,
    currency: normalizeEnum(formData.get("currency"), currencies, "COP"),
    license_type: emptyToNull(formData.get("licenseType")) ?? "No especificado",
    user_count: Math.max(0, Number(formData.get("userCount") ?? 0) || 0),
    internal_owner: String(formData.get("internalOwner") ?? "").trim(),
    area_names: formData.getAll("areas").map((value) => String(value).trim()).filter(Boolean),
    contracted_features: emptyToNull(formData.get("contractedFeatures")),
    used_features: emptyToNull(formData.get("usedFeatures")),
    integrations: emptyToNull(formData.get("integrations")),
    api_available: String(formData.get("apiAvailable") ?? "false") === "true",
    usage_light: normalizeEnum(formData.get("usageLight"), lights, "Amarillo"),
    user_satisfaction: clamp(Number(formData.get("userSatisfaction") ?? 1) || 1, 1, 5),
    associated_risks: emptyToNull(formData.get("associatedRisks"))
  };
}

async function uploadToolAttachments(files: FormDataEntryValue[], toolId: string, uploadedBy: string) {
  const selectedFiles = files.filter((file): file is File => file instanceof File && file.size > 0);
  if (selectedFiles.length === 0) return;

  const admin = getAdminOrRedirect();
  for (const file of selectedFiles) {
    if (file.size > MAX_ATTACHMENT_SIZE) {
      redirect(`/inventario?error=${encodeURIComponent(`El archivo ${file.name} supera el limite de 250 MB`)}`);
    }

    const safeName = sanitizeFileName(file.name);
    const storagePath = `inventario/herramientas/${toolId}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

    if (uploadError) redirect(`/inventario?error=${encodeURIComponent(`No se pudo subir ${file.name}`)}`);

    const { error: attachmentError } = await admin.from("technology_tool_attachments").insert({
      tool_id: toolId,
      uploaded_by: uploadedBy,
      name: file.name,
      mime_type: file.type || null,
      storage_path: storagePath,
      size_bytes: file.size
    });

    if (attachmentError) {
      await admin.storage.from(BUCKET).remove([storagePath]);
      redirect(`/inventario?error=${encodeURIComponent(`No se pudo registrar ${file.name}`)}`);
    }
  }
}

function ensureInventoryAccess(profile: Awaited<ReturnType<typeof getCurrentProfile>>, permission: "create" | "edit" | "delete") {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) redirect("/inventario?error=Supabase no esta configurado");
  if (!hasPermission(profile, "inventario", permission)) {
    const message = permission === "delete" ? "Solo administradores pueden eliminar herramientas o adjuntos" : "No tienes permiso para modificar el inventario";
    redirect(`/inventario?error=${encodeURIComponent(message)}`);
  }
}

function getAdminOrRedirect() {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) redirect("/inventario?error=Supabase no esta configurado");
  return createAdminClient();
}

function revalidateInventory() {
  revalidatePath("/inventario");
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function sanitizeFileName(name: string) {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return normalized.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 140);
}
