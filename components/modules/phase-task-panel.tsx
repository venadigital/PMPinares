"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { createTaskAction } from "@/app/(dashboard)/cronograma/actions";
import type { Phase, UserProfile } from "@/lib/types";

export interface TimelinePhase {
  code: string;
  label: string;
  legend: string;
  start: number;
  span: number;
  color: string;
  dot: string;
}

export function PhaseTaskPanel({ phase, phases, users, canCreate, onClose }: { phase: TimelinePhase; phases: Phase[]; users: UserProfile[]; canCreate: boolean; onClose: () => void }) {
  const matchingPhase = findMatchingPhase(phase, phases);

  return (
    <div className="mt-5 rounded-[22px] border border-white/80 bg-white/75 p-5 shadow-md shadow-ink/5">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-blueprint">Crear tarea en fase</p>
          <h3 className="mt-1 font-display text-xl font-bold text-ink">{phase.legend}</h3>
          <p className="mt-1 text-sm text-slate-500">Semana {phase.span === 1 ? phase.start : `${phase.start} a ${phase.start + phase.span - 1}`}</p>
        </div>
        <button onClick={onClose} className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-ink/10 transition hover:bg-white hover:text-ink">Cerrar</button>
      </div>
      {!canCreate ? <p className="mb-5 rounded-xl bg-coral/10 p-3.5 text-sm font-medium text-coral">Tu usuario no tiene permiso para crear tareas.</p> : null}
      <form action={createTaskAction} className="space-y-4">
        <fieldset disabled={!canCreate} className="space-y-4 disabled:opacity-60">
          <input type="hidden" name="phaseId" value={matchingPhase?.id ?? ""} />
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <Field label="Titulo"><Input name="title" placeholder={`Nueva tarea para ${phase.label}`} required /></Field>
            <label className="block space-y-2 text-sm font-medium text-ink">
              <span>Responsable</span>
              <select name="ownerId" className="focus-ring w-full rounded-xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-sm text-ink shadow-inner shadow-ink/5">
                <option value="">Sin responsable</option>
                {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </select>
            </label>
            <label className="block space-y-2 text-sm font-medium text-ink">
              <span>Tipo</span>
              <select name="itemType" className="focus-ring w-full rounded-xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-sm text-ink shadow-inner shadow-ink/5">
                <option>Tarea</option>
                <option>Hito</option>
                <option>Entregable</option>
              </select>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <label className="block space-y-2 text-sm font-medium text-ink">
              <span>Estado</span>
              <select name="status" className="focus-ring w-full rounded-xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-sm text-ink shadow-inner shadow-ink/5">
                <option>No iniciado</option>
                <option>En progreso</option>
                <option>En revision</option>
                <option>Bloqueado</option>
                <option>Completado</option>
              </select>
            </label>
            <label className="block space-y-2 text-sm font-medium text-ink">
              <span>Prioridad</span>
              <select name="priority" className="focus-ring w-full rounded-xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-sm text-ink shadow-inner shadow-ink/5">
                <option>Media</option>
                <option>Alta</option>
                <option>Baja</option>
              </select>
            </label>
            <Field label="Fecha inicio"><Input name="startDate" type="date" /></Field>
            <Field label="Fecha fin"><Input name="dueDate" type="date" /></Field>
          </div>
          <Field label="Descripcion"><Textarea name="description" placeholder="Notas, contexto o alcance de la tarea" /></Field>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="accent">Crear tarea en {phase.label}</Button>
            <span className="text-xs font-semibold text-slate-500">La fase quedara preseleccionada automaticamente.</span>
          </div>
        </fieldset>
      </form>
    </div>
  );
}

function findMatchingPhase(phase: TimelinePhase, phases: Phase[]) {
  return phases.find((item) => item.name.toLowerCase().includes(`fase ${phase.code}`)) ?? phases.find((item) => item.name.toLowerCase().includes(phase.label.toLowerCase().slice(0, 12)));
}
