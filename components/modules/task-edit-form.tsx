import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { TaskDeliverableChecklist } from "@/components/modules/task-deliverable-checklist";
import { createSubtaskAction, deleteSubtaskAction, deleteTaskAction, toggleSubtaskAction, updateTaskAction } from "@/app/(dashboard)/cronograma/actions";
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
              {task.totalSubtasks > 0 ? <input type="hidden" name="status" value={task.effectiveStatus} /> : null}
              <select name={task.totalSubtasks > 0 ? "displayStatus" : "status"} defaultValue={task.effectiveStatus} disabled={task.totalSubtasks > 0} className="focus-ring w-full rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-sm text-ink disabled:opacity-60">
                <option>No iniciado</option>
                <option>En progreso</option>
                <option>En revision</option>
                <option>Bloqueado</option>
                <option>Completado</option>
              </select>
              {task.totalSubtasks > 0 ? <span className="text-xs font-medium text-slate-500">El estado se calcula automaticamente con las subtareas.</span> : null}
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
      <SubtasksPanel task={task} canEdit={canEdit} canDelete={canDelete} returnPhase={returnPhase} />
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

function SubtasksPanel({ task, canEdit, canDelete, returnPhase }: { task: ScheduleTask; canEdit: boolean; canDelete: boolean; returnPhase: string }) {
  return (
    <div className="mt-4 rounded-[1rem] border border-blueprint/10 bg-blueprint/5 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-blueprint">Subtareas</p>
          <h4 className="mt-1 font-display text-base font-bold text-ink">Checklist de avance</h4>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {task.totalSubtasks > 0 ? `${task.completedSubtasks}/${task.totalSubtasks} completadas · ${task.subtaskProgress}%` : "Agrega subtareas para calcular automaticamente el avance."}
          </p>
        </div>
        {task.totalSubtasks > 0 ? (
          <div className="min-w-[8rem] flex-1 sm:max-w-[12rem]">
            <div className="h-2 overflow-hidden rounded-full bg-white/90">
              <div className="h-full rounded-full bg-gradient-to-r from-blueprint to-sun" style={{ width: `${task.subtaskProgress}%` }} />
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-3 space-y-2">
        {task.subtasks.length === 0 ? <p className="rounded-xl bg-white/60 p-3 text-sm text-slate-500">Esta tarea aun no tiene subtareas.</p> : null}
        {task.subtasks.map((subtask) => (
          <div key={subtask.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/70 p-2.5 ring-1 ring-white/80">
            <form action={toggleSubtaskAction} className="flex min-w-0 flex-1 items-center gap-2">
              <input type="hidden" name="taskId" value={task.id} />
              <input type="hidden" name="subtaskId" value={subtask.id} />
              <input type="hidden" name="isCompleted" value={String(!subtask.isCompleted)} />
              <input type="hidden" name="returnPhase" value={returnPhase} />
              <button
                type="submit"
                disabled={!canEdit}
                className="focus-ring grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-blueprint/30 bg-white text-xs font-bold text-blueprint transition hover:bg-blueprint hover:text-white disabled:opacity-50"
                aria-label={subtask.isCompleted ? "Marcar subtarea como pendiente" : "Marcar subtarea como completada"}
              >
                {subtask.isCompleted ? "✓" : ""}
              </button>
              <span className={subtask.isCompleted ? "truncate text-sm font-medium text-slate-500 line-through" : "truncate text-sm font-semibold text-ink"}>{subtask.title}</span>
            </form>
            {canDelete ? (
              <form action={deleteSubtaskAction}>
                <input type="hidden" name="taskId" value={task.id} />
                <input type="hidden" name="subtaskId" value={subtask.id} />
                <input type="hidden" name="returnPhase" value={returnPhase} />
                <button className="rounded-full bg-coral/10 px-3 py-1.5 text-xs font-bold text-coral transition hover:bg-coral hover:text-white">Eliminar</button>
              </form>
            ) : null}
          </div>
        ))}
      </div>

      <form action={createSubtaskAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="taskId" value={task.id} />
        <input type="hidden" name="returnPhase" value={returnPhase} />
        <Input name="subtaskTitle" placeholder="Nueva subtarea" disabled={!canEdit} />
        <Button type="submit" variant="ghost" disabled={!canEdit} className="shrink-0">Agregar subtarea</Button>
      </form>
    </div>
  );
}
