"use client";

import { updateTaskStatusAction } from "@/app/(dashboard)/cronograma/actions";
import { cn } from "@/lib/utils";
import type { Status } from "@/lib/types";

const statuses: Status[] = ["No iniciado", "En progreso", "En revision", "Bloqueado", "Completado"];

export function TaskStatusForm({
  taskId,
  currentStatus,
  canEdit,
  returnPhase = "all",
  helper,
  className
}: {
  taskId: string;
  currentStatus: Status;
  canEdit: boolean;
  returnPhase?: string;
  helper?: string;
  className?: string;
}) {
  return (
    <form action={updateTaskStatusAction} className={cn("mt-4", className)}>
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="returnPhase" value={returnPhase} />
      <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
        Estado
        <select name="status" defaultValue={currentStatus} disabled={!canEdit} className="focus-ring mt-2 w-full rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-sm font-medium normal-case tracking-normal text-ink shadow-inner shadow-ink/5 disabled:opacity-60" onChange={(event) => event.currentTarget.form?.requestSubmit()}>
          {statuses.map((status) => <option key={status}>{status}</option>)}
        </select>
        {helper ? <span className="mt-2 block text-xs normal-case tracking-normal text-slate-500">{helper}</span> : null}
      </label>
    </form>
  );
}
