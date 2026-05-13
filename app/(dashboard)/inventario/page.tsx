import { Download, Eye, FileSpreadsheet, Paperclip, Plus, Trash2 } from "lucide-react";
import { createToolAction, deleteToolAction, deleteToolAttachmentAction, updateToolAction } from "@/app/(dashboard)/inventario/actions";
import { PageHeader } from "@/components/modules/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { getCurrentProfile, hasPermission } from "@/lib/auth";
import { getInventoryData, type InventoryTool, type ToolAttachment } from "@/lib/inventory";
import { formatCurrency } from "@/lib/utils";
import type { TrafficLight } from "@/lib/types";

interface InventoryPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const params = searchParams ? await searchParams : {};
  const [{ tools }, profile] = await Promise.all([getInventoryData(), getCurrentProfile()]);
  const canView = hasPermission(profile, "inventario", "view");
  const canCreate = hasPermission(profile, "inventario", "create");
  const canEdit = hasPermission(profile, "inventario", "edit");
  const canDelete = hasPermission(profile, "inventario", "delete");
  const error = typeof params.error === "string" ? params.error : null;

  if (!canView) {
    return (
      <>
        <PageHeader eyebrow="Stack tecnologico" title="Inventario TI" description="Tu usuario no tiene acceso al modulo de inventario." />
        <Card>
          <p className="font-medium text-slate-600">Solicita acceso al Administrador Vena Digital si necesitas consultar herramientas tecnologicas.</p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Stack tecnologico"
        title="Inventario TI"
        description="Herramientas, costos, licencias, uso, APIs, satisfaccion, semaforo de aprovechamiento y hojas de vida por herramienta."
        actionLabel="Exportar Excel"
        actionHref="/api/inventory/export"
      />

      <StatusMessages
        error={error}
        created={params.created === "1"}
        updated={params.updated === "1"}
        deleted={params.deleted === "1"}
        attachmentDeleted={params.attachmentDeleted === "1"}
      />

      <section className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <ToolCreatePanel canCreate={canCreate} />
        <InventorySummary tools={tools} />
      </section>

      <ToolList tools={tools} canEdit={canEdit} canDelete={canDelete} />
    </>
  );
}

function StatusMessages({ error, created, updated, deleted, attachmentDeleted }: { error: string | null; created: boolean; updated: boolean; deleted: boolean; attachmentDeleted: boolean }) {
  return (
    <>
      {error ? <p className="mb-5 rounded-2xl bg-coral/10 p-4 text-sm font-bold text-coral">{error}</p> : null}
      {created ? <p className="mb-5 rounded-2xl bg-emerald-500/10 p-4 text-sm font-bold text-emerald-700">Herramienta creada correctamente.</p> : null}
      {updated ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Herramienta actualizada correctamente.</p> : null}
      {deleted ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Herramienta eliminada definitivamente.</p> : null}
      {attachmentDeleted ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Adjunto eliminado correctamente.</p> : null}
    </>
  );
}

function ToolCreatePanel({ canCreate }: { canCreate: boolean }) {
  return (
    <Card className="overflow-hidden border-white/80 bg-white/75 p-0">
      <div className="border-b border-white/70 p-5">
        <CardHeader eyebrow="Nueva herramienta" title="Registrar herramienta" />
        <p className="text-sm leading-6 text-slate-600">
          Registra el resumen operativo de la herramienta. El detalle completo vive en la hoja de vida o plantilla adjunta.
        </p>
      </div>
      <ToolForm action={createToolAction} canSubmit={canCreate} submitLabel="Crear herramienta" />
    </Card>
  );
}

function InventorySummary({ tools }: { tools: InventoryTool[] }) {
  const withApi = tools.filter((tool) => tool.apiAvailable).length;
  const redTools = tools.filter((tool) => tool.trafficLight === "Rojo").length;
  const attachments = tools.reduce((sum, tool) => sum + tool.attachments.length, 0);

  return (
    <Card className="border-white/80 bg-white/75">
      <CardHeader eyebrow="Resumen" title="Estado del inventario" action={<Badge tone="yellow">{tools.length} herramientas</Badge>} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Con API" value={withApi} />
        <Metric label="Semaforo rojo" value={redTools} tone="red" />
        <Metric label="Hojas anexas" value={attachments} tone="blue" />
      </div>
      <div className="mt-4 rounded-2xl bg-white/65 p-4 ring-1 ring-white/80">
        <p className="text-sm font-semibold text-ink">Uso esperado</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Cada herramienta puede tener su hoja de vida, plantilla de levantamiento, soportes de licenciamiento o capturas relevantes.
        </p>
        <Button href="/api/inventory/export" variant="ghost" className="mt-4 gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Descargar Excel
        </Button>
      </div>
    </Card>
  );
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "neutral" | "red" | "blue" }) {
  const toneClass = tone === "red" ? "text-coral bg-coral/10" : tone === "blue" ? "text-blueprint bg-blueprint/10" : "text-ink bg-white/70";
  return (
    <div className={`rounded-2xl p-4 ring-1 ring-white/80 ${toneClass}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] opacity-70">{label}</p>
    </div>
  );
}

function ToolList({ tools, canEdit, canDelete }: { tools: InventoryTool[]; canEdit: boolean; canDelete: boolean }) {
  return (
    <Card className="overflow-hidden border-white/80 bg-white/75 p-0">
      <div className="border-b border-white/70 p-5">
        <CardHeader eyebrow="Matriz" title="Herramientas registradas" action={<Badge tone="yellow">{tools.length} items</Badge>} />
        <p className="text-sm leading-6 text-slate-600">Consulta, edita y descarga los soportes de cada herramienta del stack tecnologico.</p>
      </div>

      {tools.length === 0 ? (
        <div className="p-6">
          <div className="rounded-[1.5rem] border border-dashed border-blueprint/25 bg-white/62 p-8 text-center">
            <Plus className="mx-auto h-9 w-9 text-blueprint" />
            <p className="mt-4 font-display text-xl font-bold text-ink">Aun no hay herramientas registradas</p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">Registra la primera herramienta para comenzar a construir el inventario tecnologico.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 p-4 sm:p-5">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} canEdit={canEdit} canDelete={canDelete} />
          ))}
        </div>
      )}
    </Card>
  );
}

function ToolCard({ tool, canEdit, canDelete }: { tool: InventoryTool; canEdit: boolean; canDelete: boolean }) {
  return (
    <details className="group rounded-[1.35rem] border border-white/80 bg-white/70 p-4 shadow-sm shadow-ink/5">
      <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={lightTone(tool.trafficLight)}>{tool.trafficLight}</Badge>
            <Badge tone={tool.apiAvailable ? "green" : "neutral"}>API {tool.apiAvailable ? "Si" : "No"}</Badge>
            <Badge tone="blue">{tool.attachments.length} adjuntos</Badge>
          </div>
          <h3 className="mt-3 font-display text-xl font-semibold text-ink">{tool.name}</h3>
          <p className="mt-1 text-sm font-medium text-slate-600">{formatCurrency(tool.cost, tool.currency)} · Responsable: {tool.owner}</p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <p className="font-semibold text-ink">Resumen</p>
          <p>{tool.attachments.length} hojas/soportes</p>
          <p>Creado: {tool.createdAt || "Sin fecha"}</p>
        </div>
      </summary>

      <div className="mt-4 grid gap-4 border-t border-white/70 pt-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <InfoGrid tool={tool} />
          <ToolForm action={updateToolAction} tool={tool} canSubmit={canEdit} submitLabel="Guardar cambios" />
        </div>
        <div className="space-y-4">
          <AttachmentPanel attachments={tool.attachments} canDelete={canDelete} />
          {canDelete ? (
            <form action={deleteToolAction} className="rounded-2xl bg-coral/10 p-4 ring-1 ring-coral/20">
              <input type="hidden" name="toolId" value={tool.id} />
              <p className="text-sm font-semibold text-coral">Eliminar herramienta</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">Esta accion elimina definitivamente el registro y sus adjuntos.</p>
              <button className="focus-ring mt-3 inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white">
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </details>
  );
}

function InfoGrid({ tool }: { tool: InventoryTool }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <InfoBlock label="Costo" value={formatCurrency(tool.cost, tool.currency)} />
      <InfoBlock label="Responsable interno" value={tool.owner || "Sin responsable"} />
      <InfoBlock label="Semaforo" value={tool.trafficLight} />
      <InfoBlock label="Creado" value={tool.createdAt || "Sin fecha"} />
      <InfoBlock label="Soportes anexos" value={`${tool.attachments.length} archivo(s)`} />
      <InfoBlock label="Detalle" value="Consultar hoja de vida adjunta" />
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/62 p-3 ring-1 ring-white/80">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-blueprint">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function ToolForm({ action, tool, canSubmit, submitLabel }: { action: (formData: FormData) => void | Promise<void>; tool?: InventoryTool; canSubmit: boolean; submitLabel: string }) {
  return (
    <form action={action} className="grid gap-4 p-5">
      <fieldset disabled={!canSubmit} className="grid gap-4 disabled:opacity-55">
        {tool ? <input type="hidden" name="toolId" value={tool.id} /> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre">
            <Input name="name" defaultValue={tool?.name} placeholder="Ej. Microsoft Teams" required />
          </Field>
          <Field label="Costo">
            <Input name="cost" type="number" min="0" step="0.01" defaultValue={tool?.cost ?? 0} required />
          </Field>
          <label className="block space-y-2 text-sm font-medium text-ink">
            <span>Moneda</span>
            <select name="currency" defaultValue={tool?.currency ?? "COP"} className="focus-ring w-full rounded-xl border border-white/75 bg-white/75 px-3.5 py-2.5 text-sm text-ink shadow-inner shadow-ink/5">
              <option value="COP">COP</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <Field label="Responsable interno">
            <Input name="internalOwner" defaultValue={tool?.owner} placeholder="Ej. Gestion TI / Sistemas" required />
          </Field>
          <label className="block space-y-2 text-sm font-medium text-ink">
            <span>Semaforo de aprovechamiento</span>
            <select name="usageLight" defaultValue={tool?.trafficLight ?? "Amarillo"} className="focus-ring w-full rounded-xl border border-white/75 bg-white/75 px-3.5 py-2.5 text-sm text-ink shadow-inner shadow-ink/5">
              <option value="Verde">Verde</option>
              <option value="Amarillo">Amarillo</option>
              <option value="Rojo">Rojo</option>
            </select>
          </label>
        </div>

        <div className="rounded-[1.25rem] border border-dashed border-blueprint/25 bg-blueprint/10 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Paperclip className="h-4 w-4 text-blueprint" />
            Adjuntar hoja de vida o plantilla
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Puedes subir fichas, plantillas de levantamiento, contratos, imagenes o soportes. Maximo 250 MB por archivo.</p>
          <Input name="attachments" type="file" multiple className="mt-3 bg-white/85" />
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="accent">{submitLabel}</Button>
        </div>
      </fieldset>
      {!canSubmit ? <p className="rounded-xl bg-blueprint/10 p-3 text-sm font-medium leading-6 text-slate-600">Tu usuario puede consultar el inventario, pero no tiene permiso para modificarlo.</p> : null}
    </form>
  );
}

function AttachmentPanel({ attachments, canDelete }: { attachments: ToolAttachment[]; canDelete: boolean }) {
  return (
    <div className="rounded-2xl bg-white/62 p-4 ring-1 ring-white/80">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <Paperclip className="h-4 w-4 text-blueprint" />
        Hojas y soportes
      </p>
      {attachments.length === 0 ? (
        <p className="rounded-xl bg-white/70 p-3 text-sm text-slate-500">Sin adjuntos para esta herramienta.</p>
      ) : (
        <div className="grid gap-2">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="rounded-xl bg-white/75 p-3 ring-1 ring-white/80">
              <p className="truncate text-sm font-semibold text-ink">{attachment.name}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{attachment.type} · {attachment.size}</p>
              <div className="mt-3 flex items-center gap-2">
                <a href={attachment.previewUrl} target="_blank" className="focus-ring grid h-8 w-8 place-items-center rounded-full bg-blueprint/10 text-blueprint ring-1 ring-blueprint/10" aria-label={`Ver ${attachment.name}`}>
                  <Eye className="h-3.5 w-3.5" />
                </a>
                <a href={attachment.downloadUrl} className="focus-ring grid h-8 w-8 place-items-center rounded-full bg-white text-ink ring-1 ring-ink/10" aria-label={`Descargar ${attachment.name}`}>
                  <Download className="h-3.5 w-3.5" />
                </a>
                {canDelete ? (
                  <form action={deleteToolAttachmentAction}>
                    <input type="hidden" name="attachmentId" value={attachment.id} />
                    <button className="focus-ring grid h-8 w-8 place-items-center rounded-full bg-coral/10 text-coral ring-1 ring-coral/20" aria-label={`Eliminar ${attachment.name}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function lightTone(light: TrafficLight): "neutral" | "blue" | "yellow" | "red" | "green" {
  if (light === "Rojo") return "red";
  if (light === "Verde") return "green";
  return "yellow";
}
