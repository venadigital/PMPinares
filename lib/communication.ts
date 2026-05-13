import { wallPosts as demoWallPosts, users as demoUsers } from "@/lib/data";
import { getMentionHandle, normalizeHandle } from "@/lib/communication-utils";
import { formatFileSize, getFileKind } from "@/lib/documents";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/types";

export interface CommunicationTag {
  id: string;
  name: string;
}

export interface CommunicationAttachment {
  id: string;
  name: string;
  type: string;
  size: string;
  previewUrl: string;
  downloadUrl: string;
}

export interface CommunicationComment {
  id: string;
  body: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  attachments: CommunicationAttachment[];
}

export interface CommunicationPost {
  id: string;
  body: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  tags: CommunicationTag[];
  comments: CommunicationComment[];
  attachments: CommunicationAttachment[];
}

interface PostRow {
  id: string;
  author_id: string | null;
  body: string;
  created_at: string;
  profiles?: ProfileRelation;
}

interface CommentRow {
  id: string;
  post_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
  profiles?: ProfileRelation;
}

interface TagRow {
  id: string;
  name: string;
}

interface PostTagRow {
  post_id: string;
  tag_id: string;
}

interface AttachmentRow {
  id: string;
  post_id: string | null;
  comment_id: string | null;
  name: string;
  mime_type: string | null;
  size_bytes: number;
}

type ProfileRelation = { full_name: string; email: string } | { full_name: string; email: string }[] | null;

export async function getCommunicationData(): Promise<{
  posts: CommunicationPost[];
  tags: CommunicationTag[];
  users: UserProfile[];
}> {
  if (!isSupabaseConfigured()) {
    return {
      posts: demoWallPosts.map((post) => ({
        id: post.id,
        body: post.message,
        authorName: post.author,
        authorEmail: "",
        createdAt: post.time,
        tags: [{ id: post.label, name: post.label }],
        comments: [],
        attachments: Array.from({ length: post.attachments }).map((_, index) => ({
          id: `${post.id}-${index}`,
          name: `Adjunto ${index + 1}`,
          type: "Archivo",
          size: "",
          previewUrl: "#",
          downloadUrl: "#"
        }))
      })),
      tags: ["Urgente", "Pregunta", "Pendiente Pinares", "Decision", "Riesgo"].map((name) => ({ id: name, name })),
      users: demoUsers
    };
  }

  const supabase = await createClient();
  const [postsResult, commentsResult, tagsResult, postTagsResult, attachmentsResult, usersResult] = await Promise.all([
    supabase.from("wall_posts").select("id, author_id, body, created_at, profiles:author_id(full_name, email)").order("created_at", { ascending: false }),
    supabase.from("wall_comments").select("id, post_id, author_id, body, created_at, profiles:author_id(full_name, email)").order("created_at", { ascending: true }),
    supabase.from("tags").select("id, name").order("name"),
    supabase.from("wall_post_tags").select("post_id, tag_id"),
    supabase.from("wall_attachments").select("id, post_id, comment_id, name, mime_type, size_bytes").order("created_at", { ascending: true }),
    supabase.from("profiles").select("id, full_name, email, role, organization, position, area, status, module_permissions(module_key, can_view)").eq("status", "Activo").order("full_name")
  ]);

  const tags = ((tagsResult.data ?? []) as TagRow[]).map((tag) => ({ id: tag.id, name: tag.name }));
  const postTags = (postTagsResult.data ?? []) as PostTagRow[];
  const comments = (commentsResult.data ?? []) as unknown as CommentRow[];
  const attachments = (attachmentsResult.data ?? []) as AttachmentRow[];

  const users = (usersResult.data ?? []).map((profile) => ({
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    role: profile.role,
    organization: profile.organization,
    position: profile.position ?? "",
    area: profile.area ?? "",
    status: profile.status,
    moduleAccess: (profile.module_permissions ?? []).filter((permission) => permission.can_view).map((permission) => permission.module_key)
  }));

  return {
    posts: ((postsResult.data ?? []) as unknown as PostRow[]).map((post) => {
      const profile = firstRelation(post.profiles);
      const linkedTagIds = postTags.filter((link) => link.post_id === post.id).map((link) => link.tag_id);
      const postComments = comments.filter((comment) => comment.post_id === post.id);

      return {
        id: post.id,
        body: post.body,
        authorName: profile?.full_name ?? "Usuario sin nombre",
        authorEmail: profile?.email ?? "",
        createdAt: formatCommunicationDate(post.created_at),
        tags: tags.filter((tag) => linkedTagIds.includes(tag.id)),
        attachments: attachments.filter((attachment) => attachment.post_id === post.id).map(mapAttachment),
        comments: postComments.map((comment) => {
          const commentProfile = firstRelation(comment.profiles);
          return {
            id: comment.id,
            body: comment.body,
            authorName: commentProfile?.full_name ?? "Usuario sin nombre",
            authorEmail: commentProfile?.email ?? "",
            createdAt: formatCommunicationDate(comment.created_at),
            attachments: attachments.filter((attachment) => attachment.comment_id === comment.id).map(mapAttachment)
          };
        })
      };
    }),
    tags,
    users
  };
}

export { getMentionHandle, normalizeHandle };

function mapAttachment(attachment: AttachmentRow): CommunicationAttachment {
  return {
    id: attachment.id,
    name: attachment.name,
    type: getFileKind({ mimeType: attachment.mime_type, name: attachment.name }),
    size: formatFileSize(attachment.size_bytes),
    previewUrl: `/comunicacion/attachments/${attachment.id}/preview`,
    downloadUrl: `/comunicacion/attachments/${attachment.id}/download`
  };
}

function formatCommunicationDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
