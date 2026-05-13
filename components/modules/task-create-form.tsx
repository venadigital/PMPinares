import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { TaskDeliverableChecklist } from "@/components/modules/task-deliverable-checklist";
import { createTaskAction } from "@/app/(dashboard)/cronograma/actions";
import { cn } from "@/lib/utils";
import type { Deliverable, Phase, UserProfile } from "@/lib/types";

export function TaskCreateForm({
  phases,
  users,
  deliverables,
  canCreate,
  compact = false
}: {
  phases: Phase[];
  users: UserProfile[];
  deliverables: Deliverable[];
  canCreate: boolean;
  compact?: boolean;
}) {
  return (
    <div className={cn("overflow-hidden", compact ? "bg-transparent" : "rounded-[2rem] border border-white/80 bg-gradient-to-br from-white/90 via-white/68 to-blueprint/10")}>
      {!canCreate ? <p className="mb-5 rounded-2xl bg-coral/10 p-4 text-sm font-bold text-coral">Tu usuario puede ver el cronograma, pero no crear tareas.</p> : null}
      <form action={createTaskAction} className="opacity-100">
        <fieldset disabled={!canCreate} className="disabled:opacity-60">
          <div className={cn("grid items-start", compact ? "gap-3 p-4 sm:p-5 lg:grid-cols-[1.08fr_0.92fr]" : "gap-4 p-5 sm:p-6 xl:grid-cols-[1.15fr_0.85fr]")}>
            <div className={cn(compact ? "rounded-[1.25rem] border border-white/80 bg-white/85 p-4 shadow-sm shadow-ink/5" : "rounded-[1.5rem] border border-white/80 bg-white/58 p-4 shadow-inner shadow-ink/5")}>
              <SectionTitle eyebrow="Datos base" title="Que se va a ejecutar" />
              <div className={cn("grid", compact ? "mt-4 gap-4 sm:grid-cols-[1.35fr_0.65fr]" : "mt-4 gap-4 lg:grid-cols-[1.25fr_0.75fr]")}>
                <Field label="Titulo">
                  <Input name="title" placeholder="Ej. Validar costos y licencias" required />
                </Field>
                <SelectField label="Tipo" name="itemType" defaultValue="Tarea">
                  <option>Tarea</option>
                  <option>Hito</option>
                  <option>Entregable</option>
                </SelectField>
              </div>
              <Field label="Descripcion">
                <Textarea name="description" placeholder="Contexto, alcance o notas de la tarea" className={cn(compact ? "min-h-24" : "min-h-24")} />
              </Field>
            </div>

            <div className={cn(compact ? "rounded-[1.25rem] border border-white/80 bg-white/85 p-4 shadow-sm shadow-ink/5" : "rounded-[1.5rem] border border-white/80 bg-white/58 p-4 shadow-inner shadow-ink/5")}>
              <SectionTitle eyebrow="Asignacion" title="Fase y responsable" />
              <div className={cn("grid", compact ? "mt-4 gap-4 sm:grid-cols-2" : "mt-4 gap-4")}>
                <SelectField label="Fase" name="phaseId">
                  <option value="">Sin fase</option>
                  {phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}
                </SelectField>
                <SelectField label="Responsable" name="ownerId">
                  <option value="">Sin responsable</option>
                  {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                </SelectField>
                <TaskDeliverableChecklist deliverables={deliverables} className={compact ? "sm:col-span-2" : ""} />
              </div>
            </div>

            <div className={cn(compact ? "rounded-[1.25rem] border border-white/80 bg-white/85 p-4 shadow-sm shadow-ink/5 lg:col-span-2" : "rounded-[1.5rem] border border-white/80 bg-white/58 p-4 shadow-inner shadow-ink/5 xl:col-span-2")}>
              <SectionTitle eyebrow="Control" title="Estado, prioridad y fechas" />
              <div className={cn("grid", compact ? "mt-4 gap-4 sm:grid-cols-2 lg:grid-cols-4" : "mt-4 gap-4 md:grid-cols-2 xl:grid-cols-5")}>
                <SelectField label="Estado" name="status" defaultValue="No iniciado">
                  <option>No iniciado</option>
                  <option>En progreso</option>
                  <option>En revision</option>
                  <option>Bloqueado</option>
                  <option>Completado</option>
                </SelectField>
                <SelectField label="Prioridad" name="priority" defaultValue="Media">
                  <option>Media</option>
                  <option>Alta</option>
                  <option>Baja</option>
                </SelectField>
                <Field label="Fecha inicio"><Input name="startDate" type="date" /></Field>
                <Field label="Fecha fin"><Input name="dueDate" type="date" /></Field>
                <div className={cn("items-end", compact ? "hidden" : "hidden xl:flex")}>
                  <p className="rounded-2xl bg-blueprint/10 px-4 py-3 text-xs font-semibold leading-5 text-blueprint">
                    Las fechas son opcionales y se pueden ajustar despues.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className={cn("flex flex-col gap-3 border-t sm:flex-row sm:items-center sm:justify-between", compact ? "sticky bottom-0 border-ink/10 bg-white/95 px-5 py-3.5 shadow-[0_-10px_22px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:px-6" : "border-white/75 bg-white/45 px-5 py-4 sm:px-6")}>
            <p className={cn("font-semibold text-slate-600", compact ? "text-xs leading-5" : "text-sm")}>
              Los cambios se guardaran en Supabase y apareceran en el tablero de ejecucion.
            </p>
            <Button type="submit" variant="accent" className={cn("px-7", compact ? "py-2.5" : "py-3")}>Crear tarea</Button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}


function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-blueprint">{eyebrow}</p>
              <h3 className="mt-1 font-display text-base font-bold text-ink">{title}</h3>
    </div>
  );
}

function SelectField({ label, name, defaultValue, children }: { label: string; name: string; defaultValue?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-sm font-semibold text-ink">
      <span>{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="focus-ring w-full rounded-xl border border-white/70 bg-white/75 px-3.5 py-2.5 text-sm text-ink shadow-inner shadow-ink/5"
      >
        {children}
      </select>
    </label>
  );
}
