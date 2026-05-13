"use client";

import { ClipboardCheck, GitPullRequestArrow } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type DecisionsTab = "create" | "matrix";

export function DecisionsTabs({
  createPanel,
  matrixPanel,
  decisionCount,
  pendingCount
}: {
  createPanel: React.ReactNode;
  matrixPanel: React.ReactNode;
  decisionCount: number;
  pendingCount: number;
}) {
  const [activeTab, setActiveTab] = useState<DecisionsTab>("matrix");

  return (
    <section className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <TabButton
          active={activeTab === "create"}
          eyebrow="Nueva decision"
          title="Registrar decision"
          description="Documenta contexto, alternativas, participantes, responsable y documentos relacionados."
          icon={<GitPullRequestArrow className="h-5 w-5" />}
          onClick={() => setActiveTab("create")}
        />
        <TabButton
          active={activeTab === "matrix"}
          eyebrow="Bitacora"
          title="Decisiones registradas"
          description="Consulta el registro ejecutivo y da seguimiento a las decisiones del proyecto."
          meta={`${decisionCount} decisiones`}
          secondaryMeta={pendingCount > 0 ? `${pendingCount} pendientes` : undefined}
          icon={<ClipboardCheck className="h-5 w-5" />}
          onClick={() => setActiveTab("matrix")}
        />
      </div>

      <div className="min-h-[24rem]">{activeTab === "create" ? createPanel : matrixPanel}</div>
    </section>
  );
}

function TabButton({
  active,
  eyebrow,
  title,
  description,
  meta,
  secondaryMeta,
  icon,
  onClick
}: {
  active: boolean;
  eyebrow: string;
  title: string;
  description: string;
  meta?: string;
  secondaryMeta?: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring group flex min-h-32 items-start gap-4 rounded-[1.4rem] border p-4 text-left transition",
        active
          ? "border-blueprint/25 bg-white/88 shadow-lg shadow-blueprint/10 ring-1 ring-blueprint/15"
          : "border-white/75 bg-white/58 shadow-sm shadow-ink/5 hover:-translate-y-px hover:bg-white/78"
      )}
      aria-pressed={active}
    >
      <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition", active ? "bg-blueprint text-white shadow-md shadow-blueprint/25" : "bg-blueprint/10 text-blueprint group-hover:bg-blueprint/15")}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-blueprint">{eyebrow}</span>
        <span className="mt-1 flex flex-wrap items-center gap-2">
          <span className="font-display text-xl font-semibold tracking-tight text-ink">{title}</span>
          {meta ? <span className="rounded-full bg-sun/20 px-2.5 py-0.5 text-xs font-semibold text-ink ring-1 ring-sun/35">{meta}</span> : null}
          {secondaryMeta ? <span className="rounded-full bg-coral/10 px-2.5 py-0.5 text-xs font-semibold text-coral ring-1 ring-coral/20">{secondaryMeta}</span> : null}
        </span>
        <span className="mt-2 block text-sm leading-6 text-slate-600">{description}</span>
        <span className={cn("mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold transition", active ? "bg-blueprint/10 text-blueprint" : "bg-white/70 text-slate-500 ring-1 ring-ink/10")}>
          {active ? "Panel desplegado" : "Desplegar"}
        </span>
      </span>
    </button>
  );
}
