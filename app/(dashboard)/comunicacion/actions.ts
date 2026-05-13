"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile, hasPermission } from "@/lib/auth";
import { getMentionHandle, normalizeHandle } from "@/lib/communication-utils";
import { sendProjectEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import type { UserProfile } from "@/lib/types";

const BUCKET = "project-files";
const MAX_ATTACHMENT_SIZE = 250 * 1024 * 1024;

export async function createPostAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureCommunicationAccess(profile, "create");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) redirect("/comunicacion?error=Escribe una actualizacion antes de publicar");

  const admin = getAdminOrRedirect();
  const { data: post, error } = await admin
    .from("wall_posts")
    .insert({ body, author_id: profile.id })
    .select("id")
    .single();

  if (error || !post) redirect(`/comunicacion?error=${encodeURIComponent(error?.message ?? "No se pudo publicar")}`);

  await syncPostTags(formData, post.id);
  await uploadAttachments(formData.getAll("attachments"), { postId: post.id, uploadedBy: profile.id });
  await notifyMentions(body, profile);

  revalidatePath("/comunicacion");
  redirect("/comunicacion?posted=1");
}

export async function createCommentAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureCommunicationAccess(profile, "create");

  const postId = String(formData.get("postId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!postId) redirect("/comunicacion?error=No se encontro la publicacion");
  if (!body) redirect("/comunicacion?error=Escribe un comentario antes de responder");

  const admin = getAdminOrRedirect();
  const { data: comment, error } = await admin
    .from("wall_comments")
    .insert({ post_id: postId, body, author_id: profile.id })
    .select("id")
    .single();

  if (error || !comment) redirect(`/comunicacion?error=${encodeURIComponent(error?.message ?? "No se pudo comentar")}`);

  await uploadAttachments(formData.getAll("attachments"), { commentId: comment.id, uploadedBy: profile.id });
  await notifyMentions(body, profile);

  revalidatePath("/comunicacion");
  redirect("/comunicacion?commented=1");
}

export async function deletePostAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureCommunicationAccess(profile, "delete");

  const postId = String(formData.get("postId") ?? "").trim();
  if (!postId) redirect("/comunicacion?error=No se encontro la publicacion");

  const admin = getAdminOrRedirect();
  await removeAttachmentsForPost(postId);

  const { error } = await admin.from("wall_posts").delete().eq("id", postId);
  if (error) redirect(`/comunicacion?error=${encodeURIComponent("No se pudo eliminar la publicacion")}`);

  revalidatePath("/comunicacion");
  redirect("/comunicacion?deleted=1");
}

export async function deleteCommentAction(formData: FormData) {
  const profile = await getCurrentProfile();
  ensureCommunicationAccess(profile, "delete");

  const commentId = String(formData.get("commentId") ?? "").trim();
  if (!commentId) redirect("/comunicacion?error=No se encontro el comentario");

  const admin = getAdminOrRedirect();
  await removeAttachmentsForComment(commentId);

  const { error } = await admin.from("wall_comments").delete().eq("id", commentId);
  if (error) redirect(`/comunicacion?error=${encodeURIComponent("No se pudo eliminar el comentario")}`);

  revalidatePath("/comunicacion");
  redirect("/comunicacion?deleted=1");
}

function ensureCommunicationAccess(profile: UserProfile, permission: "create" | "delete") {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) redirect("/comunicacion?error=Supabase no esta configurado");
  if (!hasPermission(profile, "comunicacion", permission)) {
    const message = permission === "delete" ? "Solo administradores pueden eliminar publicaciones o comentarios" : "No tienes permiso para publicar en comunicacion";
    redirect(`/comunicacion?error=${encodeURIComponent(message)}`);
  }
}

function getAdminOrRedirect() {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) redirect("/comunicacion?error=Supabase no esta configurado");
  return createAdminClient();
}

async function syncPostTags(formData: FormData, postId: string) {
  const admin = getAdminOrRedirect();
  const tagIds = formData.getAll("tagIds").map((value) => String(value).trim()).filter(Boolean);
  const newTag = String(formData.get("newTag") ?? "").trim();

  if (newTag) {
    const { data: tag, error } = await admin.from("tags").upsert({ name: newTag }, { onConflict: "name" }).select("id").single();
    if (!error && tag?.id) tagIds.push(tag.id);
  }

  const uniqueTagIds = [...new Set(tagIds)];
  if (uniqueTagIds.length === 0) return;

  const { error } = await admin.from("wall_post_tags").insert(uniqueTagIds.map((tagId) => ({ post_id: postId, tag_id: tagId })));
  if (error) redirect(`/comunicacion?error=${encodeURIComponent("No se pudieron asociar las etiquetas")}`);
}

async function uploadAttachments(files: FormDataEntryValue[], parent: { postId?: string; commentId?: string; uploadedBy: string }) {
  const selectedFiles = files.filter((file): file is File => file instanceof File && file.size > 0);
  if (selectedFiles.length === 0) return;

  const admin = getAdminOrRedirect();
  for (const file of selectedFiles) {
    if (file.size > MAX_ATTACHMENT_SIZE) {
      redirect(`/comunicacion?error=${encodeURIComponent(`El archivo ${file.name} supera el limite de 250 MB`)}`);
    }

    const safeName = sanitizeFileName(file.name);
    const parentId = parent.postId ?? parent.commentId;
    const storagePath = `comunicacion/${parent.postId ? "posts" : "comments"}/${parentId}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

    if (uploadError) redirect(`/comunicacion?error=${encodeURIComponent(`No se pudo subir ${file.name}`)}`);

    const { error: attachmentError } = await admin.from("wall_attachments").insert({
      post_id: parent.postId ?? null,
      comment_id: parent.commentId ?? null,
      uploaded_by: parent.uploadedBy,
      name: file.name,
      mime_type: file.type || null,
      storage_path: storagePath,
      size_bytes: file.size
    });

    if (attachmentError) {
      await admin.storage.from(BUCKET).remove([storagePath]);
      redirect(`/comunicacion?error=${encodeURIComponent(`No se pudo registrar ${file.name}`)}`);
    }
  }
}

async function notifyMentions(body: string, author: UserProfile) {
  const admin = getAdminOrRedirect();
  const { data } = await admin.from("profiles").select("id, full_name, email, role, organization, position, area, status, module_permissions(module_key, can_view)").eq("status", "Activo");
  const users = (data ?? []).map((profile) => ({
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    role: profile.role,
    organization: profile.organization,
    position: profile.position ?? "",
    area: profile.area ?? "",
    status: profile.status,
    moduleAccess: (profile.module_permissions ?? []).filter((permission) => permission.can_view).map((permission) => permission.module_key)
  })) as UserProfile[];

  const mentionedUsers = findMentionedUsers(body, users).filter((user) => user.id !== author.id);
  await Promise.all(mentionedUsers.map((user) => sendProjectEmail({
    to: user.email,
    subject: "Te mencionaron en Pinares Project Control",
    html: `
      <p>Hola ${escapeHtml(user.name)},</p>
      <p>${escapeHtml(author.name)} te menciono en el muro de comunicacion del proyecto.</p>
      <blockquote>${escapeHtml(body)}</blockquote>
      <p>Ingresa a Pinares Project Control para responder o revisar el contexto.</p>
    `
  })));
}

function findMentionedUsers(body: string, users: UserProfile[]) {
  const handles = new Set([...body.matchAll(/@([a-z0-9._-]+)/gi)].map((match) => normalizeHandle(match[1])));
  if (handles.size === 0) return [];

  return users.filter((user) => {
    const options = new Set([
      getMentionHandle(user),
      normalizeHandle(user.name),
      normalizeHandle(user.name.replace(/\s+/g, "")),
      normalizeHandle(user.email.split("@")[0])
    ]);
    return [...options].some((handle) => handles.has(handle));
  });
}

async function removeAttachmentsForPost(postId: string) {
  const admin = getAdminOrRedirect();
  const { data } = await admin.from("wall_attachments").select("storage_path").eq("post_id", postId);
  const paths = (data ?? []).map((attachment) => attachment.storage_path).filter(Boolean);
  if (paths.length > 0) await admin.storage.from(BUCKET).remove(paths);
}

async function removeAttachmentsForComment(commentId: string) {
  const admin = getAdminOrRedirect();
  const { data } = await admin.from("wall_attachments").select("storage_path").eq("comment_id", commentId);
  const paths = (data ?? []).map((attachment) => attachment.storage_path).filter(Boolean);
  if (paths.length > 0) await admin.storage.from(BUCKET).remove(paths);
}

function sanitizeFileName(name: string) {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return normalized.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 140);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
