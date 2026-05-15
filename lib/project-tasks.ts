import { phases as demoPhases, users as demoUsers } from "@/lib/data";
import { formatFileSize, getFileKind } from "@/lib/documents";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Phase, Priority, UserProfile } from "@/lib/types";

export const projectTaskStatuses = ["Pendiente", "En progreso", "Requiere informacion", "Resuelta", "Cerrada"] as const;
export type ProjectTaskStatus = (typeof projectTaskStatuses)[number];
export const projectTaskPriorities: Priority[] = ["Alta", "Media", "Baja"];

export interface ProjectTaskAttachment {
  id: string;
  name: string;
  type: string;
  size: string;
  previewUrl: string;
  downloadUrl: string;
}

export interface ProjectTaskComment {
  id: string;
  body: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
}

export interface ProjectTaskLink {
  id: string;
  type: "finding" | "risk";
  targetId: string;
  label: string;
}

export interface ProjectTaskRecord {
  id: string;
  title: string;
  description: string;
  phaseId: string | null;
  phaseName: string;
  priority: Priority;
  status: ProjectTaskStatus;
  startDate: string | null;
  dueDate: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignees: Pick<UserProfile, "id" | "name" | "email" | "role" | "area">[];
  comments: ProjectTaskComment[];
  attachments: ProjectTaskAttachment[];
  links: ProjectTaskLink[];
}

export interface ProjectTaskOption {
  id: string;
  label: string;
}

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  phase_id: string | null;
  priority: Priority;
  status: ProjectTaskStatus;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string | null;
  phases?: { name: string } | { name: string }[] | null;
  profiles?: { full_name: string } | { full_name: string }[] | null;
}

interface AssigneeRow {
  task_id: string;
  profile_id: string;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
    role: UserProfile["role"];
    area: string | null;
  } | {
    id: string;
    full_name: string;
    email: string;
    role: UserProfile["role"];
    area: string | null;
  }[] | null;
}

interface CommentRow {
  id: string;
  task_id: string;
  body: string;
  created_at: string;
  profiles?: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
}

interface AttachmentRow {
  id: string;
  task_id: string;
  name: string;
  mime_type: string | null;
  size_bytes: number;
}

interface LinkRow {
  id: string;
  task_id: string;
  target_type: "finding" | "risk";
  target_id: string;
}

export async function getProjectTasksData(): Promise<{
  tasks: ProjectTaskRecord[];
  phases: Phase[];
  users: UserProfile[];
  findings: ProjectTaskOption[];
  risks: ProjectTaskOption[];
}> {
  if (!isSupabaseConfigured()) {
    return {
      phases: demoPhases,
      users: demoUsers,
      findings: [],
      risks: [],
      tasks: []
    };
  }

  const supabase = await createClient();
  const [tasksResult, assigneesResult, commentsResult, attachmentsResult, linksResult, phasesResult, usersResult, findingsResult, risksResult] = await Promise.all([
    supabase
      .from("project_tasks")
      .select("id, title, description, phase_id, priority, status, start_date, due_date, created_at, updated_at, phases:phase_id(name), profiles:created_by(full_name)")
      .order("created_at", { ascending: false }),
    supabase.from("project_task_assignees").select("task_id, profile_id, profiles:profile_id(id, full_name, email, role, area)"),
    supabase.from("project_task_comments").select("id, task_id, body, created_at, profiles:author_id(full_name, email)").order("created_at", { ascending: true }),
    supabase.from("project_task_attachments").select("id, task_id, name, mime_type, size_bytes").order("created_at", { ascending: true }),
    supabase.from("project_task_links").select("id, task_id, target_type, target_id"),
    supabase.from("phases").select("id, code, name, week_range, progress").order("code"),
    supabase.from("profiles").select("id, full_name, email, role, organization, position, area, status, module_permissions(module_key, can_view)").eq("status", "Activo").order("full_name"),
    supabase.from("findings").select("id, title").order("created_at", { ascending: false }),
    supabase.from("risks").select("id, title").order("created_at", { ascending: false })
  ]);

  const phases = (phasesResult.data ?? []).map((phase) => ({
    id: phase.id,
    code: phase.code,
    name: phase.name,
    weekRange: phase.week_range ?? "",
    progress: phase.progress ?? 0
  }));

  const users = (usersResult.data ?? []).map((profile) => ({
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    role: profile.role,
    organization: profile.organization,
    position: profile.position ?? "",
    area: profile.area ?? "",
    status: profile.status,
    moduleAccess: (profile.module_permissions ?? []).filter((permission) => permission.can_view).map((permission) => permission.module_key)
  })) as UserProfile[];

  const findings = (findingsResult.data ?? []).map((finding) => ({ id: finding.id, label: finding.title }));
  const risks = (risksResult.data ?? []).map((risk) => ({ id: risk.id, label: risk.title }));
  const links = (linksResult.data ?? []) as LinkRow[];
  const attachments = (attachmentsResult.data ?? []) as AttachmentRow[];
  const comments = (commentsResult.data ?? []) as unknown as CommentRow[];
  const assignees = (assigneesResult.data ?? []) as unknown as AssigneeRow[];

  if (tasksResult.error) return { tasks: [], phases, users, findings, risks };

  return {
    phases,
    users,
    findings,
    risks,
    tasks: ((tasksResult.data ?? []) as unknown as TaskRow[]).map((task) => mapTask(task, { assignees, comments, attachments, links, findings, risks }))
  };
}

function mapTask(
  task: TaskRow,
  data: {
    assignees: AssigneeRow[];
    comments: CommentRow[];
    attachments: AttachmentRow[];
    links: LinkRow[];
    findings: ProjectTaskOption[];
    risks: ProjectTaskOption[];
  }
): ProjectTaskRecord {
  const phase = firstRelation(task.phases);
  const creator = firstRelation(task.profiles);

  return {
    id: task.id,
    title: task.title,
    description: task.description ?? "",
    phaseId: task.phase_id,
    phaseName: phase?.name ?? "Sin fase",
    priority: task.priority,
    status: task.status,
    startDate: task.start_date,
    dueDate: task.due_date,
    createdBy: creator?.full_name ?? "Sin responsable",
    createdAt: formatTaskDate(task.created_at),
    updatedAt: formatTaskDate(task.updated_at ?? task.created_at),
    assignees: data.assignees.filter((assignee) => assignee.task_id === task.id).map(mapAssignee).filter((assignee): assignee is ProjectTaskRecord["assignees"][number] => Boolean(assignee)),
    comments: data.comments.filter((comment) => comment.task_id === task.id).map(mapComment),
    attachments: data.attachments.filter((attachment) => attachment.task_id === task.id).map(mapAttachment),
    links: data.links.filter((link) => link.task_id === task.id).map((link) => mapLink(link, data.findings, data.risks)).filter((link): link is ProjectTaskLink => Boolean(link))
  };
}

function mapAssignee(row: AssigneeRow): ProjectTaskRecord["assignees"][number] | null {
  const profile = firstRelation(row.profiles);
  if (!profile) return null;
  return {
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    role: profile.role,
    area: profile.area ?? ""
  };
}

function mapComment(comment: CommentRow): ProjectTaskComment {
  const profile = firstRelation(comment.profiles);
  return {
    id: comment.id,
    body: comment.body,
    authorName: profile?.full_name ?? "Usuario sin nombre",
    authorEmail: profile?.email ?? "",
    createdAt: formatTaskDate(comment.created_at)
  };
}

function mapAttachment(attachment: AttachmentRow): ProjectTaskAttachment {
  return {
    id: attachment.id,
    name: attachment.name,
    type: getFileKind({ mimeType: attachment.mime_type, name: attachment.name }),
    size: formatFileSize(attachment.size_bytes),
    previewUrl: `/tareas/attachments/${attachment.id}/preview`,
    downloadUrl: `/tareas/attachments/${attachment.id}/download`
  };
}

function mapLink(link: LinkRow, findings: ProjectTaskOption[], risks: ProjectTaskOption[]): ProjectTaskLink | null {
  const source = link.target_type === "finding" ? findings : risks;
  const item = source.find((option) => option.id === link.target_id);
  if (!item) return null;
  return { id: link.id, type: link.target_type, targetId: link.target_id, label: item.label };
}

export function formatTaskDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatOptionalDate(value: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
