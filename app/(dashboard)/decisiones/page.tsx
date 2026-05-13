import Link from "next/link";
import { CalendarCheck, ClipboardList, FileText, GitPullRequestArrow, Lightbulb, Trash2, UserRound } from "lucide-react";
import { createDecisionAction, deleteDecisionAction, updateDecisionAction } from "@/app/(dashboard)/decisiones/actions";
import { DecisionsTabs } from "@/components/modules/decisions-tabs";
import { PageHeader } from "@/components/modules/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { getCurrentProfile, hasPermission } from "@/lib/auth";
import { decisionStatuses, getDecisionsData, type DecisionDocument, type DecisionRecord, type DecisionStatus } from "@/lib/decisions";
import type { DocumentFile } from "@/lib/documents";
import type { UserProfile } from "@/lib/types";

interface DecisionsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

type DecisionFilter = "all" | "pending" | "taken" | "tracking" | "closed" | "documents";

export default async function DecisionsPage({ searchParams }: DecisionsPageProps) {
  const params = searchParams ? await searchParams : {};
  const [{ decisions, users, documents }, profile] = await Promise.all([getDecisionsData(), getCurrentProfile()]);
  const canView = hasPermission(profile, "decisiones", "view");
  const canCreate = hasPermission(profile, "decisiones", "create");
  const canEdit = hasPermission(profile, "decisiones", "edit");
  const canDelete = hasPermission(profile, "decisiones", "delete");
  const activeFilter = normalizeDecisionFilter(params.decisionFilter);
  const error = typeof params.error === "string" ? params.error : null;

  if (!canView) {
    return (
      <>
        <PageHeader eyebrow="Trazabilidad" title="Decisiones" description="Tu usuario no tiene acceso al modulo de decisiones." />
        <Card>
          <p className="font-medium text-slate-600">Solicita acceso al Administrador Vena Digital si necesitas consultar la bitacora de decisiones.</p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Trazabilidad"
        title="Decisiones"
        description="Registro ejecutivo de decisiones, contexto, responsables y seguimiento sin aprobaciones formales."
      />

      <StatusMessages
        error={error}
        created={params.created === "1"}
        updated={params.updated === "1"}
        deleted={params.deleted === "1"}
      />

      <DecisionsTabs
        decisionCount={decisions.length}
        pendingCount={decisions.filter((decision) => decision.status === "Pendiente" || decision.status === "En seguimiento").length}
        createPanel={<DecisionCreatePanel users={users} documents={documents} canCreate={canCreate} />}
        matrixPanel={<DecisionList decisions={decisions} users={users} documents={documents} activeFilter={activeFilter} canEdit={canEdit} canDelete={canDelete} />}
      />
    </>
  );
}

function StatusMessages({ error, created, updated, deleted }: { error: string | null; created: boolean; updated: boolean; deleted: boolean }) {
  return (
    <>
      {error ? <p className="mb-5 rounded-2xl bg-coral/10 p-4 text-sm font-bold text-coral">{error}</p> : null}
      {created ? <p className="mb-5 rounded-2xl bg-emerald-500/10 p-4 text-sm font-bold text-emerald-700">Decision creada correctamente.</p> : null}
      {updated ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Decision actualizada correctamente.</p> : null}
      {deleted ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Decision eliminada definitivamente.</p> : null}
    </>
  );
}

function DecisionCreatePanel({ users, documents, canCreate }: { users: UserProfile[]; documents: DocumentFile[]; canCreate: boolean }) {
  return (
    <Card className="overflow-hidden border-white/80 bg-white/75 p-0">
      <div className="border-b border-white/70 p-5">
        <CardHeader eyebrow="Nueva decision" title="Registrar decision" action={<Badge tone="blue">Bitacora ejecutiva</Badge>} />
        <p className="text-sm leading-6 text-slate-600">Registra decisiones tomadas o pendientes con contexto, alternativas, responsable y documentos relacionados.</p>
      </div>
      <DecisionForm action={createDecisionAction} users={users} documents={documents} canSubmit={canCreate} submitLabel="Crear decision" />
    </Card>
  );
}

function DecisionList({
  decisions,
  users,
  documents,
  activeFilter,
  canEdit,
  canDelete
}: {
  decisions: DecisionRecord[];
  users: UserProfile[];
  documents: DocumentFile[];
  activeFilter: DecisionFilter;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const visibleDecisions = filterDecisions(decisions, activeFilter);
  const isFiltered = activeFilter !== "all";

  return (
    <Card className="overflow-hidden border-white/80 bg-white/75 p-0">
      <div className="border-b border-white/70 p-5">
        <CardHeader
          eyebrow="Bitacora"
          title="Decisiones registradas"
          action={
            <Link href="/decisiones" className="focus-ring rounded-full">
              <Badge tone={isFiltered ? "neutral" : "yellow"}>{isFiltered ? `${visibleDecisions.length} de ${decisions.length}` : `${decisions.length} decisiones`}</Badge>
            </Link>
          }
        />
        <p className="text-sm leading-6 text-slate-600">Consulta, actualiza y vincula decisiones con documentos formales del proyecto.</p>
        <DecisionOverview decisions={decisions} activeFilter={activeFilter} />
      </div>

      {decisions.length === 0 ? (
        <EmptyState title="Aun no hay decisiones registradas" description="Registra la primera decision para construir la trazabilidad ejecutiva del proyecto." />
      ) : visibleDecisions.length === 0 ? (
        <EmptyState title="No existen decisiones de esta categoria identificadas hasta el momento." description="Puedes volver a la vista completa o registrar una nueva decision si ya existe informacion." showAllLink />
      ) : (
        <div className="grid gap-3 p-4 sm:p-5">
          {visibleDecisions.map((decision) => (
            <DecisionCard key={decision.id} decision={decision} users={users} documents={documents} canEdit={canEdit} canDelete={canDelete} />
          ))}
        </div>
      )}
    </Card>
  );
}

function DecisionOverview({ decisions, activeFilter }: { decisions: DecisionRecord[]; activeFilter: DecisionFilter }) {
  const pending = decisions.filter((decision) => decision.status === "Pendiente").length;
  const taken = decisions.filter((decision) => decision.status === "Tomada").length;
  const tracking = decisions.filter((decision) => decision.status === "En seguimiento").length;
  const closed = decisions.filter((decision) => decision.status === "Cerrada").length;
  const withDocuments = decisions.filter((decision) => decision.documents.length > 0).length;

  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-5">
      <Metric label="Pendientes" value={pending} tone="yellow" filter="pending" activeFilter={activeFilter} />
      <Metric label="Tomadas" value={taken} tone="blue" filter="taken" activeFilter={activeFilter} />
      <Metric label="Seguimiento" value={tracking} tone="red" filter="tracking" activeFilter={activeFilter} />
      <Metric label="Cerradas" value={closed} tone="green" filter="closed" activeFilter={activeFilter} />
      <Metric label="Documentos" value={withDocuments} tone="neutral" filter="documents" activeFilter={activeFilter} />
    </div>
  );
}

function Metric({ label, value, tone = "neutral", filter, activeFilter }: { label: string; value: number; tone?: "neutral" | "red" | "blue" | "green" | "yellow"; filter: DecisionFilter; activeFilter: DecisionFilter }) {
  const toneClass = {
    neutral: "text-ink bg-white/70",
    red: "text-coral bg-coral/10",
    blue: "text-blueprint bg-blueprint/10",
    green: "text-emerald-700 bg-emerald-500/10",
    yellow: "text-ink bg-sun/20"
  }[tone];
  const activeClass = activeFilter === filter ? "ring-2 ring-blueprint/35 shadow-md shadow-blueprint/10" : "hover:-translate-y-px hover:bg-white/80";

  return (
    <Link href={`/decisiones?decisionFilter=${filter}`} className={`focus-ring block rounded-2xl px-4 py-3 transition ring-1 ring-white/80 ${toneClass} ${activeClass}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] opacity-70">{label}</p>
    </Link>
  );
}

function EmptyState({ title, description, showAllLink = false }: { title: string; description: string; showAllLink?: boolean }) {
  return (
    <div className="p-6">
      <div className="rounded-[1.5rem] border border-dashed border-blueprint/25 bg-white/62 p-8 text-center">
        <GitPullRequestArrow className="mx-auto h-9 w-9 text-blueprint" />
        <p className="mt-4 font-display text-xl font-bold text-ink">{title}</p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
        {showAllLink ? <Link href="/decisiones" className="focus-ring mt-4 inline-flex rounded-full bg-white/75 px-4 py-2 text-sm font-semibold text-ink ring-1 ring-ink/10">Ver todas las decisiones</Link> : null}
      </div>
    </div>
  );
}

function DecisionCard({ decision, users, documents, canEdit, canDelete }: { decision: DecisionRecord; users: UserProfile[]; documents: DocumentFile[]; canEdit: boolean; canDelete: boolean }) {
  return (
    <details className="group rounded-[1.35rem] border border-white/80 bg-white/70 p-4 shadow-sm shadow-ink/5">
      <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(decision.status)}>{decision.status}</Badge>
            <Badge tone="neutral">{decision.documents.length} documentos</Badge>
          </div>
          <h3 className="mt-3 font-display text-xl font-semibold leading-tight text-ink">{decision.title}</h3>
          <p className="mt-2 text-sm font-medium text-slate-600">{decision.date} · Responsable: {decision.owner}</p>
        </div>
        <div className="flex flex-col items-end gap-3 text-right text-sm text-slate-500">
          <div>
            <p className="font-semibold text-ink">Detalle</p>
            <p>Creada: {decision.createdAt}</p>
            <p>Actualizada: {decision.updatedAt}</p>
          </div>
          {canDelete ? (
            <form action={deleteDecisionAction}>
              <input type="hidden" name="decisionId" value={decision.id} />
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
          <DecisionSnapshot decision={decision} />
          <DecisionForm action={updateDecisionAction} decision={decision} users={users} documents={documents} canSubmit={canEdit} submitLabel="Guardar cambios" />
        </div>
        <DocumentPanel documents={decision.documents} />
      </div>
    </details>
  );
}

function DecisionSnapshot({ decision }: { decision: DecisionRecord }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <InfoBlock label="Fecha" value={decision.date} />
      <InfoBlock label="Responsable" value={decision.owner} />
      <InfoBlock label="Estado" value={decision.status} />
      <TextBlock label="Contexto" value={decision.context} />
      <TextBlock label="Alternativas" value={decision.alternatives} />
      <TextBlock label="Decision tomada" value={decision.decisionTaken} />
      <TextBlock label="Participantes" value={decision.participants} />
      <TextBlock label="Descripcion" value={decision.description} />
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

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/62 p-3 ring-1 ring-white/80 md:col-span-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-blueprint">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{value || "Sin registro."}</p>
    </div>
  );
}

function DecisionForm({
  action,
  decision,
  users,
  documents,
  canSubmit,
  submitLabel
}: {
  action: (formData: FormData) => void | Promise<void>;
  decision?: DecisionRecord;
  users: UserProfile[];
  documents: DocumentFile[];
  canSubmit: boolean;
  submitLabel: string;
}) {
  const selectedDocuments = new Set(decision?.documents.map((document) => document.id) ?? []);

  return (
    <form action={action} className="grid gap-0">
      <fieldset disabled={!canSubmit} className="grid gap-0 disabled:opacity-55">
        {decision ? <input type="hidden" name="decisionId" value={decision.id} /> : null}
        <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="rounded-[1.4rem] bg-white/60 p-4 ring-1 ring-white/80">
            <SectionTitle icon={<Lightbulb className="h-4 w-4" />} eyebrow="Datos base" title="Que se decide" />
            <div className="mt-4 grid gap-4">
              <Field label="Titulo">
                <Input name="title" defaultValue={decision?.title} placeholder="Ej. Teams sera canal oficial de entrevistas" required />
              </Field>
              <Field label="Descripcion">
                <Textarea name="description" defaultValue={decision?.description} placeholder="Resume la decision o pendiente ejecutivo." className="min-h-28" />
              </Field>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.4rem] bg-white/60 p-4 ring-1 ring-white/80">
              <SectionTitle icon={<CalendarCheck className="h-4 w-4" />} eyebrow="Seguimiento" title="Estado y fecha" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <SelectField label="Estado" name="status" defaultValue={decision?.status ?? "Pendiente"}>
                  {decisionStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </SelectField>
                <Field label="Fecha de decision">
                  <Input name="decisionDate" type="date" defaultValue={decision?.decisionDate} />
                </Field>
              </div>
            </div>

            <div className="rounded-[1.4rem] bg-white/60 p-4 ring-1 ring-white/80">
              <SectionTitle icon={<UserRound className="h-4 w-4" />} eyebrow="Responsables" title="Quienes participan" />
              <div className="mt-4 grid gap-4">
                <SelectField label="Responsable" name="ownerId" defaultValue={decision?.ownerId ?? ""}>
                  <option value="">Sin responsable</option>
                  {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                </SelectField>
                <Field label="Participantes">
                  <Input name="participants" defaultValue={decision?.participants} placeholder="Ej. Vena Digital, Gerencia, Sistemas, Finanzas" />
                </Field>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/70 bg-white/35 p-5">
          <div className="rounded-[1.4rem] bg-white/60 p-4 ring-1 ring-white/80">
            <SectionTitle icon={<ClipboardList className="h-4 w-4" />} eyebrow="Analisis" title="Contexto, alternativas y acuerdo" />
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <Field label="Contexto">
                <Textarea name="context" defaultValue={decision?.context} placeholder="Explica el contexto que origina la decision." className="min-h-32" />
              </Field>
              <Field label="Alternativas">
                <Textarea name="alternatives" defaultValue={decision?.alternatives} placeholder="Opciones evaluadas antes de tomar la decision." className="min-h-32" />
              </Field>
              <Field label="Decision tomada">
                <Textarea name="decisionTaken" defaultValue={decision?.decisionTaken} placeholder="Describe la decision final o el acuerdo alcanzado." className="min-h-32" />
              </Field>
            </div>
          </div>
        </div>

        <div className="border-t border-white/70 bg-white/35 p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <DocumentPicker documents={documents} selectedDocuments={selectedDocuments} />
            <div className="flex justify-end">
              <Button type="submit" variant="accent" className="min-w-40 shadow-lg shadow-sun/25">{submitLabel}</Button>
            </div>
          </div>
        </div>
      </fieldset>
      {!canSubmit ? <p className="rounded-xl bg-blueprint/10 p-3 text-sm font-medium leading-6 text-slate-600">Tu usuario puede consultar decisiones, pero no tiene permiso para modificarlas.</p> : null}
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

function DocumentPicker({ documents, selectedDocuments }: { documents: DocumentFile[]; selectedDocuments: Set<string> }) {
  return (
    <div className="rounded-[1.4rem] bg-white/60 p-4 ring-1 ring-white/80">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle icon={<FileText className="h-4 w-4" />} eyebrow="Soporte" title="Documentos relacionados" />
        <span className="rounded-full bg-blueprint/10 px-3 py-1 text-xs font-semibold text-blueprint">{documents.length} disponibles</span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">Vincula documentos ya cargados en gestion documental. No es obligatorio.</p>
      {documents.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-blueprint/20 bg-blueprint/5 p-4 text-sm leading-6 text-slate-500">
          Aun no hay documentos cargados para vincular.
        </div>
      ) : (
        <div className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
          {documents.map((document) => (
            <label key={document.id} className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/70 p-3 text-sm text-slate-700 ring-1 ring-white/80 transition hover:bg-white">
              <input type="checkbox" name="documentIds" value={document.id} defaultChecked={selectedDocuments.has(document.id)} className="mt-1 h-4 w-4 rounded border-ink/20 accent-blueprint" />
              <span className="min-w-0">
                <span className="block truncate font-semibold text-ink">{document.name}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{document.type} · {document.folder}</span>
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentPanel({ documents }: { documents: DecisionDocument[] }) {
  return (
    <div className="rounded-2xl bg-white/62 p-4 ring-1 ring-white/80">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <CalendarCheck className="h-4 w-4 text-blueprint" />
        Documentos vinculados
      </p>
      {documents.length === 0 ? (
        <p className="rounded-xl bg-white/70 p-3 text-sm text-slate-500">Sin documentos vinculados.</p>
      ) : (
        <div className="grid gap-2">
          {documents.map((document) => (
            <div key={document.id} className="rounded-xl bg-white/75 p-3 ring-1 ring-white/80">
              <p className="truncate text-sm font-semibold text-ink">{document.name}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{document.type} · {document.folder}</p>
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

function normalizeDecisionFilter(value: string | string[] | undefined): DecisionFilter {
  const parsed = Array.isArray(value) ? value[0] : value;
  if (parsed === "pending" || parsed === "taken" || parsed === "tracking" || parsed === "closed" || parsed === "documents") return parsed;
  return "all";
}

function filterDecisions(decisions: DecisionRecord[], filter: DecisionFilter) {
  if (filter === "pending") return decisions.filter((decision) => decision.status === "Pendiente");
  if (filter === "taken") return decisions.filter((decision) => decision.status === "Tomada");
  if (filter === "tracking") return decisions.filter((decision) => decision.status === "En seguimiento");
  if (filter === "closed") return decisions.filter((decision) => decision.status === "Cerrada");
  if (filter === "documents") return decisions.filter((decision) => decision.documents.length > 0);
  return decisions;
}

function statusTone(status: DecisionStatus): "neutral" | "blue" | "yellow" | "red" | "green" {
  if (status === "Cerrada") return "green";
  if (status === "Tomada") return "blue";
  if (status === "En seguimiento") return "red";
  return "yellow";
}
