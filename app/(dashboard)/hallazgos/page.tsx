import Link from "next/link";
import { Download, Eye, FileWarning, Gauge, MapPin, Paperclip, Trash2 } from "lucide-react";
import { createFindingAction, deleteFindingAction, deleteFindingAttachmentAction, updateFindingAction } from "@/app/(dashboard)/hallazgos/actions";
import { FindingsTabs } from "@/components/modules/findings-tabs";
import { PageHeader } from "@/components/modules/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { getCurrentProfile, hasPermission } from "@/lib/auth";
import { findingClassifications, findingCriticalities, findingStatuses, getFindingsData, type FindingArea, type FindingAttachment, type FindingRecord } from "@/lib/findings";
import type { Criticality } from "@/lib/types";

interface FindingsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

type FindingFilter = "all" | "critical" | "pending" | "validated" | "evidence";

export default async function FindingsPage({ searchParams }: FindingsPageProps) {
  const params = searchParams ? await searchParams : {};
  const [{ findings, areas }, profile] = await Promise.all([getFindingsData(), getCurrentProfile()]);
  const canView = hasPermission(profile, "hallazgos", "view");
  const canCreate = hasPermission(profile, "hallazgos", "create");
  const canEdit = hasPermission(profile, "hallazgos", "edit");
  const canDelete = hasPermission(profile, "hallazgos", "delete");
  const error = typeof params.error === "string" ? params.error : null;
  const activeFilter = normalizeFindingFilter(params.findingFilter);

  if (!canView) {
    return (
      <>
        <PageHeader eyebrow="Diagnostico" title="Hallazgos" description="Tu usuario no tiene acceso al modulo de hallazgos." />
        <Card>
          <p className="font-medium text-slate-600">Solicita acceso al Administrador Vena Digital si necesitas consultar o reportar hallazgos.</p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Diagnostico"
        title="Hallazgos"
        description="Registra observaciones operativas, tecnologicas, de seguridad o cumplimiento, con criticidad, area responsable y evidencias adjuntas."
      />

      <StatusMessages
        error={error}
        created={params.created === "1"}
        updated={params.updated === "1"}
        deleted={params.deleted === "1"}
        attachmentDeleted={params.attachmentDeleted === "1"}
      />

      <FindingsTabs
        findingCount={findings.length}
        criticalCount={findings.filter((finding) => finding.criticality === "Alta").length}
        createPanel={<FindingCreatePanel areas={areas} canCreate={canCreate} />}
        matrixPanel={<FindingsList findings={findings} areas={areas} activeFilter={activeFilter} canEdit={canEdit} canDelete={canDelete} />}
      />
    </>
  );
}

function StatusMessages({ error, created, updated, deleted, attachmentDeleted }: { error: string | null; created: boolean; updated: boolean; deleted: boolean; attachmentDeleted: boolean }) {
  return (
    <>
      {error ? <p className="mb-5 rounded-2xl bg-coral/10 p-4 text-sm font-bold text-coral">{error}</p> : null}
      {created ? <p className="mb-5 rounded-2xl bg-emerald-500/10 p-4 text-sm font-bold text-emerald-700">Hallazgo creado correctamente.</p> : null}
      {updated ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Hallazgo actualizado correctamente.</p> : null}
      {deleted ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Hallazgo eliminado definitivamente.</p> : null}
      {attachmentDeleted ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Evidencia eliminada correctamente.</p> : null}
    </>
  );
}

function FindingCreatePanel({ areas, canCreate }: { areas: FindingArea[]; canCreate: boolean }) {
  return (
    <Card className="overflow-hidden border-white/80 bg-white/75 p-0">
      <div className="border-b border-white/70 p-5">
        <CardHeader eyebrow="Nuevo hallazgo" title="Registrar hallazgo" action={<Badge tone="blue">Evidencia opcional</Badge>} />
        <p className="text-sm leading-6 text-slate-600">Captura el hallazgo con la informacion minima para priorizarlo y soportarlo con archivos si aplica.</p>
      </div>
      <FindingForm action={createFindingAction} areas={areas} canSubmit={canCreate} submitLabel="Crear hallazgo" />
    </Card>
  );
}

function FindingsOverview({ findings, activeFilter }: { findings: FindingRecord[]; activeFilter: FindingFilter }) {
  const critical = findings.filter((finding) => finding.criticality === "Alta").length;
  const validated = findings.filter((finding) => finding.status === "Validado").length;
  const evidenceCount = findings.filter((finding) => finding.attachments.length > 0).length;
  const pending = findings.filter((finding) => finding.status === "Identificado" || finding.status === "En analisis").length;

  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <Metric label="Criticos" value={critical} tone="red" filter="critical" activeFilter={activeFilter} />
        <Metric label="Pendientes" value={pending} tone="yellow" filter="pending" activeFilter={activeFilter} />
        <Metric label="Validados" value={validated} tone="green" filter="validated" activeFilter={activeFilter} />
        <Metric label="Evidencias" value={evidenceCount} tone="blue" filter="evidence" activeFilter={activeFilter} />
    </div>
  );
}

function Metric({ label, value, tone = "neutral", filter, activeFilter }: { label: string; value: number; tone?: "neutral" | "red" | "blue" | "green" | "yellow"; filter: FindingFilter; activeFilter: FindingFilter }) {
  const toneClass = {
    neutral: "text-ink bg-white/70",
    red: "text-coral bg-coral/10",
    blue: "text-blueprint bg-blueprint/10",
    green: "text-emerald-700 bg-emerald-500/10",
    yellow: "text-ink bg-sun/20"
  }[tone];
  const activeClass = activeFilter === filter ? "ring-2 ring-blueprint/35 shadow-md shadow-blueprint/10" : "hover:-translate-y-px hover:bg-white/80";

  return (
    <Link href={`/hallazgos?findingFilter=${filter}`} className={`focus-ring block rounded-2xl px-4 py-3 transition ring-1 ring-white/80 ${toneClass} ${activeClass}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] opacity-70">{label}</p>
    </Link>
  );
}

function FindingsList({ findings, areas, activeFilter, canEdit, canDelete }: { findings: FindingRecord[]; areas: FindingArea[]; activeFilter: FindingFilter; canEdit: boolean; canDelete: boolean }) {
  const visibleFindings = filterFindings(findings, activeFilter);
  const isFiltered = activeFilter !== "all";

  return (
    <Card className="overflow-hidden border-white/80 bg-white/75 p-0">
      <div className="border-b border-white/70 p-5">
        <CardHeader
          eyebrow="Matriz"
          title="Hallazgos registrados"
          action={
            <Link href="/hallazgos" className="focus-ring rounded-full">
              <Badge tone={isFiltered ? "neutral" : "yellow"}>{isFiltered ? `${visibleFindings.length} de ${findings.length}` : `${findings.length} hallazgos`}</Badge>
            </Link>
          }
        />
        <p className="text-sm leading-6 text-slate-600">Consulta, actualiza y soporta cada observacion del diagnostico con evidencias formales.</p>
        <FindingsOverview findings={findings} activeFilter={activeFilter} />
      </div>

      {findings.length === 0 ? (
        <div className="p-6">
          <div className="rounded-[1.5rem] border border-dashed border-blueprint/25 bg-white/62 p-8 text-center">
            <FileWarning className="mx-auto h-9 w-9 text-blueprint" />
            <p className="mt-4 font-display text-xl font-bold text-ink">Aun no hay hallazgos registrados</p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">Registra el primer hallazgo para comenzar a consolidar el diagnostico.</p>
          </div>
        </div>
      ) : visibleFindings.length === 0 ? (
        <div className="p-6">
          <div className="rounded-[1.5rem] border border-dashed border-blueprint/25 bg-white/62 p-8 text-center">
            <FileWarning className="mx-auto h-9 w-9 text-blueprint" />
            <p className="mt-4 font-display text-xl font-bold text-ink">No existen hallazgos de esta categoria identificados hasta el momento.</p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Puedes volver a la vista completa o registrar un nuevo hallazgo si ya tienes evidencia para esta categoria.
            </p>
            <Link href="/hallazgos" className="focus-ring mt-4 inline-flex rounded-full bg-white/75 px-4 py-2 text-sm font-semibold text-ink ring-1 ring-ink/10">
              Ver todos los hallazgos
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 p-4 sm:p-5">
          {visibleFindings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} areas={areas} canEdit={canEdit} canDelete={canDelete} />
          ))}
        </div>
      )}
    </Card>
  );
}

function FindingCard({ finding, areas, canEdit, canDelete }: { finding: FindingRecord; areas: FindingArea[]; canEdit: boolean; canDelete: boolean }) {
  return (
    <details className="group rounded-[1.35rem] border border-white/80 bg-white/70 p-4 shadow-sm shadow-ink/5 open:bg-white/82 open:shadow-md open:shadow-blueprint/10">
      <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={criticalityTone(finding.criticality)}>{finding.criticality}</Badge>
            <Badge tone="blue">{finding.classification}</Badge>
            <Badge tone={statusTone(finding.status)}>{finding.status}</Badge>
            <Badge tone="neutral">{finding.attachments.length} evidencias</Badge>
          </div>
          <h3 className="mt-3 font-display text-xl font-semibold leading-tight text-ink">{finding.title}</h3>
          <p className="mt-2 text-sm font-medium text-slate-600">{finding.area} · Identificado por {finding.identifiedBy}</p>
        </div>
        <div className="flex flex-col items-end gap-3 text-right text-sm text-slate-500">
          <div>
            <p className="font-semibold text-ink">Detalle</p>
            <p>Creado: {finding.createdAt}</p>
            <p>Actualizado: {finding.updatedAt}</p>
          </div>
          {canDelete ? (
            <form action={deleteFindingAction}>
              <input type="hidden" name="findingId" value={finding.id} />
              <button className="focus-ring inline-flex items-center gap-2 rounded-full bg-coral/10 px-3 py-1.5 text-xs font-semibold text-coral ring-1 ring-coral/20 transition hover:bg-coral hover:text-white">
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
              </button>
            </form>
          ) : null}
        </div>
      </summary>

      <div className="mt-5 border-t border-white/70 pt-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <FindingSnapshot finding={finding} />
          <AttachmentPanel attachments={finding.attachments} canDelete={canDelete} />
        </div>

        <div className="mt-4 overflow-hidden rounded-[1.35rem] border border-white/80 bg-white/62 shadow-sm shadow-ink/5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/70 p-4">
            <div>
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blueprint">Edicion</p>
              <h4 className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">Actualizar hallazgo</h4>
            </div>
            <Badge tone={canEdit ? "blue" : "neutral"}>{canEdit ? "Editable" : "Solo lectura"}</Badge>
          </div>
          <FindingForm action={updateFindingAction} finding={finding} areas={areas} canSubmit={canEdit} submitLabel="Guardar cambios" variant="compact" />
        </div>
      </div>
    </details>
  );
}

function FindingSnapshot({ finding }: { finding: FindingRecord }) {
  return (
    <div className="rounded-[1.35rem] border border-white/80 bg-white/62 p-4 shadow-sm shadow-ink/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blueprint">Resumen del hallazgo</p>
          <h4 className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">Lectura rapida</h4>
        </div>
        <Badge tone={criticalityTone(finding.criticality)}>{finding.criticality}</Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoBlock label="Area" value={finding.area} />
        <InfoBlock label="Clasificacion" value={finding.classification} />
        <InfoBlock label="Estado" value={finding.status} />
        <InfoBlock label="Reportado por" value={finding.identifiedBy} />
      </div>

      <div className="mt-3 rounded-2xl bg-white/72 p-4 ring-1 ring-white/80">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-blueprint">Descripcion</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{finding.description || "Sin descripcion registrada."}</p>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/72 p-3 ring-1 ring-white/80">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-blueprint">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-medium leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function FindingForm({
  action,
  finding,
  areas,
  canSubmit,
  submitLabel,
  variant = "full"
}: {
  action: (formData: FormData) => void | Promise<void>;
  finding?: FindingRecord;
  areas: FindingArea[];
  canSubmit: boolean;
  submitLabel: string;
  variant?: "full" | "compact";
}) {
  if (variant === "compact") {
    return (
      <form action={action}>
        <fieldset disabled={!canSubmit} className="grid gap-4 p-4 disabled:opacity-55">
          {finding ? <input type="hidden" name="findingId" value={finding.id} /> : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Titulo">
              <Input name="title" defaultValue={finding?.title} placeholder="Ej. Duplicidad manual entre sistemas" required />
            </Field>
            <SelectField label="Area" name="areaId" defaultValue={finding?.areaId ?? ""}>
              <option value="">Sin area</option>
              {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
            </SelectField>
            <SelectField label="Clasificacion" name="classification" defaultValue={finding?.classification ?? "Operativo"}>
              {findingClassifications.map((classification) => <option key={classification} value={classification}>{classification}</option>)}
            </SelectField>
            <SelectField label="Criticidad" name="criticality" defaultValue={finding?.criticality ?? "Media"}>
              {findingCriticalities.map((criticality) => <option key={criticality} value={criticality}>{criticality}</option>)}
            </SelectField>
            <SelectField label="Estado" name="status" defaultValue={finding?.status ?? "Identificado"}>
              {findingStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </SelectField>
            <div className="rounded-2xl border border-dashed border-blueprint/20 bg-blueprint/10 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Paperclip className="h-4 w-4 text-blueprint" />
                Agregar evidencias
              </p>
              <Input name="attachments" type="file" multiple className="mt-3 cursor-pointer bg-white/90 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-blueprint/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-blueprint" />
            </div>
          </div>
          <Field label="Descripcion">
            <Textarea name="description" defaultValue={finding?.description} placeholder="Describe el hallazgo, evidencia observada, impacto o contexto operativo." className="min-h-28" />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/70 pt-4">
            {!canSubmit ? <p className="text-sm font-medium leading-6 text-slate-600">Tu usuario puede consultar hallazgos, pero no tiene permiso para modificarlos.</p> : <p className="text-sm font-medium leading-6 text-slate-500">Los cambios actualizaran la matriz y el panel ejecutivo.</p>}
            <Button type="submit" variant="accent" className="min-w-40 shadow-lg shadow-sun/25">{submitLabel}</Button>
          </div>
        </fieldset>
      </form>
    );
  }

  return (
    <form action={action} className="grid gap-0">
      <fieldset disabled={!canSubmit} className="grid gap-0 disabled:opacity-55">
        {finding ? <input type="hidden" name="findingId" value={finding.id} /> : null}
        <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="rounded-[1.4rem] bg-white/60 p-4 ring-1 ring-white/80">
            <SectionTitle icon={<FileWarning className="h-4 w-4" />} eyebrow="Datos base" title="Que se encontro" />
            <div className="mt-4 grid gap-4">
              <Field label="Titulo">
                <Input name="title" defaultValue={finding?.title} placeholder="Ej. Duplicidad manual entre sistemas" required />
              </Field>
              <Field label="Descripcion">
                <Textarea name="description" defaultValue={finding?.description} placeholder="Describe el hallazgo, evidencia observada, impacto o contexto operativo." className="min-h-32" />
              </Field>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.4rem] bg-white/60 p-4 ring-1 ring-white/80">
              <SectionTitle icon={<MapPin className="h-4 w-4" />} eyebrow="Ubicacion" title="Area y tipo" />
              <div className="mt-4 grid gap-4">
                <SelectField label="Area" name="areaId" defaultValue={finding?.areaId ?? ""}>
                  <option value="">Sin area</option>
                  {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
                </SelectField>
                <SelectField label="Clasificacion" name="classification" defaultValue={finding?.classification ?? "Operativo"}>
                  {findingClassifications.map((classification) => <option key={classification} value={classification}>{classification}</option>)}
                </SelectField>
              </div>
            </div>

            <div className="rounded-[1.4rem] bg-white/60 p-4 ring-1 ring-white/80">
              <SectionTitle icon={<Gauge className="h-4 w-4" />} eyebrow="Priorizacion" title="Criticidad y estado" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <SelectField label="Criticidad" name="criticality" defaultValue={finding?.criticality ?? "Media"}>
                  {findingCriticalities.map((criticality) => <option key={criticality} value={criticality}>{criticality}</option>)}
                </SelectField>
                <SelectField label="Estado" name="status" defaultValue={finding?.status ?? "Identificado"}>
                  {findingStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </SelectField>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/70 bg-white/35 p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="rounded-[1.4rem] border border-dashed border-blueprint/25 bg-blueprint/10 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/80 text-blueprint ring-1 ring-blueprint/10">
                  <Paperclip className="h-4 w-4" />
                </span>
                Adjuntar evidencias
              </p>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">Puedes subir PDFs, documentos, hojas de calculo, imagenes o soportes. Maximo 250 MB por archivo.</p>
              <Input name="attachments" type="file" multiple className="mt-4 cursor-pointer bg-white/90 file:mr-4 file:rounded-full file:border-0 file:bg-blueprint/10 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-blueprint" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="accent" className="min-w-40 shadow-lg shadow-sun/25">{submitLabel}</Button>
            </div>
          </div>
        </div>
      </fieldset>
      {!canSubmit ? <p className="rounded-xl bg-blueprint/10 p-3 text-sm font-medium leading-6 text-slate-600">Tu usuario puede consultar hallazgos, pero no tiene permiso para modificarlos.</p> : null}
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

function AttachmentPanel({ attachments, canDelete }: { attachments: FindingAttachment[]; canDelete: boolean }) {
  return (
    <div className="rounded-2xl bg-white/62 p-4 ring-1 ring-white/80">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <Paperclip className="h-4 w-4 text-blueprint" />
        Evidencias
      </p>
      {attachments.length === 0 ? (
        <p className="rounded-xl bg-white/70 p-3 text-sm text-slate-500">Sin evidencias para este hallazgo.</p>
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
                  <form action={deleteFindingAttachmentAction}>
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

function criticalityTone(criticality: Criticality): "neutral" | "blue" | "yellow" | "red" | "green" {
  if (criticality === "Alta") return "red";
  if (criticality === "Media") return "yellow";
  return "green";
}

function statusTone(status: FindingRecord["status"]): "neutral" | "blue" | "yellow" | "red" | "green" {
  if (status === "Validado" || status === "Convertido en recomendacion/iniciativa") return "green";
  if (status === "Descartado") return "neutral";
  if (status === "En analisis") return "yellow";
  return "blue";
}

function normalizeFindingFilter(value: string | string[] | undefined): FindingFilter {
  const parsed = Array.isArray(value) ? value[0] : value;
  if (parsed === "critical" || parsed === "pending" || parsed === "validated" || parsed === "evidence") return parsed;
  return "all";
}

function filterFindings(findings: FindingRecord[], filter: FindingFilter) {
  if (filter === "critical") return findings.filter((finding) => finding.criticality === "Alta");
  if (filter === "pending") return findings.filter((finding) => finding.status === "Identificado" || finding.status === "En analisis");
  if (filter === "validated") return findings.filter((finding) => finding.status === "Validado");
  if (filter === "evidence") return findings.filter((finding) => finding.attachments.length > 0);
  return findings;
}
