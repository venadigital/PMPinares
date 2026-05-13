import Link from "next/link";
import { Download, Eye, FileWarning, Gauge, Link2, Paperclip, ScrollText, Trash2, TriangleAlert } from "lucide-react";
import { createRiskAction, deleteRiskAction, deleteRiskAttachmentAction, updateRiskAction } from "@/app/(dashboard)/riesgos/actions";
import { PageHeader } from "@/components/modules/page-header";
import { RisksTabs } from "@/components/modules/risks-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { getCurrentProfile, hasPermission } from "@/lib/auth";
import { getRisksData, riskCategories, riskLevels, riskRegulations, riskStatuses, type RiskAttachment, type RiskLinkType, type RiskOptions, type RiskRecord } from "@/lib/risks";
import type { RiskLevel } from "@/lib/types";

interface RisksPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

type RiskFilter = "all" | "high" | "open" | "closed" | "linked" | "evidence";

export default async function RisksPage({ searchParams }: RisksPageProps) {
  const params = searchParams ? await searchParams : {};
  const [{ risks, options }, profile] = await Promise.all([getRisksData(), getCurrentProfile()]);
  const canView = hasPermission(profile, "riesgos", "view");
  const canCreate = hasPermission(profile, "riesgos", "create");
  const canEdit = hasPermission(profile, "riesgos", "edit");
  const canDelete = hasPermission(profile, "riesgos", "delete");
  const error = typeof params.error === "string" ? params.error : null;
  const activeFilter = normalizeRiskFilter(params.riskFilter);

  if (!canView) {
    return (
      <>
        <PageHeader eyebrow="Cumplimiento" title="Riesgos" description="Tu usuario no tiene acceso al modulo de riesgos." />
        <Card>
          <p className="font-medium text-slate-600">Solicita acceso al Administrador Vena Digital si necesitas consultar la matriz de riesgos.</p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Cumplimiento"
        title="Riesgos"
        description="Matriz simple de riesgos vinculados a herramientas, procesos, areas y hallazgos del diagnostico."
      />

      <StatusMessages
        error={error}
        created={params.created === "1"}
        updated={params.updated === "1"}
        deleted={params.deleted === "1"}
        attachmentDeleted={params.attachmentDeleted === "1"}
      />

      <RisksTabs
        riskCount={risks.length}
        highCount={risks.filter((risk) => risk.level === "Alto").length}
        createPanel={<RiskCreatePanel options={options} canCreate={canCreate} />}
        matrixPanel={<RiskList risks={risks} options={options} activeFilter={activeFilter} canEdit={canEdit} canDelete={canDelete} />}
      />
    </>
  );
}

function StatusMessages({ error, created, updated, deleted, attachmentDeleted }: { error: string | null; created: boolean; updated: boolean; deleted: boolean; attachmentDeleted: boolean }) {
  return (
    <>
      {error ? <p className="mb-5 rounded-2xl bg-coral/10 p-4 text-sm font-bold text-coral">{error}</p> : null}
      {created ? <p className="mb-5 rounded-2xl bg-emerald-500/10 p-4 text-sm font-bold text-emerald-700">Riesgo creado correctamente.</p> : null}
      {updated ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Riesgo actualizado correctamente.</p> : null}
      {deleted ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Riesgo eliminado definitivamente.</p> : null}
      {attachmentDeleted ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Adjunto eliminado correctamente.</p> : null}
    </>
  );
}

function RiskCreatePanel({ options, canCreate }: { options: RiskOptions; canCreate: boolean }) {
  return (
    <Card className="overflow-hidden border-white/80 bg-white/75 p-0">
      <div className="border-b border-white/70 p-5">
        <CardHeader eyebrow="Nuevo riesgo" title="Registrar riesgo" action={<Badge tone="red">Vinculo requerido</Badge>} />
        <p className="text-sm leading-6 text-slate-600">Todo riesgo debe quedar asociado al menos a un area, herramienta, proceso o hallazgo.</p>
      </div>
      <RiskForm action={createRiskAction} options={options} canSubmit={canCreate} submitLabel="Crear riesgo" />
    </Card>
  );
}

function RiskOverview({ risks, activeFilter }: { risks: RiskRecord[]; activeFilter: RiskFilter }) {
  const high = risks.filter((risk) => risk.level === "Alto").length;
  const open = risks.filter((risk) => risk.status === "Abierto" || risk.status === "En revision").length;
  const closed = risks.filter((risk) => risk.status === "Cerrado").length;
  const linked = risks.filter((risk) => risk.linkRecords.length > 0).length;
  const evidence = risks.filter((risk) => risk.attachments.length > 0).length;

  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-5">
      <Metric label="Altos" value={high} tone="red" filter="high" activeFilter={activeFilter} />
      <Metric label="Abiertos" value={open} tone="yellow" filter="open" activeFilter={activeFilter} />
      <Metric label="Cerrados" value={closed} tone="green" filter="closed" activeFilter={activeFilter} />
      <Metric label="Vinculados" value={linked} tone="blue" filter="linked" activeFilter={activeFilter} />
      <Metric label="Evidencias" value={evidence} tone="neutral" filter="evidence" activeFilter={activeFilter} />
    </div>
  );
}

function Metric({ label, value, tone = "neutral", filter, activeFilter }: { label: string; value: number; tone?: "neutral" | "red" | "blue" | "green" | "yellow"; filter: RiskFilter; activeFilter: RiskFilter }) {
  const toneClass = {
    neutral: "text-ink bg-white/70",
    red: "text-coral bg-coral/10",
    blue: "text-blueprint bg-blueprint/10",
    green: "text-emerald-700 bg-emerald-500/10",
    yellow: "text-ink bg-sun/20"
  }[tone];
  const activeClass = activeFilter === filter ? "ring-2 ring-blueprint/35 shadow-md shadow-blueprint/10" : "hover:-translate-y-px hover:bg-white/80";

  return (
    <Link href={`/riesgos?riskFilter=${filter}`} className={`focus-ring block rounded-2xl px-4 py-3 transition ring-1 ring-white/80 ${toneClass} ${activeClass}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] opacity-70">{label}</p>
    </Link>
  );
}

function RiskList({ risks, options, activeFilter, canEdit, canDelete }: { risks: RiskRecord[]; options: RiskOptions; activeFilter: RiskFilter; canEdit: boolean; canDelete: boolean }) {
  const visibleRisks = filterRisks(risks, activeFilter);
  const isFiltered = activeFilter !== "all";

  return (
    <Card className="overflow-hidden border-white/80 bg-white/75 p-0">
      <div className="border-b border-white/70 p-5">
        <CardHeader
          eyebrow="Matriz"
          title="Riesgos registrados"
          action={
            <Link href="/riesgos" className="focus-ring rounded-full">
              <Badge tone={isFiltered ? "neutral" : "yellow"}>{isFiltered ? `${visibleRisks.length} de ${risks.length}` : `${risks.length} riesgos`}</Badge>
            </Link>
          }
        />
        <p className="text-sm leading-6 text-slate-600">Consulta, actualiza y soporta cada riesgo con vinculos formales y evidencias.</p>
        <RiskOverview risks={risks} activeFilter={activeFilter} />
      </div>

      {risks.length === 0 ? (
        <EmptyState title="Aun no hay riesgos registrados" description="Registra el primer riesgo para comenzar a construir la matriz de cumplimiento y seguridad." />
      ) : visibleRisks.length === 0 ? (
        <EmptyState title="No existen riesgos de esta categoria identificados hasta el momento." description="Puedes volver a la vista completa o crear un nuevo riesgo si ya tienes informacion para esta categoria." showAllLink />
      ) : (
        <div className="grid gap-3 p-4 sm:p-5">
          {visibleRisks.map((risk) => (
            <RiskCard key={risk.id} risk={risk} options={options} canEdit={canEdit} canDelete={canDelete} />
          ))}
        </div>
      )}
    </Card>
  );
}

function EmptyState({ title, description, showAllLink = false }: { title: string; description: string; showAllLink?: boolean }) {
  return (
    <div className="p-6">
      <div className="rounded-[1.5rem] border border-dashed border-blueprint/25 bg-white/62 p-8 text-center">
        <TriangleAlert className="mx-auto h-9 w-9 text-blueprint" />
        <p className="mt-4 font-display text-xl font-bold text-ink">{title}</p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
        {showAllLink ? <Link href="/riesgos" className="focus-ring mt-4 inline-flex rounded-full bg-white/75 px-4 py-2 text-sm font-semibold text-ink ring-1 ring-ink/10">Ver todos los riesgos</Link> : null}
      </div>
    </div>
  );
}

function RiskCard({ risk, options, canEdit, canDelete }: { risk: RiskRecord; options: RiskOptions; canEdit: boolean; canDelete: boolean }) {
  return (
    <details className="group rounded-[1.35rem] border border-white/80 bg-white/70 p-4 shadow-sm shadow-ink/5">
      <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={levelTone(risk.level)}>{risk.level}</Badge>
            <Badge tone="blue">{risk.category}</Badge>
            <Badge tone={statusTone(risk.status)}>{risk.status}</Badge>
            <Badge tone="neutral">{risk.linkRecords.length} vinculos</Badge>
            <Badge tone="neutral">{risk.attachments.length} adjuntos</Badge>
          </div>
          <h3 className="mt-3 font-display text-xl font-semibold leading-tight text-ink">{risk.title}</h3>
          <p className="mt-2 text-sm font-medium text-slate-600">{risk.regulation} · Creado por {risk.createdBy}</p>
        </div>
        <div className="flex flex-col items-end gap-3 text-right text-sm text-slate-500">
          <div>
            <p className="font-semibold text-ink">Detalle</p>
            <p>Creado: {risk.createdAt}</p>
            <p>Actualizado: {risk.updatedAt}</p>
          </div>
          {canDelete ? (
            <form action={deleteRiskAction}>
              <input type="hidden" name="riskId" value={risk.id} />
              <button className="focus-ring inline-flex items-center gap-2 rounded-full bg-coral/10 px-3 py-1.5 text-xs font-semibold text-coral ring-1 ring-coral/20 transition hover:bg-coral hover:text-white">
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
              </button>
            </form>
          ) : null}
        </div>
      </summary>

      <div className="mt-4 grid gap-4 border-t border-white/70 pt-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <RiskSnapshot risk={risk} />
          <RiskForm action={updateRiskAction} risk={risk} options={options} canSubmit={canEdit} submitLabel="Guardar cambios" />
        </div>
        <AttachmentPanel attachments={risk.attachments} canDelete={canDelete} />
      </div>
    </details>
  );
}

function RiskSnapshot({ risk }: { risk: RiskRecord }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <InfoBlock label="Normativa" value={risk.regulation} />
      <InfoBlock label="Nivel" value={risk.level} />
      <InfoBlock label="Estado" value={risk.status} />
      <div className="rounded-2xl bg-white/62 p-3 ring-1 ring-white/80 md:col-span-3">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-blueprint">Descripcion</p>
        <p className="mt-1 text-sm leading-6 text-slate-700">{risk.description || "Sin descripcion registrada."}</p>
      </div>
      <div className="rounded-2xl bg-white/62 p-3 ring-1 ring-white/80 md:col-span-3">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-blueprint">Vinculos</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {risk.linkRecords.length > 0 ? risk.linkRecords.map((link) => <Badge key={link.id} tone="neutral">{linkTypeLabel(link.type)}: {link.label}</Badge>) : <span className="text-sm text-slate-500">Sin vinculos registrados.</span>}
        </div>
      </div>
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

function RiskForm({ action, risk, options, canSubmit, submitLabel }: { action: (formData: FormData) => void | Promise<void>; risk?: RiskRecord; options: RiskOptions; canSubmit: boolean; submitLabel: string }) {
  const selectedLinks = new Set(risk?.linkRecords.map((link) => link.id) ?? []);

  return (
    <form action={action} className="grid gap-0">
      <fieldset disabled={!canSubmit} className="grid gap-0 disabled:opacity-55">
        {risk ? <input type="hidden" name="riskId" value={risk.id} /> : null}
        <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="rounded-[1.4rem] bg-white/60 p-4 ring-1 ring-white/80">
            <SectionTitle icon={<TriangleAlert className="h-4 w-4" />} eyebrow="Datos base" title="Que puede pasar" />
            <div className="mt-4 grid gap-4">
              <Field label="Titulo">
                <Input name="title" defaultValue={risk?.title} placeholder="Ej. Acceso no autorizado a informacion clinica" required />
              </Field>
              <Field label="Descripcion">
                <Textarea name="description" defaultValue={risk?.description} placeholder="Describe el escenario, causa, impacto y contexto del riesgo." className="min-h-32" />
              </Field>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.4rem] bg-white/60 p-4 ring-1 ring-white/80">
              <SectionTitle icon={<Gauge className="h-4 w-4" />} eyebrow="Priorizacion" title="Nivel y estado" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <SelectField label="Nivel" name="level" defaultValue={risk?.level ?? "Medio"}>
                  {riskLevels.map((level) => <option key={level} value={level}>{level}</option>)}
                </SelectField>
                <SelectField label="Estado" name="status" defaultValue={risk?.status ?? "Abierto"}>
                  {riskStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </SelectField>
              </div>
            </div>

            <div className="rounded-[1.4rem] bg-white/60 p-4 ring-1 ring-white/80">
              <SectionTitle icon={<ScrollText className="h-4 w-4" />} eyebrow="Clasificacion" title="Tipo y normativa" />
              <div className="mt-4 grid gap-4">
                <SelectField label="Categoria" name="category" defaultValue={risk?.category ?? "Operativo"}>
                  {riskCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                </SelectField>
                <SelectField label="Normativa" name="regulation" defaultValue={risk?.regulation ?? "No aplica / por definir"}>
                  {riskRegulations.map((regulation) => <option key={regulation} value={regulation}>{regulation}</option>)}
                </SelectField>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/70 bg-white/35 p-5">
          <RiskLinks options={options} selectedLinks={selectedLinks} />
        </div>

        <div className="border-t border-white/70 bg-white/35 p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="rounded-[1.4rem] border border-dashed border-blueprint/25 bg-blueprint/10 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/80 text-blueprint ring-1 ring-blueprint/10">
                  <Paperclip className="h-4 w-4" />
                </span>
                Adjuntar soporte
              </p>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">Puedes subir documentos, imagenes o soportes relacionados con el riesgo. Maximo 250 MB por archivo.</p>
              <Input name="attachments" type="file" multiple className="mt-4 cursor-pointer bg-white/90 file:mr-4 file:rounded-full file:border-0 file:bg-blueprint/10 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-blueprint" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="accent" className="min-w-40 shadow-lg shadow-sun/25">{submitLabel}</Button>
            </div>
          </div>
        </div>
      </fieldset>
      {!canSubmit ? <p className="rounded-xl bg-blueprint/10 p-3 text-sm font-medium leading-6 text-slate-600">Tu usuario puede consultar riesgos, pero no tiene permiso para modificarlos.</p> : null}
    </form>
  );
}

function SectionTitle({ icon, eyebrow, title }: { icon: React.ReactNode; eyebrow: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blueprint/10 text-blueprint ring-1 ring-blueprint/10">{icon}</span>
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-blueprint">{eyebrow}</p>
        <p className="mt-0.5 font-display text-lg font-semibold tracking-tight text-ink">{title}</p>
      </div>
    </div>
  );
}

function RiskLinks({ options, selectedLinks }: { options: RiskOptions; selectedLinks: Set<string> }) {
  const groups = [
    { label: "Areas", options: options.areas },
    { label: "Herramientas", options: options.tools },
    { label: "Procesos", options: options.processes },
    { label: "Hallazgos", options: options.findings }
  ];

  return (
    <div className="rounded-[1.4rem] bg-white/60 p-4 ring-1 ring-white/80">
      <SectionTitle icon={<Link2 className="h-4 w-4" />} eyebrow="Trazabilidad" title="Vinculos del riesgo" />
      <p className="mt-3 text-xs leading-5 text-slate-500">Selecciona uno o varios vinculos. Este campo es obligatorio para mantener trazabilidad.</p>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {groups.map((group) => (
          <div key={group.label} className="rounded-[1.2rem] border border-white/80 bg-white/72 p-3 shadow-sm shadow-ink/5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-blueprint">{group.label}</p>
              <span className="rounded-full bg-blueprint/10 px-2.5 py-1 text-[0.65rem] font-semibold text-blueprint">
                {group.options.length}
              </span>
            </div>
            {group.options.length === 0 ? (
              <div className="rounded-xl border border-dashed border-blueprint/20 bg-blueprint/5 p-4 text-xs leading-5 text-slate-500">
                Sin registros disponibles para vincular en esta categoria.
              </div>
            ) : (
              <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                {group.options.map((option) => (
                  <label key={`${option.type}:${option.id}`} className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/65 p-3 text-sm text-slate-700 ring-1 ring-white/80 transition hover:bg-white">
                    <input type="checkbox" name="links" value={`${option.type}:${option.id}`} defaultChecked={selectedLinks.has(`${option.type}:${option.id}`)} className="mt-0.5 h-4 w-4 rounded border-ink/20 accent-blueprint" />
                    <span className="leading-5">{option.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AttachmentPanel({ attachments, canDelete }: { attachments: RiskAttachment[]; canDelete: boolean }) {
  return (
    <div className="rounded-2xl bg-white/62 p-4 ring-1 ring-white/80">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <Paperclip className="h-4 w-4 text-blueprint" />
        Soportes
      </p>
      {attachments.length === 0 ? (
        <p className="rounded-xl bg-white/70 p-3 text-sm text-slate-500">Sin adjuntos para este riesgo.</p>
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
                  <form action={deleteRiskAttachmentAction}>
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

function SelectField({ label, name, defaultValue, children }: { label: string; name: string; defaultValue?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-sm font-medium text-ink">
      <span>{label}</span>
      <select name={name} defaultValue={defaultValue} className="focus-ring w-full rounded-xl border border-white/75 bg-white/75 px-3.5 py-2.5 text-sm text-ink shadow-inner shadow-ink/5">
        {children}
      </select>
    </label>
  );
}

function normalizeRiskFilter(value: string | string[] | undefined): RiskFilter {
  const parsed = Array.isArray(value) ? value[0] : value;
  if (parsed === "high" || parsed === "open" || parsed === "closed" || parsed === "linked" || parsed === "evidence") return parsed;
  return "all";
}

function filterRisks(risks: RiskRecord[], filter: RiskFilter) {
  if (filter === "high") return risks.filter((risk) => risk.level === "Alto");
  if (filter === "open") return risks.filter((risk) => risk.status === "Abierto" || risk.status === "En revision");
  if (filter === "closed") return risks.filter((risk) => risk.status === "Cerrado");
  if (filter === "linked") return risks.filter((risk) => risk.linkRecords.length > 0);
  if (filter === "evidence") return risks.filter((risk) => risk.attachments.length > 0);
  return risks;
}

function levelTone(level: RiskLevel): "neutral" | "blue" | "yellow" | "red" | "green" {
  if (level === "Alto") return "red";
  if (level === "Medio") return "yellow";
  return "green";
}

function statusTone(status: RiskRecord["status"]): "neutral" | "blue" | "yellow" | "red" | "green" {
  if (status === "Cerrado") return "green";
  if (status === "En revision") return "yellow";
  return "blue";
}

function linkTypeLabel(type: RiskLinkType) {
  if (type === "tool") return "Herramienta";
  if (type === "process") return "Proceso";
  if (type === "finding") return "Hallazgo";
  return "Area";
}
