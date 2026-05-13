import { AtSign, Download, Eye, FileText, MessageSquare, Paperclip, Send, Trash2 } from "lucide-react";
import { createCommentAction, deleteCommentAction, deletePostAction } from "@/app/(dashboard)/comunicacion/actions";
import { CommunicationComposer } from "@/components/modules/communication-composer";
import { CommunicationTabs } from "@/components/modules/communication-tabs";
import { PageHeader } from "@/components/modules/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { getCurrentProfile, hasPermission } from "@/lib/auth";
import { getCommunicationData, type CommunicationAttachment, type CommunicationPost } from "@/lib/communication";
import { getMentionHandle, normalizeHandle } from "@/lib/communication-utils";

interface CommunicationPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CommunicationPage({ searchParams }: CommunicationPageProps) {
  const params = searchParams ? await searchParams : {};
  const [{ posts, tags, users }, profile] = await Promise.all([getCommunicationData(), getCurrentProfile()]);
  const canView = hasPermission(profile, "comunicacion", "view");
  const canCreate = hasPermission(profile, "comunicacion", "create");
  const canDelete = hasPermission(profile, "comunicacion", "delete");
  const error = typeof params.error === "string" ? params.error : null;

  if (!canView) {
    return (
      <>
        <PageHeader eyebrow="Muro general" title="Comunicacion" description="Tu usuario no tiene acceso al modulo de comunicacion." />
        <Card>
          <p className="font-medium text-slate-600">Solicita acceso al Administrador Vena Digital si necesitas participar en el muro del proyecto.</p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Muro general"
        title="Comunicacion"
        description="Trazabilidad formal del proyecto con publicaciones, comentarios, adjuntos, etiquetas y menciones por correo."
      />

      <StatusMessages
        error={error}
        posted={params.posted === "1"}
        commented={params.commented === "1"}
        deleted={params.deleted === "1"}
      />

      <CommunicationTabs
        postCount={posts.length}
        createPanel={
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_21rem]">
            <CommunicationComposer tags={tags} users={users} canCreate={canCreate} />
            <MentionPanel users={users} />
          </section>
        }
        tracePanel={<ConversationPanel posts={posts} canCreate={canCreate} canDelete={canDelete} />}
      />
    </>
  );
}

function StatusMessages({ error, posted, commented, deleted }: { error: string | null; posted: boolean; commented: boolean; deleted: boolean }) {
  return (
    <>
      {error ? <p className="mb-5 rounded-2xl bg-coral/10 p-4 text-sm font-bold text-coral">{error}</p> : null}
      {posted ? <p className="mb-5 rounded-2xl bg-emerald-500/10 p-4 text-sm font-bold text-emerald-700">Publicacion creada correctamente.</p> : null}
      {commented ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Comentario agregado correctamente.</p> : null}
      {deleted ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Elemento eliminado correctamente.</p> : null}
    </>
  );
}

function MentionPanel({ users }: { users: { id: string; name: string; email: string; role: string; area: string }[] }) {
  return (
    <Card className="border-white/80 bg-white/75">
      <CardHeader eyebrow="Menciones" title="Usuarios disponibles" action={<AtSign className="h-4 w-4 text-blueprint" />} />
      <div className="grid gap-2.5">
        {users.map((user) => {
          const handle = getMentionHandle(user);
          return (
          <div key={user.id} id={`mention-${handle}`} className="rounded-2xl bg-white/65 p-3 ring-1 ring-ink/5">
            <p className="text-sm font-semibold text-ink">{user.name}</p>
            <p className="mt-1 text-xs font-medium text-blueprint">@{handle}</p>
            <p className="mt-1 truncate text-xs text-slate-500">{user.area || user.role}</p>
          </div>
        );
        })}
      </div>
    </Card>
  );
}

function ConversationPanel({ posts, canCreate, canDelete }: { posts: CommunicationPost[]; canCreate: boolean; canDelete: boolean }) {
  return (
    <Card className="overflow-hidden border-white/80 bg-white/75 p-0">
      <div className="border-b border-white/70 p-5">
        <CardHeader
          eyebrow="Trazabilidad"
          title="Conversaciones del proyecto"
          action={<Badge tone="yellow">{posts.length} publicaciones</Badge>}
        />
        <p className="text-sm leading-6 text-slate-600">
          Usa este muro para preguntas, decisiones, riesgos y pendientes generales que deban quedar documentados.
        </p>
      </div>

      {posts.length === 0 ? (
        <EmptyWall />
      ) : (
        <div className="grid gap-4 p-4 sm:p-5">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} canCreate={canCreate} canDelete={canDelete} />
          ))}
        </div>
      )}
    </Card>
  );
}

function PostCard({ post, canCreate, canDelete }: { post: CommunicationPost; canCreate: boolean; canDelete: boolean }) {
  return (
    <article className="rounded-[1.4rem] border border-white/80 bg-white/70 p-4 shadow-sm shadow-ink/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {post.tags.length > 0 ? post.tags.map((tag) => <Badge key={tag.id} tone={tagTone(tag.name)}>{tag.name}</Badge>) : <Badge tone="neutral">Sin etiqueta</Badge>}
          </div>
          <p className="mt-3 font-semibold text-ink">{post.authorName}</p>
          <p className="text-xs font-medium text-slate-500">{post.createdAt}</p>
        </div>
        {canDelete ? (
          <form action={deletePostAction}>
            <input type="hidden" name="postId" value={post.id} />
            <button className="focus-ring grid h-9 w-9 place-items-center rounded-full bg-coral/10 text-coral ring-1 ring-coral/20 transition hover:bg-coral hover:text-white" aria-label="Eliminar publicacion">
              <Trash2 className="h-4 w-4" />
            </button>
          </form>
        ) : null}
      </div>

      <RichText className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700" text={post.body} />
      <AttachmentList attachments={post.attachments} />

      <div className="mt-4 rounded-2xl bg-ink/5 p-3.5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
            <MessageSquare className="h-4 w-4 text-blueprint" />
            Comentarios
          </p>
          <Badge tone="neutral">{post.comments.length}</Badge>
        </div>

        {post.comments.length > 0 ? (
          <div className="mb-4 grid gap-3">
            {post.comments.map((comment) => (
              <div key={comment.id} className="rounded-2xl bg-white/75 p-3 ring-1 ring-white/80">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{comment.authorName}</p>
                    <p className="text-xs font-medium text-slate-500">{comment.createdAt}</p>
                  </div>
                  {canDelete ? (
                    <form action={deleteCommentAction}>
                      <input type="hidden" name="commentId" value={comment.id} />
                      <button className="focus-ring grid h-8 w-8 place-items-center rounded-full text-coral transition hover:bg-coral/10" aria-label="Eliminar comentario">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  ) : null}
                </div>
                <RichText className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700" text={comment.body} />
                <AttachmentList attachments={comment.attachments} compact />
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-4 rounded-xl bg-white/65 p-3 text-sm font-medium text-slate-500">Aun no hay comentarios en esta publicacion.</p>
        )}

        <CommentForm postId={post.id} canCreate={canCreate} />
      </div>
    </article>
  );
}

function CommentForm({ postId, canCreate }: { postId: string; canCreate: boolean }) {
  return (
    <form action={createCommentAction} className="grid gap-3">
      <fieldset disabled={!canCreate} className="grid gap-3 disabled:opacity-55">
        <input type="hidden" name="postId" value={postId} />
        <Textarea name="body" placeholder="Responder o mencionar a alguien con @usuario..." className="min-h-20 bg-white/80" required />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-ink/10">
            <Paperclip className="h-3.5 w-3.5 text-blueprint" />
            Adjuntar
            <input name="attachments" type="file" multiple className="sr-only" />
          </label>
          <Button type="submit" variant="primary" className="gap-2 px-3.5 py-1.5 text-xs">
            <Send className="h-3.5 w-3.5" />
            Comentar
          </Button>
        </div>
      </fieldset>
    </form>
  );
}

function AttachmentList({ attachments, compact = false }: { attachments: CommunicationAttachment[]; compact?: boolean }) {
  if (attachments.length === 0) return null;

  return (
    <div className={compact ? "mt-3 grid gap-2" : "mt-4 grid gap-2 sm:grid-cols-2"}>
      {attachments.map((attachment) => (
        <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-xl bg-blueprint/10 p-3 ring-1 ring-blueprint/10">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{attachment.name}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">{attachment.type} · {attachment.size}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <a href={attachment.previewUrl} target="_blank" className="focus-ring grid h-8 w-8 place-items-center rounded-full bg-white/70 text-blueprint ring-1 ring-blueprint/10" aria-label={`Ver ${attachment.name}`}>
              <Eye className="h-3.5 w-3.5" />
            </a>
            <a href={attachment.downloadUrl} className="focus-ring grid h-8 w-8 place-items-center rounded-full bg-white/70 text-ink ring-1 ring-ink/10" aria-label={`Descargar ${attachment.name}`}>
              <Download className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyWall() {
  return (
    <div className="p-6">
      <div className="rounded-[1.5rem] border border-dashed border-blueprint/25 bg-white/62 p-8 text-center">
        <FileText className="mx-auto h-9 w-9 text-blueprint" />
        <p className="mt-4 font-display text-xl font-bold text-ink">Aun no hay publicaciones</p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Cuando el equipo publique preguntas, decisiones o riesgos, apareceran aqui como trazabilidad formal del proyecto.
        </p>
      </div>
    </div>
  );
}

function tagTone(name: string): "neutral" | "blue" | "yellow" | "red" | "green" {
  const normalized = name.toLowerCase();
  if (normalized.includes("riesgo") || normalized.includes("urgente")) return "red";
  if (normalized.includes("decision")) return "yellow";
  if (normalized.includes("pendiente")) return "green";
  if (normalized.includes("pregunta")) return "blue";
  return "neutral";
}

function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(@[a-z0-9._-]+)/gi);
  return (
    <p className={className}>
      {parts.map((part, index) => {
        if (!part.startsWith("@")) return <span key={`${part}-${index}`}>{part}</span>;
        const handle = normalizeHandle(part.slice(1));
        return (
          <a key={`${part}-${index}`} href={`#mention-${handle}`} className="rounded-full bg-blueprint/10 px-2 py-0.5 font-semibold text-blueprint ring-1 ring-blueprint/20 transition hover:bg-blueprint hover:text-white">
            {part}
          </a>
        );
      })}
    </p>
  );
}
