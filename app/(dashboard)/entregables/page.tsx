import Link from "next/link";
import { CalendarCheck, ClipboardList, FileText, Link2, PackageCheck, Trash2 } from "lucide-react";
import { createDeliverableAction, deleteDeliverableAction, updateDeliverableAction } from "@/app/(dashboard)/entregables/actions";
import { DeliverablesTabs } from "@/components/modules/deliverables-tabs";
import { PageHeader } from "@/components/modules/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { getCurrentProfile, hasPermission } from "@/lib/auth";
import { deliverableStatuses, getDeliverablesData, type DeliverableRecord } from "@/lib/deliverables";
import type { DocumentFile } from "@/lib/documents";
import type { Deliverable, Phase } from "@/lib/types";

interface DeliverablesPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

type DeliverableFilter = "all" | "pending" | "progress" | "review" | "approved" | "adjustments" | "documents";

export default async function DeliverablesPage({ searchParams }: DeliverablesPageProps) {
  const params = searchParams ? await searchParams : {};
  const [{ deliverables, phases, documents }, profile] = await Promise.all([getDeliverablesData(), getCurrentProfile()]);
  const canView = hasPermission(profile, "entregables", "view");
  const canManage = profile.role === "Administrador Vena Digital" || profile.role === "Administrador Pinares";
  const activeFilter = normalizeDeliverableFilter(params.deliverableFilter);
  const error = typeof params.error === "string" ? params.error : null;

  if (!canView) {
    return (
      <>
        <PageHeader eyebrow="Control contractual" title="Entregables" description="Tu usuario no tiene acceso al modulo de entregables." />
        <Card>
          <p className="font-medium text-slate-600">Solicita acceso al Administrador Vena Digital si necesitas consultar entregables del proyecto.</p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Control contractual"
        title="Entregables"
        description="Seguimiento de entregables definidos en la propuesta comercial, por fase, estado, tareas vinculadas y archivo final."
      />

      <StatusMessages
        error={error}
        created={params.created === "1"}
        updated={params.updated === "1"}
        deleted={params.deleted === "1"}
      />

      <DeliverablesTabs
        deliverableCount={deliverables.length}
        pendingCount={deliverables.filter((deliverable) => deliverable.status !== "Aprobado").length}
        createPanel={<DeliverableCreatePanel phases={phases} documents={documents} canManage={canManage} />}
        matrixPanel={<DeliverablesList deliverables={deliverables} phases={phases} documents={documents} activeFilter={activeFilter} canManage={canManage} />}
      />
    </>
  );
}

function StatusMessages({ error, created, updated, deleted }: { error: string | null; created: boolean; updated: boolean; deleted: boolean }) {
  return (
    <>
      {error ? <p className="mb-5 rounded-2xl bg-coral/10 p-4 text-sm font-bold text-coral">{error}</p> : null}
      {created ? <p className="mb-5 rounded-2xl bg-emerald-500/10 p-4 text-sm font-bold text-emerald-700">Entregable creado correctamente.</p> : null}
      {updated ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Entregable actualizado correctamente.</p> : null}
      {deleted ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Entregable eliminado definitivamente.</p> : null}
    </>
  );
}

function DeliverableCreatePanel({ phases, documents, canManage }: { phases: Phase[]; documents: DocumentFile[]; canManage: boolean }) {
  return (
    <Card className="overflow-hidden border-white/80 bg-white/75 p-0">
      <div className="border-b border-white/70 p-5">
        <CardHeader eyebrow="Nuevo entregable" title="Registrar entregable" action={<Badge tone="blue">Archivo opcional</Badge>} />
        <p className="text-sm leading-6 text-slate-600">Crea un entregable y vincula el documento final cuando ya este cargado en gestion documental.</p>
      </div>
      <DeliverableForm action={createDeliverableAction} phases={phases} documents={documents} canSubmit={canManage} submitLabel="Crear entregable" />
    </Card>
  );
}

function DeliverablesList({
  deliverables,
  phases,
  documents,
  activeFilter,
  canManage
}: {
  deliverables: DeliverableRecord[];
  phases: Phase[];
  documents: DocumentFile[];
  activeFilter: DeliverableFilter;
  canManage: boolean;
}) {
  const visibleDeliverables = filterDeliverables(deliverables, activeFilter);
  const isFiltered = activeFilter !== "all";

  return (
    <Card className="overflow-hidden border-white/80 bg-white/75 p-0">
      <div className="border-b border-white/70 p-5">
        <CardHeader
          eyebrow="Matriz"
          title="Entregables registrados"
          action={
            <Link href="/entregables" className="focus-ring rounded-full">
              <Badge tone={isFiltered ? "neutral" : "yellow"}>{isFiltered ? `${visibleDeliverables.length} de ${deliverables.length}` : `${deliverables.length} entregables`}</Badge>
            </Link>
          }
        />
        <p className="text-sm leading-6 text-slate-600">Consulta, actualiza y relaciona entregables con documentos finales y tareas del cronograma.</p>
        <DeliverablesOverview deliverables={deliverables} activeFilter={activeFilter} />
      </div>

      {deliverables.length === 0 ? (
        <EmptyState title="Aun no hay entregables registrados" description="Registra el primer entregable para iniciar la matriz contractual del proyecto." />
      ) : visibleDeliverables.length === 0 ? (
        <EmptyState title="No existen entregables de esta categoria identificados hasta el momento." description="Puedes volver a la vista completa o registrar un nuevo entregable si ya existe informacion." showAllLink />
      ) : (
        <div className="grid gap-3 p-4 sm:p-5">
          {visibleDeliverables.map((deliverable) => (
            <DeliverableCard key={deliverable.id} deliverable={deliverable} phases={phases} documents={documents} canManage={canManage} />
          ))}
        </div>
      )}
    </Card>
  );
}

function DeliverablesOverview({ deliverables, activeFilter }: { deliverables: DeliverableRecord[]; activeFilter: DeliverableFilter }) {
  const pending = deliverables.filter((deliverable) => deliverable.status === "Pendiente").length;
  const progress = deliverables.filter((deliverable) => deliverable.status === "En elaboracion").length;
  const review = deliverables.filter((deliverable) => deliverable.status === "En revision interna" || deliverable.status === "Enviado a Pinares").length;
  const approved = deliverables.filter((deliverable) => deliverable.status === "Aprobado").length;
  const adjustments = deliverables.filter((deliverable) => deliverable.status === "Requiere ajustes").length;
  const withDocuments = deliverables.filter((deliverable) => Boolean(deliverable.file)).length;

  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <Metric label="Pendientes" value={pending} tone="yellow" filter="pending" activeFilter={activeFilter} />
      <Metric label="Elaboracion" value={progress} tone="blue" filter="progress" activeFilter={activeFilter} />
      <Metric label="Revision" value={review} tone="neutral" filter="review" activeFilter={activeFilter} />
      <Metric label="Aprobados" value={approved} tone="green" filter="approved" activeFilter={activeFilter} />
      <Metric label="Ajustes" value={adjustments} tone="red" filter="adjustments" activeFilter={activeFilter} />
      <Metric label="Archivos" value={withDocuments} tone="blue" filter="documents" activeFilter={activeFilter} />
    </div>
  );
}

function Metric({ label, value, tone = "neutral", filter, activeFilter }: { label: string; value: number; tone?: "neutral" | "red" | "blue" | "green" | "yellow"; filter: DeliverableFilter; activeFilter: DeliverableFilter }) {
  const toneClass = {
    neutral: "text-ink bg-white/70",
    red: "text-coral bg-coral/10",
    blue: "text-blueprint bg-blueprint/10",
    green: "text-emerald-700 bg-emerald-500/10",
    yellow: "text-ink bg-sun/20"
  }[tone];
  const activeClass = activeFilter === filter ? "ring-2 ring-blueprint/35 shadow-md shadow-blueprint/10" : "hover:-translate-y-px hover:bg-white/80";

  return (
    <Link href={`/entregables?deliverableFilter=${filter}`} className={`focus-ring block rounded-2xl px-4 py-3 transition ring-1 ring-white/80 ${toneClass} ${activeClass}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] opacity-70">{label}</p>
    </Link>
  );
}

function EmptyState({ title, description, showAllLink = false }: { title: string; description: string; showAllLink?: boolean }) {
  return (
    <div className="p-6">
      <div className="rounded-[1.5rem] border border-dashed border-blueprint/25 bg-white/62 p-8 text-center">
        <PackageCheck className="mx-auto h-9 w-9 text-blueprint" />
        <p className="mt-4 font-display text-xl font-bold text-ink">{title}</p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
        {showAllLink ? <Link href="/entregables" className="focus-ring mt-4 inline-flex rounded-full bg-white/75 px-4 py-2 text-sm font-semibold text-ink ring-1 ring-ink/10">Ver todos los entregables</Link> : null}
      </div>
    </div>
  );
}

function DeliverableCard({ deliverable, phases, documents, canManage }: { deliverable: DeliverableRecord; phases: Phase[]; documents: DocumentFile[]; canManage: boolean }) {
  return (
    <details className="group rounded-[1.35rem] border border-white/80 bg-white/70 p-4 shadow-sm shadow-ink/5">
      <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(deliverable.status)}>{deliverable.status}</Badge>
            <Badge tone="blue">{deliverable.phaseName}</Badge>
            <Badge tone="neutral">{deliverable.linkedTaskCount} tareas</Badge>
            <Badge tone={deliverable.file ? "green" : "neutral"}>{deliverable.file ? "Con archivo" : "Sin archivo"}</Badge>
          </div>
          <h3 className="mt-3 font-display text-xl font-semibold leading-tight text-ink">{deliverable.title}</h3>
          <p className="mt-2 text-sm font-medium text-slate-600">Creado: {deliverable.createdAt}</p>
        </div>
        <div className="flex flex-col items-end gap-3 text-right text-sm text-slate-500">
          <p className="font-semibold text-ink">Detalle</p>
          {canManage ? (
            <form action={deleteDeliverableAction}>
              <input type="hidden" name="deliverableId" value={deliverable.id} />
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
          <DeliverableSnapshot deliverable={deliverable} />
          <DeliverableForm action={updateDeliverableAction} deliverable={deliverable} phases={phases} documents={documents} canSubmit={canManage} submitLabel="Guardar cambios" />
        </div>
        <SidePanel deliverable={deliverable} />
      </div>
    </details>
  );
}

function DeliverableSnapshot({ deliverable }: { deliverable: DeliverableRecord }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <InfoBlock label="Fase" value={deliverable.phaseName} />
      <InfoBlock label="Estado" value={deliverable.status} />
      <InfoBlock label="Tareas vinculadas" value={String(deliverable.linkedTaskCount)} />
    </div>
  );
}

function SidePanel({ deliverable }: { deliverable: DeliverableRecord }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white/62 p-4 ring-1 ring-white/80">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <FileText className="h-4 w-4 text-blueprint" />
          Archivo final
        </p>
        {deliverable.file ? (
          <div className="rounded-xl bg-white/75 p-3 ring-1 ring-white/80">
            <p className="truncate text-sm font-semibold text-ink">{deliverable.file.name}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{deliverable.file.type} · {deliverable.file.folder}</p>
            <Button href={`/documentos/files/${deliverable.file.id}/preview`} variant="ghost" className="mt-3 h-8 px-3 text-xs">
              Ver documento
            </Button>
          </div>
        ) : (
          <p className="rounded-xl bg-white/70 p-3 text-sm text-slate-500">Sin archivo final vinculado.</p>
        )}
      </div>

      <div className="rounded-2xl bg-white/62 p-4 ring-1 ring-white/80">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <Link2 className="h-4 w-4 text-blueprint" />
          Tareas del cronograma
        </p>
        {deliverable.tasks.length === 0 ? (
          <p className="rounded-xl bg-white/70 p-3 text-sm text-slate-500">Sin tareas vinculadas.</p>
        ) : (
          <div className="grid gap-2">
            {deliverable.tasks.map((task) => (
              <div key={task.id} className="rounded-xl bg-white/75 p-3 ring-1 ring-white/80">
                <p className="text-sm font-semibold text-ink">{task.title}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{task.type} · {task.status}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DeliverableForm({
  action,
  deliverable,
  phases,
  documents,
  canSubmit,
  submitLabel
}: {
  action: (formData: FormData) => void | Promise<void>;
  deliverable?: DeliverableRecord;
  phases: Phase[];
  documents: DocumentFile[];
  canSubmit: boolean;
  submitLabel: string;
}) {
  return (
    <form action={action} className="grid gap-0">
      <fieldset disabled={!canSubmit} className="grid gap-0 disabled:opacity-55">
        {deliverable ? <input type="hidden" name="deliverableId" value={deliverable.id} /> : null}
        <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="rounded-[1.4rem] bg-white/60 p-4 ring-1 ring-white/80">
            <SectionTitle icon={<PackageCheck className="h-4 w-4" />} eyebrow="Datos base" title="Que se entrega" />
            <div className="mt-4 grid gap-4">
              <Field label="Titulo">
                <Input name="title" defaultValue={deliverable?.title} placeholder="Ej. Documento de diagnostico consolidado" required />
              </Field>
              <DocumentSelect documents={documents} defaultValue={deliverable?.fileId ?? ""} />
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.4rem] bg-white/60 p-4 ring-1 ring-white/80">
              <SectionTitle icon={<CalendarCheck className="h-4 w-4" />} eyebrow="Control" title="Fase y estado" />
              <div className="mt-4 grid gap-4">
                <SelectField label="Fase" name="phaseId" defaultValue={deliverable?.phaseId ?? ""}>
                  <option value="">Sin fase</option>
                  {phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}
                </SelectField>
                <SelectField label="Estado" name="status" defaultValue={deliverable?.status ?? "Pendiente"}>
                  {deliverableStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </SelectField>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/70 bg-white/35 p-5">
          <div className="flex justify-end">
            <Button type="submit" variant="accent" className="min-w-40 shadow-lg shadow-sun/25">{submitLabel}</Button>
          </div>
        </div>
      </fieldset>
      {!canSubmit ? <p className="rounded-xl bg-blueprint/10 p-3 text-sm font-medium leading-6 text-slate-600">Tu usuario puede consultar entregables, pero solo los administradores pueden modificarlos.</p> : null}
    </form>
  );
}

function DocumentSelect({ documents, defaultValue }: { documents: DocumentFile[]; defaultValue: string }) {
  return (
    <SelectField label="Documento final" name="fileId" defaultValue={defaultValue}>
      <option value="">Sin documento vinculado</option>
      {documents.map((document) => (
        <option key={document.id} value={document.id}>
          {document.name}
        </option>
      ))}
    </SelectField>
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

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/62 p-3 ring-1 ring-white/80">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-blueprint">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{value || "Sin registro"}</p>
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

function normalizeDeliverableFilter(value: string | string[] | undefined): DeliverableFilter {
  const parsed = Array.isArray(value) ? value[0] : value;
  if (parsed === "pending" || parsed === "progress" || parsed === "review" || parsed === "approved" || parsed === "adjustments" || parsed === "documents") return parsed;
  return "all";
}

function filterDeliverables(deliverables: DeliverableRecord[], filter: DeliverableFilter) {
  if (filter === "pending") return deliverables.filter((deliverable) => deliverable.status === "Pendiente");
  if (filter === "progress") return deliverables.filter((deliverable) => deliverable.status === "En elaboracion");
  if (filter === "review") return deliverables.filter((deliverable) => deliverable.status === "En revision interna" || deliverable.status === "Enviado a Pinares");
  if (filter === "approved") return deliverables.filter((deliverable) => deliverable.status === "Aprobado");
  if (filter === "adjustments") return deliverables.filter((deliverable) => deliverable.status === "Requiere ajustes");
  if (filter === "documents") return deliverables.filter((deliverable) => Boolean(deliverable.file));
  return deliverables;
}

function statusTone(status: Deliverable["status"]): "neutral" | "blue" | "yellow" | "red" | "green" {
  if (status === "Aprobado") return "green";
  if (status === "Requiere ajustes") return "red";
  if (status === "En elaboracion" || status === "En revision interna" || status === "Enviado a Pinares") return "blue";
  return "yellow";
}
