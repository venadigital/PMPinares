import type { Deliverable } from "@/lib/types";

export function TaskDeliverableChecklist({ deliverables, selectedIds = [], className = "" }: { deliverables: Deliverable[]; selectedIds?: string[]; className?: string }) {
  const selectedId = selectedIds[0] ?? "";

  if (deliverables.length === 0) {
    return (
      <div className={`rounded-xl bg-white/60 p-3.5 text-sm font-medium text-slate-500 ring-1 ring-white/80 ${className}`}>
        Aun no hay entregables disponibles para vincular.
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">Entregable vinculado</p>
        <span className="rounded-full bg-blueprint/10 px-2.5 py-0.5 text-[0.65rem] font-medium text-blueprint">{deliverables.length} disponibles</span>
      </div>
      <select
        name="deliverableIds"
        defaultValue={selectedId}
        className="focus-ring w-full rounded-xl border border-white/80 bg-white/80 px-3.5 py-2.5 text-sm font-medium text-ink shadow-inner shadow-ink/5"
      >
        <option value="">Sin entregable vinculado</option>
        {deliverables.map((deliverable) => (
          <option key={deliverable.id} value={deliverable.id}>
            {deliverable.title} · {deliverable.status}
          </option>
        ))}
      </select>
      <p className="text-xs font-medium leading-5 text-slate-500">
        Selecciona un entregable existente si esta actividad debe quedar vinculada formalmente.
      </p>
    </div>
  );
}
