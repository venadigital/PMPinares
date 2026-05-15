import { PageHeader } from "@/components/modules/page-header";
import { ProjectTimeline } from "@/components/modules/project-timeline";
import { ExecutionBoard } from "@/components/modules/execution-board";
import { getCurrentProfile, hasPermission } from "@/lib/auth";
import { getScheduleData } from "@/lib/schedule";

interface SchedulePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  const params = searchParams ? await searchParams : {};
  const [{ phases, tasks, users, deliverables }, profile] = await Promise.all([getScheduleData(), getCurrentProfile()]);
  const canCreate = hasPermission(profile, "cronograma", "create");
  const canEdit = hasPermission(profile, "cronograma", "edit");
  const canDelete = hasPermission(profile, "cronograma", "delete");
  const error = typeof params.error === "string" ? params.error : null;
  const created = params.created === "1";
  const updated = params.updated === "1";
  const edited = params.edited === "1";
  const deleted = params.deleted === "1";
  const subtask = params.subtask === "1";
  const activePhase = typeof params.phase === "string" ? params.phase : "all";

  return (
    <>
      <PageHeader eyebrow="Cronograma" title="Tablero de ejecucion" description="Control de fases, tareas, hitos y entregables con una vista compacta por fase." />
      {created ? <p className="mb-5 rounded-2xl bg-emerald-500/10 p-4 text-sm font-bold text-emerald-700">Tarea creada correctamente.</p> : null}
      {updated ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Estado actualizado.</p> : null}
      {edited ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Tarea editada correctamente.</p> : null}
      {deleted ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Tarea eliminada correctamente.</p> : null}
      {subtask ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Subtareas actualizadas correctamente.</p> : null}
      {error ? <p className="mb-5 rounded-2xl bg-coral/10 p-4 text-sm font-bold text-coral">{error}</p> : null}
      <ProjectTimeline phases={phases} users={users} canCreate={canCreate} />
      <ExecutionBoard phases={phases} tasks={tasks} users={users} deliverables={deliverables} canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} activePhase={activePhase} />
    </>
  );
}
