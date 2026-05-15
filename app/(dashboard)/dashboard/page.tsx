import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, FileText, Gauge, PackageCheck, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { getDashboardData, type DashboardItem, type DashboardTask } from "@/lib/dashboard";
import type { PhaseProgress } from "@/lib/schedule-progress";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <>
      <DashboardHeader />

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ExecutiveSummary progress={data.metrics.overallProgress} health={data.health} completedTasks={data.metrics.completedTasks} totalTasks={data.metrics.totalTasks} />
        <ExecutiveAlerts data={data} />
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <PhaseProgressPanel phases={data.phases} />
        <UpcomingPanel tasks={data.upcomingTasks} />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <ActivityPanel title="Documentos recientes" eyebrow="Repositorio" href="/documentos" items={data.recentDocuments} empty="Sin documentos cargados todavia." icon={<FileText className="h-4 w-4" />} />
        <ActivityPanel title="Riesgos altos" eyebrow="Alertas" href="/riesgos?riskFilter=high" items={data.highRisks} empty="Sin riesgos altos registrados." icon={<ShieldAlert className="h-4 w-4" />} />
        <ActivityPanel title="Decisiones pendientes" eyebrow="Trazabilidad" href="/decisiones?decisionFilter=pending" items={data.pendingDecisions} empty="Sin decisiones pendientes." icon={<CheckCircle2 className="h-4 w-4" />} />
      </section>
    </>
  );
}

function DashboardHeader() {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div className="max-w-3xl">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.35rem] bg-white/75 p-2.5 shadow-sm shadow-ink/5 ring-1 ring-white/80">
            <Image src="/assets/clinica-pinares.png" alt="Clinica Pinares" width={52} height={52} className="h-full w-full object-contain" priority />
          </div>
          <div>
            <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-blueprint">Centro de control</p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">Panel ejecutivo</h1>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Lectura ejecutiva del avance, alertas, entregables, riesgos y proximas acciones del proyecto Pinares.</p>
      </div>
      <Link href="/cronograma" className="focus-ring inline-flex items-center justify-center rounded-full bg-sun px-4 py-2 text-sm font-semibold text-ink shadow-md shadow-sun/20 transition hover:-translate-y-px">
        Ver cronograma
      </Link>
    </div>
  );
}

function ExecutiveSummary({ progress, health, completedTasks, totalTasks }: { progress: number; health: { label: string; tone: "green" | "yellow" | "red"; description: string }; completedTasks: number; totalTasks: number }) {
  return (
    <Card className="overflow-hidden border-white/80 bg-white/78 p-0">
      <div className="grid gap-5 p-5 md:grid-cols-[12rem_1fr] md:items-center">
        <div className="relative grid aspect-square place-items-center rounded-[2rem] bg-gradient-to-br from-blueprint/12 via-white/70 to-sun/18 ring-1 ring-white/80">
          <div className="absolute inset-5 rounded-full border-[12px] border-white/80" />
          <div className="absolute inset-5 rounded-full border-[12px] border-blueprint/70" style={{ clipPath: `polygon(0 0, ${progress}% 0, ${progress}% 100%, 0 100%)` }} />
          <div className="relative text-center">
            <p className="font-display text-4xl font-semibold tracking-tight text-ink">{progress}%</p>
            <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">Avance</p>
          </div>
        </div>
        <div>
          <Badge tone={health.tone}>{health.label}</Badge>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">Estado ejecutivo del proyecto</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{health.description}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MiniStat label="Tareas completadas" value={completedTasks} />
            <MiniStat label="Total actividades" value={totalTasks} />
            <MiniStat label="Pendientes" value={Math.max(totalTasks - completedTasks, 0)} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function ExecutiveAlerts({ data }: { data: Awaited<ReturnType<typeof getDashboardData>> }) {
  const alerts = [
    { label: "Riesgos altos", value: data.metrics.highRisks, href: "/riesgos?riskFilter=high", tone: "red" as const },
    { label: "Hallazgos criticos", value: data.metrics.criticalFindings, href: "/hallazgos?findingFilter=critical", tone: "red" as const },
    { label: "Tareas bloqueadas", value: data.metrics.blockedTasks, href: "/cronograma", tone: "yellow" as const },
    { label: "Entregables pendientes", value: data.metrics.pendingDeliverables, href: "/entregables?deliverableFilter=pending", tone: "blue" as const }
  ];

  return (
    <Card>
      <CardHeader eyebrow="Foco ejecutivo" title="Que revisar primero" action={<Badge tone="yellow">Accionable</Badge>} />
      <div className="grid gap-2.5">
        {alerts.map((alert) => (
          <Link key={alert.label} href={alert.href} className="focus-ring flex items-center justify-between gap-3 rounded-2xl bg-white/62 p-3 ring-1 ring-white/80 transition hover:bg-white">
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-blueprint/10 text-blueprint">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">{alert.label}</span>
                <span className="text-xs text-slate-500">Abrir detalle filtrado</span>
              </span>
            </span>
            <Badge tone={alert.tone}>{alert.value}</Badge>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function PhaseProgressPanel({ phases }: { phases: PhaseProgress[] }) {
  return (
    <Card>
      <CardHeader eyebrow="Cronograma" title="Avance por fase" action={<Badge tone="blue">{phases.length} fases</Badge>} />
      <div className="grid gap-3">
        {phases.map((phase) => (
          <Link key={phase.id} href={`/cronograma?phase=${phase.id}`} className="focus-ring rounded-2xl bg-white/58 p-3 ring-1 ring-white/80 transition hover:bg-white">
            <div className="mb-2 flex items-center justify-between gap-4 text-sm">
              <span className="font-semibold text-ink">{phase.name}</span>
              <span className="text-slate-500">{phase.progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/80">
              <div className="h-full rounded-full bg-gradient-to-r from-blueprint to-sun" style={{ width: `${phase.progress}%` }} />
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">{phase.completedTasks} completadas / {phase.totalTasks} actividades</p>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function UpcomingPanel({ tasks }: { tasks: DashboardTask[] }) {
  return (
    <Card>
      <CardHeader eyebrow="Ahora" title="Proximas actividades" action={<Badge tone="yellow">{tasks.length}</Badge>} />
      <div className="space-y-3">
        {tasks.length === 0 ? <p className="rounded-xl bg-white/55 p-3 text-sm text-slate-500">No hay tareas pendientes en cronograma.</p> : null}
        {tasks.map((task) => (
          <Link key={task.id} href={`/cronograma?phase=${task.phaseId || "all"}`} className="focus-ring block rounded-2xl bg-white/58 p-3 ring-1 ring-white/80 transition hover:bg-white">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold leading-snug text-ink">{task.title}</p>
              <Badge tone={task.isOverdue ? "red" : task.priority === "Alta" ? "yellow" : "neutral"}>{task.priority}</Badge>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">{task.phaseName} / {task.status}{task.dueDate ? ` / Fin: ${task.dueDate}` : ""}</p>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function ActivityPanel({ title, eyebrow, href, items, empty, icon }: { title: string; eyebrow: string; href: string; items: DashboardItem[]; empty: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader eyebrow={eyebrow} title={title} action={<Link href={href} className="focus-ring rounded-full"><Badge tone="neutral">Ver</Badge></Link>} />
      <div className="space-y-2.5">
        {items.length === 0 ? <p className="rounded-xl bg-white/50 p-3 text-sm text-slate-500">{empty}</p> : null}
        {items.slice(0, 4).map((item) => (
          <Link key={item.id} href={href} className="focus-ring flex items-start gap-3 rounded-xl bg-white/50 p-3 text-sm font-medium text-slate-700 transition hover:bg-white">
            <span className="mt-0.5 text-blueprint">{icon}</span>
            <span className="min-w-0">
              <span className="block truncate text-ink">{item.title}</span>
              {item.meta ? <span className="mt-0.5 block truncate text-xs text-slate-500">{item.meta}</span> : null}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/62 p-3 ring-1 ring-white/80">
      <p className="font-display text-xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}
