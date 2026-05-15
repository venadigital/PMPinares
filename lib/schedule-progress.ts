import type { Phase, Status } from "@/lib/types";

const phaseWeights: Record<string, number> = {
  "fase-0": 1,
  "fase-1": 2,
  "fase-2": 3,
  "fase-3": 2,
  "fase-4": 2,
  "fase-5": 1,
  "fase-6": 1
};

export interface ProgressTask {
  phaseId: string;
  status: Status;
  progress?: number;
}

export interface PhaseProgress extends Phase {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

export function calculateScheduleProgress(phases: Phase[], tasks: ProgressTask[]) {
  const phasesWithProgress: PhaseProgress[] = phases.map((phase) => {
    const phaseTasks = tasks.filter((task) => task.phaseId === phase.id);
    const completedTasks = phaseTasks.filter((task) => getTaskProgress(task) === 100).length;
    const progress = phaseTasks.length > 0 ? Math.round(phaseTasks.reduce((sum, task) => sum + getTaskProgress(task), 0) / phaseTasks.length) : 0;

    return {
      ...phase,
      progress,
      totalTasks: phaseTasks.length,
      completedTasks,
      pendingTasks: Math.max(phaseTasks.length - completedTasks, 0)
    };
  });

  const totalWeight = phasesWithProgress.reduce((sum, phase) => sum + getPhaseWeight(phase), 0);
  const weightedProgress = phasesWithProgress.reduce((sum, phase) => sum + phase.progress * getPhaseWeight(phase), 0);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => getTaskProgress(task) === 100).length;

  return {
    overallProgress: totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0,
    phases: phasesWithProgress,
    totalTasks,
    completedTasks,
    pendingTasks: Math.max(totalTasks - completedTasks, 0)
  };
}

function getTaskProgress(task: ProgressTask) {
  if (typeof task.progress === "number") return Math.max(0, Math.min(100, Math.round(task.progress)));
  return task.status === "Completado" ? 100 : 0;
}

function getPhaseWeight(phase: Phase) {
  if (phase.code && phaseWeights[phase.code]) return phaseWeights[phase.code];
  const match = phase.name.match(/Fase\s+(\d)/i);
  const fallbackCode = match ? `fase-${match[1]}` : "";
  return phaseWeights[fallbackCode] ?? 1;
}
