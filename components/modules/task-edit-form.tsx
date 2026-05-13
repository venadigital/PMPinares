import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { TaskDeliverableChecklist } from "@/components/modules/task-deliverable-checklist";
import { deleteTaskAction, updateTaskAction } from "@/app/(dashboard)/cronograma/actions";
import type { Deliverable, Phase, UserProfile } from "@/lib/types";
import type { ScheduleTask } from "@/lib/schedule";

export function TaskEditForm({
  task,
  phases,
  users,
  deliverables,
  canEdit,
  canDelete,
  returnPhase = "all"
}: {
  task: ScheduleTask;
  phases: Phase[];
  users: UserProfile[];
  deliverables: Deliverable[];
  canEdit: boolean;
  canDelete: boolean;
  returnPhase?: string;
}) {
  return (
    <details className="rounded-xl border border-white/80 bg-white/55 p-3 shadow-inner shadow-ink/5">
      <summary className="cursor-pointer rounded-lg px-1 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-blueprint transition hover:text-ink">Editar detalle</summary>
      <form action={updateTaskAction} className="mt-4 space-y-3">
        <input type="hidden" name="taskId" value={task.id} />
        <input type="hidden" name="returnPhase" value={returnPhase} />
        <fieldset disabled={!canEdit} className="space-y-3 disabled:opacity-60">
          <Field label="Titulo"><Input name="title" defaultValue={task.title} required /></Field>
          <Field label="Descripcion"><Textarea name="description" defaultValue={task.description ?? ""} /></Field>
          <label className="block space-y-2 text-sm font-semibold text-ink">
            <span>Fase</span>
            <select name="phaseId" defaultValue={task.phaseId} className="focus-ring w-full rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-sm text-ink">
              <option value="">Sin fase</option>
              {phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}
            </select>
          </label>
          <label className="block space-y-2 text-sm font-semibold text-ink">
            <span>Responsable</span>
            <select name="ownerId" defaultValue={task.ownerId} className="focus-ring w-full rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-sm text-ink">
              <option value="">Sin responsable</option>
              {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
          </label>
          <TaskDeliverableChecklist deliverables={deliverables} selectedIds={(task.deliverables ?? []).map((deliverable) => deliverable.id)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2 text-sm font-semibold text-ink">
              <span>Tipo</span>
              <select name="itemType" defaultValue={task.type} className="focus-ring w-full rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-sm text-ink">
                <option>Tarea</option>
                <option>Hito</option>
                <option>Entregable</option>
              </select>
            </label>
            <label className="block space-y-2 text-sm font-semibold text-ink">
              <span>Estado</span>
              <select name="status" defaultValue={task.status} className="focus-ring w-full rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-sm text-ink">
                <option>No iniciado</option>
                <option>En progreso</option>
                <option>En revision</option>
                <option>Bloqueado</option>
                <option>Completado</option>
              </select>
            </label>
            <label className="block space-y-2 text-sm font-semibold text-ink">
              <span>Prioridad</span>
              <select name="priority" defaultValue={task.priority} className="focus-ring w-full rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-sm text-ink">
                <option>Alta</option>
                <option>Media</option>
                <option>Baja</option>
              </select>
            </label>
            <Field label="Fecha inicio"><Input name="startDate" type="date" defaultValue={task.startDate ?? ""} /></Field>
            <Field label="Fecha fin"><Input name="dueDate" type="date" defaultValue={task.dueDate ?? ""} /></Field>
          </div>
          <Button type="submit" variant="primary" className="w-full">Guardar cambios</Button>
        </fieldset>
      </form>
      {canDelete ? (
        <form action={deleteTaskAction} className="mt-3">
          <input type="hidden" name="taskId" value={task.id} />
          <input type="hidden" name="returnPhase" value={returnPhase} />
          <button className="w-full rounded-full bg-coral/10 px-4 py-2 text-sm font-bold text-coral ring-1 ring-coral/20 transition hover:bg-coral hover:text-white">
            Eliminar tarea
          </button>
        </form>
      ) : null}
    </details>
  );
}
