import { deliverables as demoDeliverables, phases as demoPhases } from "@/lib/data";
import { getDocumentData, type DocumentFile } from "@/lib/documents";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Deliverable, Phase, Status } from "@/lib/types";

export const deliverableStatuses = ["Pendiente", "En elaboracion", "En revision interna", "Enviado a Pinares", "Aprobado", "Requiere ajustes"] as const;

export interface DeliverableTask {
  id: string;
  title: string;
  status: Status;
  type: string;
}

export interface DeliverableRecord extends Deliverable {
  phaseName: string;
  phaseCode: string | null;
  fileId: string | null;
  file: DocumentFile | null;
  tasks: DeliverableTask[];
  linkedTaskCount: number;
  createdAt: string;
}

interface DbDeliverable {
  id: string;
  title: string;
  phase_id: string | null;
  status: Deliverable["status"];
  file_id: string | null;
  created_at: string;
}

interface DbPhase {
  id: string;
  code: string;
  name: string;
  week_range: string | null;
  progress: number;
}

interface TaskLinkRow {
  deliverable_id: string;
  tasks?: {
    id: string;
    title: string;
    status: Status;
    item_type: string;
  } | {
    id: string;
    title: string;
    status: Status;
    item_type: string;
  }[] | null;
}

export async function getDeliverablesData(): Promise<{ deliverables: DeliverableRecord[]; phases: Phase[]; documents: DocumentFile[] }> {
  const documentData = await getDocumentData();

  if (!isSupabaseConfigured()) {
    const documentsById = new Map(documentData.files.map((file) => [file.id, file]));
    return {
      deliverables: demoDeliverables.map((deliverable) => {
        const phase = demoPhases.find((item) => item.id === deliverable.phaseId);
        return {
          ...deliverable,
          phaseName: phase?.name ?? "Sin fase",
          phaseCode: phase?.code ?? null,
          fileId: null,
          file: documentsById.get("") ?? null,
          tasks: [],
          linkedTaskCount: 0,
          createdAt: new Date().toISOString()
        };
      }),
      phases: demoPhases,
      documents: documentData.files
    };
  }

  const supabase = await createClient();
  const [{ data: deliverableRows }, { data: phaseRows }, linkResult] = await Promise.all([
    supabase.from("deliverables").select("id, title, phase_id, status, file_id, created_at").order("created_at", { ascending: false }),
    supabase.from("phases").select("id, code, name, week_range, progress").order("code"),
    supabase.from("task_deliverables").select("deliverable_id, tasks:task_id(id, title, status, item_type)")
  ]);

  const phases = (phaseRows ?? []).map((phase) => mapPhase(phase as DbPhase));
  const phasesById = new Map(phases.map((phase) => [phase.id, phase]));
  const documentsById = new Map(documentData.files.map((file) => [file.id, file]));
  const linksByDeliverable = groupTaskLinks((linkResult.error ? [] : linkResult.data ?? []) as unknown as TaskLinkRow[]);

  return {
    deliverables: (deliverableRows ?? []).map((deliverable) => mapDeliverable(deliverable as DbDeliverable, phasesById, documentsById, linksByDeliverable)),
    phases,
    documents: documentData.files
  };
}

function mapDeliverable(
  deliverable: DbDeliverable,
  phasesById: Map<string, Phase>,
  documentsById: Map<string, DocumentFile>,
  linksByDeliverable: Map<string, DeliverableTask[]>
): DeliverableRecord {
  const phase = deliverable.phase_id ? phasesById.get(deliverable.phase_id) : null;
  const tasks = linksByDeliverable.get(deliverable.id) ?? [];

  return {
    id: deliverable.id,
    title: deliverable.title,
    phaseId: deliverable.phase_id ?? "",
    phaseName: phase?.name ?? "Sin fase",
    phaseCode: phase?.code ?? null,
    status: deliverable.status,
    fileId: deliverable.file_id,
    file: deliverable.file_id ? documentsById.get(deliverable.file_id) ?? null : null,
    tasks,
    linkedTaskCount: tasks.length,
    createdAt: formatDeliverableDate(deliverable.created_at)
  };
}

function groupTaskLinks(rows: TaskLinkRow[]) {
  const grouped = new Map<string, DeliverableTask[]>();

  for (const row of rows) {
    const task = firstRelation(row.tasks);
    if (!task) continue;
    const list = grouped.get(row.deliverable_id) ?? [];
    list.push({
      id: task.id,
      title: task.title,
      status: task.status,
      type: task.item_type
    });
    grouped.set(row.deliverable_id, list);
  }

  return grouped;
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

function formatDeliverableDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
