import { deliverables as demoDeliverables, phases as demoPhases, tasks as demoTasks, users as demoUsers } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Deliverable, Phase, Priority, Status, Task, UserProfile } from "@/lib/types";

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

export interface ScheduleTask extends Task {
  description?: string;
  ownerName?: string;
  ownerEmail?: string;
  startDate?: string;
  deliverables?: Deliverable[];
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
        deliverables: task.type === "Entregable" ? deliverables.filter((deliverable) => deliverable.phaseId === task.phaseId) : []
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
  const taskDeliverablesResult = await supabase.from("task_deliverables").select("task_id, deliverable_id");
  const taskDeliverableRows = taskDeliverablesResult.error ? [] : ((taskDeliverablesResult.data ?? []) as DbTaskDeliverable[]);

  return {
    phases: (phaseRows ?? []).map(mapPhase),
    tasks: (taskRows ?? []).map((task) => mapTask(task as unknown as DbTask, deliverables, taskDeliverableRows)),
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

function mapTask(task: DbTask, deliverables: Deliverable[], taskDeliverables: DbTaskDeliverable[]): ScheduleTask {
  const linkedDeliverableIds = taskDeliverables.filter((link) => link.task_id === task.id).map((link) => link.deliverable_id);
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
    deliverables: deliverables.filter((deliverable) => linkedDeliverableIds.includes(deliverable.id))
  };
}
