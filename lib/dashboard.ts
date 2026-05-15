import { decisions as demoDecisions, documents as demoDocuments, findings as demoFindings, phases as demoPhases, risks as demoRisks, tasks as demoTasks } from "@/lib/data";
import { calculateScheduleProgress, type PhaseProgress } from "@/lib/schedule-progress";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Priority, RiskLevel, Status } from "@/lib/types";

export interface DashboardTask {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
  phaseId: string;
  phaseName: string;
  dueDate?: string;
  isOverdue: boolean;
}

export interface DashboardItem {
  id: string;
  title: string;
  meta?: string;
}

export interface DashboardData {
  metrics: {
    overallProgress: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    blockedTasks: number;
    overdueTasks: number;
    pendingDeliverables: number;
    approvedDeliverables: number;
    criticalFindings: number;
    highRisks: number;
    pendingDecisions: number;
    recentDocuments: number;
  };
  health: {
    label: string;
    tone: "green" | "yellow" | "red";
    description: string;
  };
  phases: PhaseProgress[];
  upcomingTasks: DashboardTask[];
  recentDocuments: DashboardItem[];
  highRisks: DashboardItem[];
  criticalFindings: DashboardItem[];
  pendingDecisions: DashboardItem[];
}

export async function getDashboardData(): Promise<DashboardData> {
  if (!isSupabaseConfigured()) {
    const scheduleProgress = calculateScheduleProgress(demoPhases, demoTasks);
    const upcomingTasks = demoTasks
      .filter((task) => task.status !== "Completado")
      .slice(0, 5)
      .map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        phaseId: task.phaseId,
        phaseName: demoPhases.find((phase) => phase.id === task.phaseId)?.name ?? "Sin fase",
        dueDate: task.dueDate,
        isOverdue: false
      }));
    const metrics = {
      overallProgress: scheduleProgress.overallProgress,
      totalTasks: scheduleProgress.totalTasks,
      completedTasks: scheduleProgress.completedTasks,
      pendingTasks: scheduleProgress.pendingTasks,
      blockedTasks: demoTasks.filter((task) => task.status === "Bloqueado").length,
      overdueTasks: 0,
      pendingDeliverables: demoTasks.filter((task) => task.type === "Entregable" && task.status !== "Completado").length,
      approvedDeliverables: demoTasks.filter((task) => task.type === "Entregable" && task.status === "Completado").length,
      criticalFindings: demoFindings.filter((finding) => finding.criticality === "Alta").length,
      highRisks: demoRisks.filter((risk) => risk.level === "Alto").length,
      pendingDecisions: demoDecisions.filter((decision) => decision.status === "Pendiente" || decision.status === "En seguimiento").length,
      recentDocuments: demoDocuments.length
    };

    return {
      metrics,
      health: getProjectHealth(metrics),
      phases: scheduleProgress.phases,
      upcomingTasks,
      recentDocuments: demoDocuments.map((doc) => ({ id: doc.id, title: doc.name, meta: doc.folder })),
      highRisks: demoRisks.filter((risk) => risk.level === "Alto").map((risk) => ({ id: risk.id, title: risk.title, meta: risk.status })),
      criticalFindings: demoFindings.filter((finding) => finding.criticality === "Alta").map((finding) => ({ id: finding.id, title: finding.title, meta: finding.area })),
      pendingDecisions: demoDecisions.filter((decision) => decision.status === "Pendiente" || decision.status === "En seguimiento").map((decision) => ({ id: decision.id, title: decision.title, meta: decision.status }))
    };
  }

  const supabase = await createClient();
  const [phasesResult, tasksResult, subtasksResult, deliverablesResult, findingsResult, risksResult, decisionsResult, filesResult] = await Promise.all([
    supabase.from("phases").select("id, code, name, week_range, progress").order("code"),
    supabase.from("tasks").select("id, title, phase_id, status, priority, due_date").order("created_at", { ascending: false }),
    supabase.from("task_subtasks").select("task_id, is_completed"),
    supabase.from("deliverables").select("id, status"),
    supabase.from("findings").select("id, title, criticality, status, areas:area_id(name)").order("created_at", { ascending: false }),
    supabase.from("risks").select("id, title, level, status").order("created_at", { ascending: false }),
    supabase.from("decisions").select("id, title, status").order("created_at", { ascending: false }),
    supabase.from("files").select("id, name, folders:folder_id(name)").order("created_at", { ascending: false }).limit(5)
  ]);

  const phases = (phasesResult.data ?? []).map((phase) => ({
    id: phase.id,
    code: phase.code,
    name: phase.name,
    weekRange: phase.week_range ?? "",
    progress: phase.progress ?? 0
  }));
  const phasesById = new Map(phases.map((phase) => [phase.id, phase.name]));
  const tasks = (tasksResult.data ?? []) as { id: string; title: string; phase_id: string | null; status: Status; priority: Priority; due_date: string | null }[];
  const subtasksByTask = groupDashboardSubtasks((subtasksResult.error ? [] : subtasksResult.data ?? []) as { task_id: string; is_completed: boolean }[]);
  const tasksWithEffectiveProgress = tasks.map((task) => {
    const subtasks = subtasksByTask.get(task.id) ?? [];
    const progress = getDashboardTaskProgress(task.status, subtasks);
    return {
      ...task,
      effectiveProgress: progress,
      effectiveStatus: getDashboardEffectiveStatus(task.status, subtasks, progress)
    };
  });
  const deliverables = deliverablesResult.data ?? [];
  const findings = (findingsResult.data ?? []) as { id: string; title: string; criticality: string; status: string; areas?: { name: string } | { name: string }[] | null }[];
  const risks = (risksResult.data ?? []) as { id: string; title: string; level: RiskLevel; status: string }[];
  const decisions = (decisionsResult.data ?? []) as { id: string; title: string; status: string }[];
  const files = (filesResult.data ?? []) as { id: string; name: string; folders?: { name: string } | { name: string }[] | null }[];

  const scheduleProgress = calculateScheduleProgress(
    phases,
    tasksWithEffectiveProgress.map((task) => ({ phaseId: task.phase_id ?? "", status: task.effectiveStatus, progress: task.effectiveProgress }))
  );
  const today = new Date().toISOString().slice(0, 10);
  const openTasks = tasksWithEffectiveProgress.filter((task) => task.effectiveStatus !== "Completado");
  const upcomingTasks = [...openTasks]
    .sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    })
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      title: task.title,
      status: task.effectiveStatus,
      priority: task.priority,
      phaseId: task.phase_id ?? "",
      phaseName: phasesById.get(task.phase_id ?? "") ?? "Sin fase",
      dueDate: task.due_date ?? undefined,
      isOverdue: Boolean(task.due_date && task.due_date < today)
    }));

  const metrics = {
    overallProgress: scheduleProgress.overallProgress,
    totalTasks: scheduleProgress.totalTasks,
    completedTasks: scheduleProgress.completedTasks,
    pendingTasks: scheduleProgress.pendingTasks,
    blockedTasks: openTasks.filter((task) => task.effectiveStatus === "Bloqueado").length,
    overdueTasks: openTasks.filter((task) => Boolean(task.due_date && task.due_date < today)).length,
    pendingDeliverables: deliverables.filter((item) => item.status !== "Aprobado").length,
    approvedDeliverables: deliverables.filter((item) => item.status === "Aprobado").length,
    criticalFindings: findings.filter((item) => item.criticality === "Alta").length,
    highRisks: risks.filter((item) => item.level === "Alto").length,
    pendingDecisions: decisions.filter((item) => item.status === "Pendiente" || item.status === "En seguimiento").length,
    recentDocuments: files.length
  };

  return {
    metrics,
    health: getProjectHealth(metrics),
    phases: scheduleProgress.phases,
    upcomingTasks,
    recentDocuments: files.map((file) => ({ id: file.id, title: file.name, meta: firstRelation(file.folders)?.name ?? "Sin carpeta" })),
    highRisks: risks.filter((risk) => risk.level === "Alto").map((risk) => ({ id: risk.id, title: risk.title, meta: risk.status })),
    criticalFindings: findings.filter((finding) => finding.criticality === "Alta").map((finding) => ({ id: finding.id, title: finding.title, meta: firstRelation(finding.areas)?.name ?? finding.status })),
    pendingDecisions: decisions.filter((decision) => decision.status === "Pendiente" || decision.status === "En seguimiento").map((decision) => ({ id: decision.id, title: decision.title, meta: decision.status }))
  };
}

function groupDashboardSubtasks(rows: { task_id: string; is_completed: boolean }[]) {
  const grouped = new Map<string, { is_completed: boolean }[]>();

  for (const row of rows) {
    const list = grouped.get(row.task_id) ?? [];
    list.push({ is_completed: row.is_completed });
    grouped.set(row.task_id, list);
  }

  return grouped;
}

function getDashboardTaskProgress(status: Status, subtasks: { is_completed: boolean }[]) {
  if (subtasks.length === 0) return status === "Completado" ? 100 : 0;
  return Math.round((subtasks.filter((subtask) => subtask.is_completed).length / subtasks.length) * 100);
}

function getDashboardEffectiveStatus(status: Status, subtasks: { is_completed: boolean }[], progress: number): Status {
  if (subtasks.length === 0) return status;
  if (progress === 0) return "No iniciado";
  if (progress === 100) return "Completado";
  return "En progreso";
}

function getProjectHealth(metrics: DashboardData["metrics"]): DashboardData["health"] {
  if (metrics.highRisks > 0 || metrics.criticalFindings > 0 || metrics.blockedTasks > 0) {
    return {
      label: "Requiere atencion",
      tone: "red",
      description: "Hay riesgos altos, hallazgos criticos o tareas bloqueadas que conviene revisar en el seguimiento ejecutivo."
    };
  }

  if (metrics.overdueTasks > 0 || metrics.pendingDecisions > 0 || metrics.pendingDeliverables > 0) {
    return {
      label: "En seguimiento",
      tone: "yellow",
      description: "El proyecto avanza, pero hay pendientes operativos que deben mantenerse visibles."
    };
  }

  return {
    label: "En control",
    tone: "green",
    description: "No hay alertas criticas registradas y los principales frentes se encuentran bajo control."
  };
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
