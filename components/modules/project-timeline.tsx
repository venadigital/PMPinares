"use client";

import { useState } from "react";
import type { Phase, UserProfile } from "@/lib/types";
import { PhaseTaskPanel, type TimelinePhase } from "@/components/modules/phase-task-panel";

const weeks = Array.from({ length: 12 }, (_, index) => `S${index + 1}`);

const timeline: TimelinePhase[] = [
  { code: "0", label: "Alineacion Estrategica", legend: "F0 Alineacion Estrategica", start: 1, span: 1, color: "#9B7CF4", dot: "#B8A2FF" },
  { code: "1", label: "Inventario Tecnologico", legend: "F1 Inventario Tecnologico", start: 2, span: 2, color: "#4F8EF7", dot: "#9EC2FF" },
  { code: "2", label: "Mapeo de Procesos", legend: "F2 Mapeo de Procesos", start: 4, span: 3, color: "#35D39A", dot: "#9BE8CB" },
  { code: "3", label: "Escenario Actual", legend: "F3 Escenario Actual", start: 7, span: 2, color: "#F59E0B", dot: "#FBC77B" },
  { code: "4", label: "Escenario Ideal", legend: "F4 Escenario Ideal", start: 9, span: 2, color: "#FB923C", dot: "#FDBA8C" },
  { code: "5", label: "Roadmap", legend: "F5 Roadmap", start: 11, span: 1, color: "#EC62AE", dot: "#F7A4D2" },
  { code: "6", label: "Presentacion de Resultados", legend: "F6 Presentacion de Resultados", start: 12, span: 1, color: "#60A5FA", dot: "#A8CFFF" }
];

export function ProjectTimeline({ phases, users, canCreate }: { phases: Phase[]; users: UserProfile[]; canCreate: boolean }) {
  const [selectedPhase, setSelectedPhase] = useState<TimelinePhase | null>(null);

  return (
    <section className="mb-5 overflow-hidden rounded-[24px] border border-white/80 bg-white/72 p-5 shadow-lg shadow-ink/5 backdrop-blur-xl md:p-6">
      <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-blueprint">12 semanas</p>
          <h2 className="mt-2 font-display text-xl font-bold text-ink">Cronograma completo del proyecto</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-500">Haz clic sobre una fase o su barra para crear una tarea contextual en esa fase. Las tareas operativas se gestionan abajo en el tablero Kanban.</p>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[210px_repeat(12,1fr)] items-center border-b border-slate-200/80 pb-3 text-center text-xs font-semibold text-slate-500">
            <div />
            {weeks.map((week) => <div key={week}>{week}</div>)}
          </div>
          <div className="mt-4 space-y-4">
            {timeline.map((phase) => {
              const isSelected = selectedPhase?.code === phase.code;
              return (
                <div key={phase.code} className="grid grid-cols-[210px_repeat(12,1fr)] items-center gap-0">
                  <button type="button" onClick={() => setSelectedPhase(phase)} className={`flex items-center gap-3 rounded-xl pr-4 text-left text-sm font-medium transition hover:bg-white/70 hover:pl-2 ${isSelected ? "bg-white/80 pl-2 text-ink shadow-sm" : "text-slate-500"}`}>
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.7rem] font-bold text-white" style={{ backgroundColor: phase.dot }}>{phase.code}</span>
                    <span className="leading-tight">{phase.label}</span>
                  </button>
                  <div className="relative col-span-12 grid h-10 grid-cols-12 items-center">
                    <button
                      type="button"
                      onClick={() => setSelectedPhase(phase)}
                      className={`absolute h-7 rounded-full text-center text-xs font-semibold leading-7 text-white shadow-md transition hover:-translate-y-px hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blueprint/50 ${isSelected ? "ring-4 ring-blueprint/20" : ""}`}
                      style={{
                        left: `calc(${((phase.start - 1) / 12) * 100}% + 4px)`,
                        width: `calc(${(phase.span / 12) * 100}% - 8px)`,
                        background: `linear-gradient(135deg, ${phase.color}, ${phase.color}dd)`
                      }}
                      aria-label={`Crear tarea en ${phase.label}`}
                    >
                      {phase.span === 1 ? `S${phase.start}` : `S${phase.start} - S${phase.start + phase.span - 1}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
        {timeline.map((phase) => (
          <button key={phase.legend} type="button" onClick={() => setSelectedPhase(phase)} className="flex items-center gap-2 rounded-full px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-white/70 hover:text-ink">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: phase.color }} />
            {phase.legend}
          </button>
        ))}
      </div>
      {selectedPhase ? <PhaseTaskPanel phase={selectedPhase} phases={phases} users={users} canCreate={canCreate} onClose={() => setSelectedPhase(null)} /> : null}
    </section>
  );
}
