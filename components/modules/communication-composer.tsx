"use client";

import { Paperclip, Send, Sparkles, UploadCloud, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { createPostAction } from "@/app/(dashboard)/comunicacion/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { getMentionHandle, normalizeHandle } from "@/lib/communication-utils";
import type { UserProfile } from "@/lib/types";

interface CommunicationComposerProps {
  tags: { id: string; name: string }[];
  users: Pick<UserProfile, "id" | "name" | "email">[];
  canCreate: boolean;
}

export function CommunicationComposer({ tags, users, canCreate }: CommunicationComposerProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const knownHandles = useMemo(() => new Set(users.map((user) => getMentionHandle(user))), [users]);
  const detectedMentions = useMemo(() => getDetectedMentions(message, knownHandles), [message, knownHandles]);

  return (
    <Card className="overflow-hidden border-white/80 bg-white/75 p-0">
      <div className="border-b border-white/70 bg-white/50 p-5">
        <CardHeader eyebrow="Nueva publicacion" title="Crear mensaje" action={<Badge tone="blue">Muro general</Badge>} />
        <p className="text-sm leading-6 text-slate-600">
          Escribe una actualizacion y usa menciones tipo <span className="rounded-full bg-blueprint/10 px-2 py-0.5 font-semibold text-blueprint">@laura</span> para notificar por correo.
        </p>
      </div>

      <form action={createPostAction} className="grid gap-5 p-5">
        <fieldset disabled={!canCreate} className="grid gap-5 disabled:opacity-55">
          <section className="rounded-[1.35rem] border border-blueprint/15 bg-gradient-to-br from-blueprint/8 via-white/82 to-white/70 p-4 shadow-inner shadow-blueprint/5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-blueprint">Mensaje principal</p>
                <h3 className="mt-1 font-display text-lg font-semibold text-ink">Que quieres comunicar</h3>
              </div>
              <Sparkles className="h-4 w-4 text-blueprint" />
            </div>
            <Textarea
              name="body"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ej. @laura necesitamos validar el responsable interno antes del viernes."
              className="min-h-36 border-blueprint/15 bg-white/92 text-[0.95rem] leading-7 shadow-sm shadow-blueprint/5"
              required
            />
            <div className="mt-3 rounded-2xl border border-white/80 bg-white/72 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Vista previa</p>
                <Badge tone={detectedMentions.length > 0 ? "blue" : "neutral"}>{detectedMentions.length} menciones</Badge>
              </div>
              <p className="min-h-8 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {message ? renderPreview(message, knownHandles) : "Las menciones apareceran resaltadas aqui mientras escribes."}
              </p>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="rounded-[1.25rem] border border-white/80 bg-white/65 p-4">
              <p className="mb-3 text-sm font-semibold text-ink">Etiquetas</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="focus-within:ring-blueprint/30 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-ink/10 transition hover:bg-white">
                    <input name="tagIds" value={tag.id} type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300 accent-blueprint" />
                    {tag.name}
                  </label>
                ))}
              </div>
            </div>
            <label className="block rounded-[1.25rem] border border-white/80 bg-white/65 p-4 text-sm font-semibold text-ink">
              <span>Nueva etiqueta</span>
              <Input name="newTag" placeholder="Ej. Pendiente TI" className="mt-3 bg-white/90" />
            </label>
          </section>

          <section className="rounded-[1.35rem] border border-dashed border-blueprint/25 bg-blueprint/7 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">Adjuntar archivos</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">PDF, Word, Excel, imagenes, audios u otros soportes. Maximo 250 MB por archivo.</p>
              </div>
              <Paperclip className="h-4 w-4 text-blueprint" />
            </div>

            <input
              ref={fileInputRef}
              name="attachments"
              type="file"
              multiple
              className="sr-only"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="focus-ring flex w-full flex-col items-center justify-center rounded-2xl border border-white/80 bg-white/78 px-4 py-5 text-center shadow-sm shadow-ink/5 transition hover:-translate-y-px hover:bg-white"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-blueprint/10 text-blueprint">
                <UploadCloud className="h-5 w-5" />
              </span>
              <span className="mt-3 text-sm font-semibold text-ink">Seleccionar archivos</span>
              <span className="mt-1 text-xs text-slate-500">Haz clic para elegir uno o varios adjuntos</span>
            </button>

            {files.length > 0 ? (
              <div className="mt-3 grid gap-2">
                {files.map((file) => (
                  <div key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-3 py-2 text-sm ring-1 ring-white/80">
                    <span className="truncate font-medium text-slate-700">{file.name}</span>
                    <span className="shrink-0 text-xs font-semibold text-slate-500">{formatFileSize(file.size)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs font-medium text-slate-500">No has seleccionado archivos.</p>
            )}
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/70 pt-1">
            <button
              type="button"
              onClick={() => {
                setFiles([]);
                setMessage("");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="focus-ring inline-flex items-center gap-2 rounded-full bg-white/70 px-3.5 py-2 text-xs font-semibold text-slate-600 ring-1 ring-ink/10 transition hover:bg-white"
            >
              <X className="h-3.5 w-3.5" />
              Limpiar
            </button>
            <Button type="submit" variant="accent" className="gap-2 px-5">
              <Send className="h-4 w-4" />
              Publicar
            </Button>
          </div>
        </fieldset>
        {!canCreate ? <p className="rounded-xl bg-blueprint/10 p-3 text-sm font-medium leading-6 text-slate-600">Tu usuario puede consultar el muro, pero no tiene permiso para publicar.</p> : null}
      </form>
    </Card>
  );
}

function getDetectedMentions(text: string, knownHandles: Set<string>) {
  return [...text.matchAll(/@([a-z0-9._-]+)/gi)]
    .map((match) => normalizeHandle(match[1]))
    .filter((handle) => knownHandles.has(handle));
}

function renderPreview(text: string, knownHandles: Set<string>) {
  const parts = text.split(/(@[a-z0-9._-]+)/gi);
  return parts.map((part, index) => {
    if (!part.startsWith("@")) return <span key={`${part}-${index}`}>{part}</span>;

    const handle = normalizeHandle(part.slice(1));
    const known = knownHandles.has(handle);
    return (
      <span key={`${part}-${index}`} className={known ? "rounded-full bg-blueprint/10 px-2 py-0.5 font-semibold text-blueprint ring-1 ring-blueprint/20" : "rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-500 ring-1 ring-slate-200"}>
        {part}
      </span>
    );
  });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}
