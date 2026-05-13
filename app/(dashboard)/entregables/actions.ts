"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { deliverableStatuses } from "@/lib/deliverables";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Deliverable } from "@/lib/types";

export async function createDeliverableAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/entregables?error=Configura Supabase para crear entregables reales");

  const profile = await getCurrentProfile();
  if (!isDeliverableAdmin(profile.role)) redirect("/entregables?error=Solo los administradores pueden crear entregables");

  const payload = parseDeliverablePayload(formData);
  if (!payload.title) redirect("/entregables?error=El titulo del entregable es obligatorio");

  const supabase = await createClient();
  const { error } = await supabase.from("deliverables").insert(payload);

  if (error) redirect(`/entregables?error=${encodeURIComponent(error.message)}`);

  revalidateDeliverablePaths();
  redirect("/entregables?created=1");
}

export async function updateDeliverableAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/entregables?error=Configura Supabase para editar entregables reales");

  const profile = await getCurrentProfile();
  if (!isDeliverableAdmin(profile.role)) redirect("/entregables?error=Solo los administradores pueden editar entregables");

  const deliverableId = String(formData.get("deliverableId") ?? "").trim();
  const payload = parseDeliverablePayload(formData);

  if (!deliverableId) redirect("/entregables?error=No se encontro el entregable");
  if (!payload.title) redirect("/entregables?error=El titulo del entregable es obligatorio");

  const supabase = await createClient();
  const { error } = await supabase.from("deliverables").update(payload).eq("id", deliverableId);

  if (error) redirect(`/entregables?error=${encodeURIComponent(error.message)}`);

  revalidateDeliverablePaths();
  redirect("/entregables?updated=1");
}

export async function deleteDeliverableAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/entregables?error=Configura Supabase para eliminar entregables reales");

  const profile = await getCurrentProfile();
  if (!isDeliverableAdmin(profile.role)) redirect("/entregables?error=Solo los administradores pueden eliminar entregables");

  const deliverableId = String(formData.get("deliverableId") ?? "").trim();
  if (!deliverableId) redirect("/entregables?error=No se encontro el entregable");

  const supabase = await createClient();
  const { error } = await supabase.from("deliverables").delete().eq("id", deliverableId);

  if (error) redirect(`/entregables?error=${encodeURIComponent(error.message)}`);

  revalidateDeliverablePaths();
  redirect("/entregables?deleted=1");
}

function parseDeliverablePayload(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    phase_id: emptyToNull(formData.get("phaseId")),
    status: normalizeStatus(formData.get("status")),
    file_id: emptyToNull(formData.get("fileId"))
  };
}

function normalizeStatus(value: FormDataEntryValue | null): Deliverable["status"] {
  const parsed = String(value ?? "");
  return deliverableStatuses.includes(parsed as Deliverable["status"]) ? parsed as Deliverable["status"] : "Pendiente";
}

function emptyToNull(value: FormDataEntryValue | null) {
  const parsed = String(value ?? "").trim();
  return parsed ? parsed : null;
}

function isDeliverableAdmin(role: string) {
  return role === "Administrador Vena Digital" || role === "Administrador Pinares";
}

function revalidateDeliverablePaths() {
  revalidatePath("/entregables");
  revalidatePath("/cronograma");
  revalidatePath("/dashboard");
}
