"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile, hasPermission } from "@/lib/auth";
import { decisionStatuses } from "@/lib/decisions";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";

export async function createDecisionAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureDecisionAccess(profile, "create");

  const payload = parseDecisionPayload(formData);
  if (!payload.title) redirect("/decisiones?error=Completa el titulo de la decision");

  const admin = getAdminOrRedirect();
  const { data: decision, error } = await admin.from("decisions").insert(payload).select("id").single();
  if (error || !decision) redirect(`/decisiones?error=${encodeURIComponent(error?.message ?? "No se pudo crear la decision")}`);

  await replaceDecisionDocuments(decision.id, parseDocumentLinks(formData));

  revalidateDecisions();
  redirect("/decisiones?created=1");
}

export async function updateDecisionAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureDecisionAccess(profile, "edit");

  const decisionId = String(formData.get("decisionId") ?? "").trim();
  if (!decisionId) redirect("/decisiones?error=No se encontro la decision");

  const payload = parseDecisionPayload(formData);
  if (!payload.title) redirect("/decisiones?error=Completa el titulo de la decision");

  const admin = getAdminOrRedirect();
  const { error } = await admin.from("decisions").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", decisionId);
  if (error) redirect(`/decisiones?error=${encodeURIComponent(error.message)}`);

  await replaceDecisionDocuments(decisionId, parseDocumentLinks(formData));

  revalidateDecisions();
  redirect("/decisiones?updated=1");
}

export async function deleteDecisionAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureDecisionAccess(profile, "delete");

  const decisionId = String(formData.get("decisionId") ?? "").trim();
  if (!decisionId) redirect("/decisiones?error=No se encontro la decision");

  const admin = getAdminOrRedirect();
  await admin.from("entity_links").delete().eq("source_type", "decision").eq("source_id", decisionId);
  const { error } = await admin.from("decisions").delete().eq("id", decisionId);
  if (error) redirect(`/decisiones?error=${encodeURIComponent("No se pudo eliminar la decision")}`);

  revalidateDecisions();
  redirect("/decisiones?deleted=1");
}

function parseDecisionPayload(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: emptyToNull(formData.get("description")),
    decision_date: emptyToNull(formData.get("decisionDate")),
    participants: emptyToNull(formData.get("participants")),
    context: emptyToNull(formData.get("context")),
    alternatives: emptyToNull(formData.get("alternatives")),
    decision_taken: emptyToNull(formData.get("decisionTaken")),
    owner_id: emptyToNull(formData.get("ownerId")),
    status: normalizeEnum(formData.get("status"), decisionStatuses, "Pendiente")
  };
}

function parseDocumentLinks(formData: FormData) {
  return formData.getAll("documentIds").map((value) => String(value).trim()).filter(Boolean);
}

async function replaceDecisionDocuments(decisionId: string, documentIds: string[]) {
  const admin = getAdminOrRedirect();
  await admin.from("entity_links").delete().eq("source_type", "decision").eq("source_id", decisionId).eq("target_type", "file");

  if (documentIds.length === 0) return;

  const rows = Array.from(new Set(documentIds)).map((documentId) => ({
    source_type: "decision",
    source_id: decisionId,
    target_type: "file",
    target_id: documentId
  }));

  const { error } = await admin.from("entity_links").insert(rows);
  if (error) redirect(`/decisiones?error=${encodeURIComponent("No se pudieron vincular los documentos")}`);
}

function ensureDecisionAccess(profile: Awaited<ReturnType<typeof getCurrentProfile>>, permission: "create" | "edit" | "delete") {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) redirect("/decisiones?error=Supabase no esta configurado");
  if (!hasPermission(profile, "decisiones", permission)) {
    const message = permission === "delete" ? "Solo administradores pueden eliminar decisiones" : "No tienes permiso para modificar decisiones";
    redirect(`/decisiones?error=${encodeURIComponent(message)}`);
  }
}

function getAdminOrRedirect() {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) redirect("/decisiones?error=Supabase no esta configurado");
  return createAdminClient();
}

function revalidateDecisions() {
  revalidatePath("/decisiones");
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
