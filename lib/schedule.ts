import { deliverables as demoDeliverables, phases as demoPhases, tasks as demoTasks, users as demoUsers } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Deliverable, Phase, Priority, Status, Task, TaskSubtask, UserProfile } from "@/lib/types";

interface DbPhase {
  id: string;
  code: string;
  name: string;
  week_range: string | null;
  progress: number;
}

interface DbTask {
  id: string;
  title: string;
  description: string | null;
  phase_id: string | null;
  owner_id: string | null;
  status: Status;
  priority: Priority;
  item_type: "Tarea" | "Hito" | "Entregable";
  start_date: string | null;
  due_date: string | null;
  profiles?: { full_name: string; email: string } | null;
}

interface DbDeliverable {
  id: string;
  title: string;
  phase_id: string | null;
  status: Deliverable["status"];
}

interface DbTaskDeliverable {
  task_id: string;
  deliverable_id: string;
}

interface DbSubtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
}

export interface ScheduleTask extends Task {
  description?: string;
  ownerName?: string;
  ownerEmail?: string;
  startDate?: string;
  deliverables?: Deliverable[];
  subtasks: TaskSubtask[];
  subtaskProgress: number;
  completedSubtasks: number;
  totalSubtasks: number;
  effectiveStatus: Status;
}

export async function getScheduleData(): Promise<{ phases: Phase[]; tasks: ScheduleTask[]; users: UserProfile[]; deliverables: Deliverable[] }> {
  if (!isSupabaseConfigured()) {
    const deliverables = demoDeliverables;
    return {
      phases: demoPhases,
      tasks: demoTasks.map((task) => ({
        ...task,
        description: undefined,
        startDate: undefined,
        ownerName: demoUsers.find((user) => user.id === task.ownerId)?.name,
        ownerEmail: demoUsers.find((user) => user.id === task.ownerId)?.email,
        deliverables: task.type === "Entregable" ? deliverables.filter((deliverable) => deliverable.phaseId === task.phaseId) : [],
        subtasks: [],
        subtaskProgress: task.status === "Completado" ? 100 : 0,
        completedSubtasks: 0,
        totalSubtasks: 0,
        effectiveStatus: task.status
      })),
      users: demoUsers,
      deliverables
    };
  }

  const supabase = await createClient();
  const [{ data: phaseRows }, { data: taskRows }, { data: profileRows }, { data: deliverableRows }] = await Promise.all([
    supabase.from("phases").select("id, code, name, week_range, progress").order("code"),
    supabase.from("tasks").select("id, title, description, phase_id, owner_id, status, priority, item_type, start_date, due_date, profiles:owner_id(full_name, email)").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, email, role, organization, position, area, status, module_permissions(module_key, can_view)").eq("status", "Activo").order("full_name"),
    supabase.from("deliverables").select("id, title, phase_id, status").order("created_at", { ascending: false })
  ]);

  const deliverables = (deliverableRows ?? []).map((deliverable) => mapDeliverable(deliverable as DbDeliverable));
  const [taskDeliverablesResult, subtasksResult] = await Promise.all([
    supabase.from("task_deliverables").select("task_id, deliverable_id"),
    supabase.from("task_subtasks").select("id, task_id, title, is_completed, created_at").order("created_at", { ascending: true })
  ]);
  const taskDeliverableRows = taskDeliverablesResult.error ? [] : ((taskDeliverablesResult.data ?? []) as DbTaskDeliverable[]);
  const subtasksByTask = groupSubtasks(subtasksResult.error ? [] : ((subtasksResult.data ?? []) as DbSubtask[]));

  return {
    phases: (phaseRows ?? []).map(mapPhase),
    tasks: (taskRows ?? []).map((task) => mapTask(task as unknown as DbTask, deliverables, taskDeliverableRows, subtasksByTask)),
    users: (profileRows ?? []).map((profile) => ({
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: profile.role,
      organization: profile.organization,
      position: profile.position ?? "",
      area: profile.area ?? "",
      status: profile.status,
      moduleAccess: (profile.module_permissions ?? []).filter((permission) => permission.can_view).map((permission) => permission.module_key)
    })),
    deliverables
  };
}

function mapPhase(phase: DbPhase): Phase {
  return {
    id: phase.id,
    code: phase.code,
    name: phase.name,
    weekRange: phase.week_range ?? "",
    progress: phase.progress
  };
}

function mapDeliverable(deliverable: DbDeliverable): Deliverable {
  return {
    id: deliverable.id,
    title: deliverable.title,
    phaseId: deliverable.phase_id ?? "",
    status: deliverable.status
  };
}

function mapTask(task: DbTask, deliverables: Deliverable[], taskDeliverables: DbTaskDeliverable[], subtasksByTask: Map<string, TaskSubtask[]>): ScheduleTask {
  const linkedDeliverableIds = taskDeliverables.filter((link) => link.task_id === task.id).map((link) => link.deliverable_id);
  const subtasks = subtasksByTask.get(task.id) ?? [];
  const completedSubtasks = subtasks.filter((subtask) => subtask.isCompleted).length;
  const totalSubtasks = subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : task.status === "Completado" ? 100 : 0;
  const effectiveStatus = getEffectiveStatus(task.status, totalSubtasks, subtaskProgress);

  return {
    id: task.id,
    title: task.title,
    description: task.description ?? undefined,
    phaseId: task.phase_id ?? "",
    status: task.status,
    priority: task.priority,
    ownerId: task.owner_id ?? "",
    ownerName: task.profiles?.full_name ?? undefined,
    ownerEmail: task.profiles?.email ?? undefined,
    startDate: task.start_date ?? undefined,
    dueDate: task.due_date ?? undefined,
    type: task.item_type,
    deliverables: deliverables.filter((deliverable) => linkedDeliverableIds.includes(deliverable.id)),
    subtasks,
    subtaskProgress,
    completedSubtasks,
    totalSubtasks,
    effectiveStatus
  };
}

function groupSubtasks(rows: DbSubtask[]) {
  const grouped = new Map<string, TaskSubtask[]>();

  for (const row of rows) {
    const list = grouped.get(row.task_id) ?? [];
    list.push({
      id: row.id,
      taskId: row.task_id,
      title: row.title,
      isCompleted: row.is_completed,
      createdAt: row.created_at
    });
    grouped.set(row.task_id, list);
  }

  return grouped;
}

function getEffectiveStatus(status: Status, totalSubtasks: number, progress: number): Status {
  if (totalSubtasks === 0) return status;
  if (progress === 0) return "No iniciado";
  if (progress === 100) return "Completado";
  return "En progreso";
}
