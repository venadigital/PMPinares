import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { TaskCreateModal } from "@/components/modules/task-create-modal";
import { TaskEditForm } from "@/components/modules/task-edit-form";
import { TaskStatusForm } from "@/components/modules/task-status-form";
import { cn } from "@/lib/utils";
import type { ScheduleTask } from "@/lib/schedule";
import type { Deliverable, Phase, Status, UserProfile } from "@/lib/types";

const statuses: Status[] = ["No iniciado", "En progreso", "En revision", "Bloqueado", "Completado"];

const statusMeta: Record<Status, { tone: "neutral" | "blue" | "yellow" | "red" | "green"; dot: string }> = {
  "No iniciado": { tone: "neutral", dot: "bg-slate-300" },
  "En progreso": { tone: "blue", dot: "bg-blueprint" },
  "En revision": { tone: "yellow", dot: "bg-sun" },
  Bloqueado: { tone: "red", dot: "bg-coral" },
  Completado: { tone: "green", dot: "bg-emerald-500" }
};

const priorityMeta = {
  Alta: { tone: "red" as const, accent: "border-l-coral", glow: "shadow-coral/10" },
  Media: { tone: "yellow" as const, accent: "border-l-sun", glow: "shadow-sun/10" },
  Baja: { tone: "blue" as const, accent: "border-l-blueprint", glow: "shadow-blueprint/10" }
};

export function ExecutionBoard({
  phases,
  tasks,
  users,
  deliverables,
  canCreate,
  canEdit,
  canDelete,
  activePhase
}: {
  phases: Phase[];
  tasks: ScheduleTask[];
  users: UserProfile[];
  deliverables: Deliverable[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  activePhase: string;
}) {
  const normalizedActivePhase = activePhase === "all" || phases.some((phase) => phase.id === activePhase) ? activePhase : "all";
  const selectedPhase = phases.find((phase) => phase.id === normalizedActivePhase);
  const selectedTasks = normalizedActivePhase === "all" ? tasks : tasks.filter((task) => task.phaseId === normalizedActivePhase);
  const selectedLabel = selectedPhase?.name ?? "Todas las fases";

  return (
    <div id="tablero-ejecucion" className="scroll-mt-6">
      <Card className="overflow-hidden border-white/80 bg-white/72 p-0">
        <div className="border-b border-white/70 p-5">
        <CardHeader
          eyebrow="Gestion operativa"
          title="Tablero de ejecucion"
          action={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Badge tone="yellow">{selectedTasks.length} items</Badge>
              <TaskCreateModal phases={phases} users={users} deliverables={deliverables} canCreate={canCreate} />
            </div>
          }
        />
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Vista compacta por fase para revisar muchas actividades sin convertir el cronograma en columnas interminables.
        </p>
        <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-2">
          <PhaseTab href="/cronograma?phase=all#tablero-ejecucion" active={normalizedActivePhase === "all"} label="Todas" count={tasks.length} />
          {phases.map((phase) => (
            <PhaseTab
              key={phase.id}
              href={`/cronograma?phase=${phase.id}#tablero-ejecucion`}
              active={normalizedActivePhase === phase.id}
              label={phase.name}
              count={tasks.filter((task) => task.phaseId === phase.id).length}
            />
          ))}
        </div>
        </div>

        <div className="grid gap-3 border-b border-white/70 p-5 sm:grid-cols-5">
        {statuses.map((status) => {
          const count = selectedTasks.filter((task) => task.status === status).length;
          const meta = statusMeta[status];
          return (
            <div key={status} className="rounded-2xl border border-white/70 bg-white/55 p-3.5 shadow-inner shadow-ink/5">
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", meta.dot)} />
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-500">{status}</p>
              </div>
              <p className="mt-2 font-display text-2xl font-bold text-ink">{count}</p>
            </div>
          );
        })}
        </div>

        <div className="p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-blueprint">Vista activa</p>
            <h3 className="mt-1 font-display text-lg font-bold text-ink">{selectedLabel}</h3>
          </div>
          <p className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-white/80">
            {selectedTasks.length === 1 ? "1 actividad" : `${selectedTasks.length} actividades`}
          </p>
        </div>

        {selectedTasks.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-blueprint/20 bg-white/55 p-7 text-center">
            <p className="font-display text-xl font-bold text-ink">Sin actividades todavia</p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Crea una tarea desde el formulario superior o desde el cronograma macro para comenzar a poblar esta fase.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="hidden rounded-xl bg-ink/5 px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-500 md:grid md:grid-cols-[minmax(16rem,1.5fr)_minmax(10rem,0.8fr)_minmax(10rem,0.9fr)_minmax(9rem,0.75fr)] md:gap-4">
              <span>Actividad</span>
              <span>Estado</span>
              <span>Responsable</span>
              <span>Fechas</span>
            </div>
            {selectedTasks.map((task) => {
              const phase = phases.find((item) => item.id === task.phaseId);
              return (
                <TaskExecutionRow
                  key={task.id}
                  task={task}
                  phase={phase}
                  phases={phases}
                  users={users}
                  deliverables={deliverables}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  activePhase={normalizedActivePhase}
                />
              );
            })}
          </div>
        )}
        </div>
      </Card>
    </div>
  );
}

function PhaseTab({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "focus-ring flex min-w-max items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
        active
          ? "bg-ink text-white shadow-lg shadow-ink/15"
          : "bg-white/65 text-slate-600 ring-1 ring-white/80 hover:-translate-y-0.5 hover:bg-white hover:text-ink"
      )}
    >
      <span>{label}</span>
      <span className={cn("rounded-full px-2 py-0.5 text-xs", active ? "bg-white/20 text-white" : "bg-blueprint/10 text-blueprint")}>{count}</span>
    </Link>
  );
}

function TaskExecutionRow({
  task,
  phase,
  phases,
  users,
  deliverables,
  canEdit,
  canDelete,
  activePhase
}: {
  task: ScheduleTask;
  phase?: Phase;
  phases: Phase[];
  users: UserProfile[];
  deliverables: Deliverable[];
  canEdit: boolean;
  canDelete: boolean;
  activePhase: string;
}) {
  const priority = priorityMeta[task.priority];
  const status = statusMeta[task.status];

  return (
    <article className={cn("rounded-[1.35rem] border border-white/80 border-l-4 bg-white/72 p-4 shadow-md transition hover:-translate-y-px hover:bg-white/85 hover:shadow-lg", priority.accent, priority.glow)}>
      <div className="grid gap-4 md:grid-cols-[minmax(16rem,1.5fr)_minmax(10rem,0.8fr)_minmax(10rem,0.9fr)_minmax(9rem,0.75fr)] md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={priority.tone}>{task.priority}</Badge>
            <Badge tone="neutral">{task.type}</Badge>
            <Badge tone={status.tone} className="md:hidden">{task.status}</Badge>
          </div>
          <h4 className="mt-3 font-display text-base font-bold leading-tight text-ink">{task.title}</h4>
          {task.description ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{task.description}</p> : null}
          <p className="mt-3 inline-flex rounded-xl bg-blueprint/10 px-3 py-1.5 text-xs font-medium text-blueprint">
            {phase?.name ?? "Sin fase"}
          </p>
          {task.deliverables && task.deliverables.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {task.deliverables.map((deliverable) => (
                <Badge key={deliverable.id} tone="green" className="max-w-full">
                  <span className="truncate">{deliverable.title}</span>
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <TaskStatusForm taskId={task.id} currentStatus={task.status} canEdit={canEdit} returnPhase={activePhase} className="mt-0" />
        </div>

        <div className="rounded-xl bg-white/55 px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-white/70">
          {task.ownerName ?? "Sin responsable"}
          {task.ownerEmail ? <p className="mt-1 truncate text-xs font-semibold text-slate-500">{task.ownerEmail}</p> : null}
        </div>

        <div className="space-y-1 rounded-xl bg-white/55 px-3 py-2 text-xs font-medium text-slate-500 ring-1 ring-white/70">
          <p>Inicio: <span className="text-slate-700">{task.startDate ?? "Sin fecha"}</span></p>
          <p>Fin: <span className="text-slate-700">{task.dueDate ?? "Sin fecha"}</span></p>
        </div>

      </div>
      <div className="mt-4">
        <TaskEditForm task={task} phases={phases} users={users} deliverables={deliverables} canEdit={canEdit} canDelete={canDelete} returnPhase={activePhase} />
      </div>
    </article>
  );
}
