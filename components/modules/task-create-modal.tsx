"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { TaskCreateForm } from "@/components/modules/task-create-form";
import type { Deliverable, Phase, UserProfile } from "@/lib/types";

export function TaskCreateModal({ phases, users, deliverables, canCreate }: { phases: Phase[]; users: UserProfile[]; deliverables: Deliverable[]; canCreate: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const modal = open ? (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-ink/48 px-4 py-[5vh] backdrop-blur-md sm:px-6" role="dialog" aria-modal="true" aria-labelledby="create-task-title">
      <button type="button" className="fixed inset-0 cursor-default" aria-label="Cerrar modal" onClick={() => setOpen(false)} />
      <div className="relative z-10 flex w-full max-w-[940px] flex-col overflow-hidden rounded-[1.5rem] border border-white/85 bg-[#f7faff] shadow-[0_22px_60px_rgba(15,23,42,0.28)] ring-1 ring-ink/5">
        <div className="shrink-0 border-b border-ink/10 bg-white/95 px-5 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-blueprint">Nueva actividad</p>
              <h2 id="create-task-title" className="mt-1 font-display text-2xl font-bold text-ink">
                Crear actividad
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Agrega una actividad al cronograma y vincula entregables si aplica.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-base font-bold text-white shadow-md shadow-ink/15 transition hover:-translate-y-px"
              aria-label="Cerrar modal"
            >
              ×
            </button>
          </div>
        </div>
        <TaskCreateForm phases={phases} users={users} deliverables={deliverables} canCreate={canCreate} compact />
      </div>
    </div>
  ) : null;

  return (
    <>
      <Button type="button" variant="accent" className="px-5 py-2.5" onClick={() => setOpen(true)}>
        Crear tarea
      </Button>
      {typeof document === "undefined" ? null : createPortal(modal, document.body)}
    </>
  );
}
