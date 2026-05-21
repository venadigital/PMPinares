import Link from "next/link";
import { BarChart3, Download, Eye, Gauge, Link2, Paperclip, ScrollText, Trash2, TriangleAlert } from "lucide-react";
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

type RiskFilter = "all" | "high" | "medium" | "low" | `area:${string}` | `level:${RiskLevel}` | `category:${string}` | `status:${string}` | `regulation:${string}` | `link:${RiskLinkType}:${string}`;

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
        analyticsPanel={<RisksAnalytics risks={risks} />}
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
  const medium = risks.filter((risk) => risk.level === "Medio").length;
  const low = risks.filter((risk) => risk.level === "Bajo").length;

  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-4">
      <Metric label="Todos" value={risks.length} tone="blue" filter="all" activeFilter={activeFilter} />
      <Metric label="Nivel alto" value={high} tone="red" filter="level:Alto" activeFilter={activeFilter} />
      <Metric label="Nivel medio" value={medium} tone="yellow" filter="level:Medio" activeFilter={activeFilter} />
      <Metric label="Nivel bajo" value={low} tone="green" filter="level:Bajo" activeFilter={activeFilter} />
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
    <Link href={riskFilterHref(filter)} className={`focus-ring block rounded-2xl px-4 py-3 transition ring-1 ring-white/80 ${toneClass} ${activeClass}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] opacity-70">{label}</p>
    </Link>
  );
}

function RisksAnalytics({ risks }: { risks: RiskRecord[] }) {
  const total = risks.length;
  const levelRows = riskLevels.map((level) => ({
    label: level,
    count: risks.filter((risk) => risk.level === level).length,
    filter: riskLevelFilter(level),
    tone: levelTone(level)
  }));
  const linkRows = rankByRiskLinks(risks).slice(0, 8);
  const categoryRows = rankRisksBy(risks, (risk) => risk.category);
  const statusRows = riskStatuses.map((status) => ({
    label: status,
    count: risks.filter((risk) => risk.status === status).length,
    filter: `status:${status}` as RiskFilter
  }));
  const regulationRows = rankRisksBy(risks, (risk) => risk.regulation);

  if (total === 0) {
    return (
      <Card className="overflow-hidden border-white/80 bg-white/75 p-0">
        <div className="p-6">
          <div className="rounded-[1.5rem] border border-dashed border-blueprint/25 bg-white/62 p-8 text-center">
            <BarChart3 className="mx-auto h-10 w-10 text-blueprint" />
            <p className="mt-4 font-display text-xl font-bold text-ink">Aun no hay riesgos suficientes para graficar</p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">Cuando registres riesgos, aqui apareceran niveles de exposicion, vinculos frecuentes, categorias y normativas relacionadas.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-white/80 bg-white/75 p-0">
      <div className="border-b border-white/70 p-5">
        <CardHeader eyebrow="Analitica" title="Lectura dinamica de riesgos" action={<Badge tone="yellow">{total} riesgos</Badge>} />
        <p className="text-sm leading-6 text-slate-600">Explora exposicion, concentracion, categorias, normativas y estado de gestion. Cada bloque puede llevarte a la matriz filtrada.</p>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-[1.35rem] border border-white/80 bg-white/68 p-4 shadow-sm shadow-ink/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blueprint">Nivel</p>
              <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">Exposicion general</h3>
            </div>
            <Badge tone="blue">100%</Badge>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-center">
            <RiskLevelDonut rows={levelRows} total={total} />
            <div className="grid gap-2">
              {levelRows.map((row) => (
                <AnalyticsMetricLink key={row.label} href={riskFilterHref(row.filter)} label={`Nivel ${row.label}`} count={row.count} total={total} tone={row.tone} />
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[1.35rem] border border-white/80 bg-white/68 p-4 shadow-sm shadow-ink/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blueprint">Vinculos</p>
              <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">Donde se concentran</h3>
            </div>
            <Badge tone="neutral">{linkRows.length} vinculos</Badge>
          </div>
          <div className="mt-4 grid gap-2">
            {linkRows.length > 0 ? linkRows.map((row) => (
              <BarLink key={`${row.type}:${row.label}`} href={riskFilterHref(`link:${row.type}:${row.label}`)} label={`${linkTypeLabel(row.type)}: ${row.label}`} count={row.count} total={total} />
            )) : <p className="rounded-2xl bg-white/70 p-4 text-sm text-slate-500">Aun no hay vinculos suficientes para graficar.</p>}
          </div>
        </section>

        <section className="rounded-[1.35rem] border border-white/80 bg-white/68 p-4 shadow-sm shadow-ink/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blueprint">Categoria</p>
              <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">Tipos mas frecuentes</h3>
            </div>
            <Badge tone="blue">{categoryRows.length} categorias</Badge>
          </div>
          <div className="mt-4 grid gap-2">
            {categoryRows.map((row) => (
              <BarLink key={row.label} href={riskFilterHref(`category:${row.label}`)} label={row.label} count={row.count} total={total} tone="blue" />
            ))}
          </div>
        </section>

        <section className="rounded-[1.35rem] border border-white/80 bg-white/68 p-4 shadow-sm shadow-ink/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blueprint">Gestion</p>
              <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">Estado de avance</h3>
            </div>
            <Badge tone="green">{statusRows.filter((row) => row.count > 0).length} activos</Badge>
          </div>
          <div className="mt-4 grid gap-2">
            {statusRows.map((row) => (
              <BarLink key={row.label} href={riskFilterHref(row.filter)} label={row.label} count={row.count} total={total} tone="green" />
            ))}
          </div>
        </section>

        <section className="rounded-[1.35rem] border border-white/80 bg-white/68 p-4 shadow-sm shadow-ink/5 xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blueprint">Normativa</p>
              <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">Normativas mas relacionadas</h3>
            </div>
            <Badge tone="yellow">{regulationRows.length} normativas</Badge>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {regulationRows.map((row) => (
              <BarLink key={row.label} href={riskFilterHref(`regulation:${row.label}`)} label={row.label} count={row.count} total={total} tone="yellow" />
            ))}
          </div>
        </section>
      </div>
    </Card>
  );
}

function RiskLevelDonut({ rows, total }: { rows: { label: RiskLevel; count: number; tone: "neutral" | "blue" | "yellow" | "red" | "green" }[]; total: number }) {
  const high = rows.find((row) => row.label === "Alto")?.count ?? 0;
  const medium = rows.find((row) => row.label === "Medio")?.count ?? 0;
  const highEnd = percentage(high, total);
  const mediumEnd = highEnd + percentage(medium, total);
  const chartStyle = {
    background: `conic-gradient(#ff5a5f 0% ${highEnd}%, #f6c90e ${highEnd}% ${mediumEnd}%, #10b981 ${mediumEnd}% 100%)`
  };

  return (
    <div className="mx-auto grid h-48 w-48 place-items-center rounded-full p-4 shadow-inner shadow-ink/10" style={chartStyle}>
      <div className="grid h-32 w-32 place-items-center rounded-full bg-white/92 text-center shadow-sm shadow-ink/5">
        <div>
          <p className="font-display text-3xl font-bold text-ink">{percentage(high, total)}%</p>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-coral">Alto</p>
        </div>
      </div>
    </div>
  );
}

function AnalyticsMetricLink({ href, label, count, total, tone }: { href: string; label: string; count: number; total: number; tone: "neutral" | "blue" | "yellow" | "red" | "green" }) {
  return (
    <Link href={href} className="focus-ring grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-white/72 p-3 ring-1 ring-white/80 transition hover:bg-white">
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-ink">{label}</span>
        <span className="mt-1 block text-xs text-slate-500">{percentage(count, total)}% del total</span>
      </span>
      <Badge tone={tone}>{count}</Badge>
    </Link>
  );
}

function BarLink({ href, label, count, total, tone = "yellow" }: { href: string; label: string; count: number; total: number; tone?: "blue" | "green" | "yellow" }) {
  const width = `${percentage(count, total)}%`;
  const barClass = {
    blue: "bg-blueprint",
    green: "bg-emerald-500",
    yellow: "bg-sun"
  }[tone];

  return (
    <Link href={href} className="focus-ring block rounded-2xl bg-white/72 p-3 ring-1 ring-white/80 transition hover:bg-white">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="truncate text-sm font-semibold text-ink">{label}</span>
        <span className="text-xs font-semibold text-slate-500">{count} / {percentage(count, total)}%</span>
      </div>
      <span className="block h-2 overflow-hidden rounded-full bg-ink/5">
        <span className={`block h-full rounded-full ${barClass}`} style={{ width }} />
      </span>
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
        <RiskAreaFilters risks={risks} areas={options.areas} activeFilter={activeFilter} />
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

function RiskAreaFilters({ risks, areas, activeFilter }: { risks: RiskRecord[]; areas: RiskOptions["areas"]; activeFilter: RiskFilter }) {
  const unassignedCount = risks.filter((risk) => !risk.linkRecords.some((link) => link.type === "area")).length;

  return (
    <div className="mt-3 rounded-[1.25rem] border border-white/80 bg-white/58 p-4 shadow-inner shadow-white/60">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blueprint">Filtrar por area</p>
          <p className="mt-1 text-xs text-slate-500">Selecciona un area para ver solo los riesgos relacionados.</p>
        </div>
        <Link href="/riesgos" className="focus-ring rounded-full">
          <Badge tone={activeFilter === "all" ? "blue" : "neutral"}>Ver todas</Badge>
        </Link>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {areas.map((area) => {
          const count = risks.filter((risk) => risk.linkRecords.some((link) => link.type === "area" && (link.id === `area:${area.id}` || link.label === area.name))).length;
          const active = activeFilter === `area:${area.id}` || activeFilter === `area:${area.name}`;
          return (
            <Link
              key={area.id}
              href={riskFilterHref(`area:${area.id}`)}
              className={`focus-ring flex min-h-10 items-center justify-between gap-3 rounded-2xl px-3.5 py-2 text-sm font-semibold ring-1 transition ${
                active
                  ? "bg-blueprint text-white ring-blueprint shadow-md shadow-blueprint/20"
                  : "bg-white/78 text-slate-700 ring-white/90 hover:bg-white hover:text-blueprint"
              }`}
            >
              <span className="min-w-0 truncate">{area.name}</span>
              <span className={`rounded-full px-2 py-0.5 text-[0.65rem] ${active ? "bg-white/20 text-white" : "bg-blueprint/10 text-blueprint"}`}>{count}</span>
            </Link>
          );
        })}
        {unassignedCount > 0 ? (
          <Link
            href={riskFilterHref("area:__none")}
            className={`focus-ring flex min-h-10 items-center justify-between gap-3 rounded-2xl px-3.5 py-2 text-sm font-semibold ring-1 transition ${
              activeFilter === "area:__none"
                ? "bg-blueprint text-white ring-blueprint shadow-md shadow-blueprint/20"
                : "bg-white/78 text-slate-700 ring-white/90 hover:bg-white hover:text-blueprint"
            }`}
          >
            <span className="min-w-0 truncate">Sin area</span>
            <span className={`rounded-full px-2 py-0.5 text-[0.65rem] ${activeFilter === "area:__none" ? "bg-white/20 text-white" : "bg-blueprint/10 text-blueprint"}`}>{unassignedCount}</span>
          </Link>
        ) : null}
      </div>
    </div>
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
    <details className="group rounded-[1.35rem] border border-white/80 bg-white/70 p-4 shadow-sm shadow-ink/5 open:bg-white/82 open:shadow-md open:shadow-blueprint/10">
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

      <div className="mt-5 border-t border-white/70 pt-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <RiskSnapshot risk={risk} />
          <AttachmentPanel attachments={risk.attachments} canDelete={canDelete} />
        </div>

        <div className="mt-4 overflow-hidden rounded-[1.35rem] border border-white/80 bg-white/62 shadow-sm shadow-ink/5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/70 p-4">
            <div>
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blueprint">Edicion</p>
              <h4 className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">Actualizar riesgo</h4>
            </div>
            <Badge tone={canEdit ? "blue" : "neutral"}>{canEdit ? "Editable" : "Solo lectura"}</Badge>
          </div>
          <RiskForm action={updateRiskAction} risk={risk} options={options} canSubmit={canEdit} submitLabel="Guardar cambios" variant="compact" />
        </div>
      </div>
    </details>
  );
}

function RiskSnapshot({ risk }: { risk: RiskRecord }) {
  return (
    <div className="rounded-[1.35rem] border border-white/80 bg-white/62 p-4 shadow-sm shadow-ink/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blueprint">Resumen del riesgo</p>
          <h4 className="mt-1 font-display text-lg font-semibold tracking-tight text-ink">Lectura rapida</h4>
        </div>
        <Badge tone={levelTone(risk.level)}>{risk.level}</Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoBlock label="Normativa" value={risk.regulation} />
        <InfoBlock label="Categoria" value={risk.category} />
        <InfoBlock label="Estado" value={risk.status} />
        <InfoBlock label="Creado por" value={risk.createdBy} />
      </div>

      <div className="mt-3 rounded-2xl bg-white/72 p-4 ring-1 ring-white/80">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-blueprint">Descripcion</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{risk.description || "Sin descripcion registrada."}</p>
      </div>

      <div className="mt-3 rounded-2xl bg-white/72 p-4 ring-1 ring-white/80">
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
    <div className="rounded-2xl bg-white/72 p-3 ring-1 ring-white/80">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-blueprint">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-medium leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function RiskForm({
  action,
  risk,
  options,
  canSubmit,
  submitLabel,
  variant = "full"
}: {
  action: (formData: FormData) => void | Promise<void>;
  risk?: RiskRecord;
  options: RiskOptions;
  canSubmit: boolean;
  submitLabel: string;
  variant?: "full" | "compact";
}) {
  const selectedLinks = new Set(risk?.linkRecords.map((link) => link.id) ?? []);

  if (variant === "compact") {
    return (
      <form action={action}>
        <fieldset disabled={!canSubmit} className="grid gap-4 p-4 disabled:opacity-55">
          {risk ? <input type="hidden" name="riskId" value={risk.id} /> : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Titulo">
              <Input name="title" defaultValue={risk?.title} placeholder="Ej. Acceso no autorizado a informacion clinica" required />
            </Field>
            <SelectField label="Nivel" name="level" defaultValue={risk?.level ?? "Medio"}>
              {riskLevels.map((level) => <option key={level} value={level}>{level}</option>)}
            </SelectField>
            <SelectField label="Estado" name="status" defaultValue={risk?.status ?? "Abierto"}>
              {riskStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </SelectField>
            <SelectField label="Categoria" name="category" defaultValue={risk?.category ?? "Operativo"}>
              {riskCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </SelectField>
            <SelectField label="Normativa" name="regulation" defaultValue={risk?.regulation ?? "No aplica / por definir"}>
              {riskRegulations.map((regulation) => <option key={regulation} value={regulation}>{regulation}</option>)}
            </SelectField>
            <div className="rounded-2xl border border-dashed border-blueprint/20 bg-blueprint/10 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Paperclip className="h-4 w-4 text-blueprint" />
                Agregar soportes
              </p>
              <Input name="attachments" type="file" multiple className="mt-3 cursor-pointer bg-white/90 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-blueprint/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-blueprint" />
            </div>
          </div>

          <Field label="Descripcion">
            <Textarea name="description" defaultValue={risk?.description} placeholder="Describe el escenario, causa, impacto y contexto del riesgo." className="min-h-28" />
          </Field>

          <RiskLinks options={options} selectedLinks={selectedLinks} compact />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/70 pt-4">
            {!canSubmit ? <p className="text-sm font-medium leading-6 text-slate-600">Tu usuario puede consultar riesgos, pero no tiene permiso para modificarlos.</p> : <p className="text-sm font-medium leading-6 text-slate-500">Los cambios actualizaran la matriz de riesgos y el panel ejecutivo.</p>}
            <Button type="submit" variant="accent" className="min-w-40 shadow-lg shadow-sun/25">{submitLabel}</Button>
          </div>
        </fieldset>
      </form>
    );
  }

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

function RiskLinks({ options, selectedLinks, compact = false }: { options: RiskOptions; selectedLinks: Set<string>; compact?: boolean }) {
  const groups = [
    { label: "Areas", options: options.areas },
    { label: "Herramientas", options: options.tools },
    { label: "Procesos", options: options.processes },
    { label: "Hallazgos", options: options.findings }
  ];

  return (
    <div className={`${compact ? "rounded-2xl bg-white/72 p-4" : "rounded-[1.4rem] bg-white/60 p-4"} ring-1 ring-white/80`}>
      <SectionTitle icon={<Link2 className="h-4 w-4" />} eyebrow="Trazabilidad" title="Vinculos del riesgo" />
      <p className="mt-3 text-xs leading-5 text-slate-500">Selecciona uno o varios vinculos. Este campo es obligatorio para mantener trazabilidad.</p>
      <div className={`mt-4 grid gap-3 ${compact ? "xl:grid-cols-4" : "lg:grid-cols-2"}`}>
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
  if (parsed === "high") return "level:Alto";
  if (parsed === "medium") return "level:Medio";
  if (parsed === "low") return "level:Bajo";
  if (parsed?.startsWith("area:") || parsed?.startsWith("level:") || parsed?.startsWith("category:") || parsed?.startsWith("status:") || parsed?.startsWith("regulation:") || parsed?.startsWith("link:")) return parsed as RiskFilter;
  return "all";
}

function filterRisks(risks: RiskRecord[], filter: RiskFilter) {
  if (filter === "high" || filter === "level:Alto") return risks.filter((risk) => risk.level === "Alto");
  if (filter === "medium" || filter === "level:Medio") return risks.filter((risk) => risk.level === "Medio");
  if (filter === "low" || filter === "level:Bajo") return risks.filter((risk) => risk.level === "Bajo");
  if (filter.startsWith("area:")) {
    const areaFilter = filter.slice("area:".length);
    if (areaFilter === "__none") return risks.filter((risk) => !risk.linkRecords.some((link) => link.type === "area"));
    return risks.filter((risk) => risk.linkRecords.some((link) => link.type === "area" && (link.id === `area:${areaFilter}` || link.label === areaFilter)));
  }
  if (filter.startsWith("category:")) return risks.filter((risk) => risk.category === filter.slice("category:".length));
  if (filter.startsWith("status:")) return risks.filter((risk) => risk.status === filter.slice("status:".length));
  if (filter.startsWith("regulation:")) return risks.filter((risk) => risk.regulation === filter.slice("regulation:".length));
  if (filter.startsWith("link:")) {
    const [type, ...labelParts] = filter.slice("link:".length).split(":");
    const label = labelParts.join(":");
    return risks.filter((risk) => risk.linkRecords.some((link) => link.type === type && link.label === label));
  }
  return risks;
}

function riskLevelFilter(level: RiskLevel): RiskFilter {
  return `level:${level}`;
}

function riskFilterHref(filter: RiskFilter | string) {
  return filter === "all" ? "/riesgos" : `/riesgos?riskFilter=${encodeURIComponent(filter)}`;
}

function percentage(count: number, total: number) {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

function rankRisksBy(risks: RiskRecord[], getLabel: (risk: RiskRecord) => string) {
  const counts = risks.reduce<Record<string, number>>((accumulator, risk) => {
    const label = getLabel(risk) || "Sin dato";
    accumulator[label] = (accumulator[label] ?? 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((first, second) => second.count - first.count || first.label.localeCompare(second.label));
}

function rankByRiskLinks(risks: RiskRecord[]) {
  const counts = risks.reduce<Record<string, { type: RiskLinkType; label: string; count: number }>>((accumulator, risk) => {
    risk.linkRecords.forEach((link) => {
      const key = `${link.type}:${link.label}`;
      accumulator[key] = accumulator[key] ?? { type: link.type, label: link.label, count: 0 };
      accumulator[key].count += 1;
    });
    return accumulator;
  }, {});

  return Object.values(counts).sort((first, second) => second.count - first.count || first.label.localeCompare(second.label));
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
