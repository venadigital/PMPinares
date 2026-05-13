import { documents as demoDocuments, phases as demoPhases } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { DocumentItem, Phase } from "@/lib/types";

export interface DocumentFolder {
  id: string;
  name: string;
  phaseId: string | null;
  phaseName: string | null;
  phaseCode: string | null;
  parentId: string | null;
  createdAt: string;
  fileCount: number;
}

export interface DocumentFile extends DocumentItem {
  folderId: string | null;
  phaseName: string | null;
  mimeType: string | null;
  storagePath: string;
  sizeBytes: number;
}

interface FolderRow {
  id: string;
  name: string;
  phase_id: string | null;
  parent_id: string | null;
  created_at: string;
  phases?: { name: string; code: string } | { name: string; code: string }[] | null;
}

interface FileRow {
  id: string;
  folder_id: string | null;
  phase_id: string | null;
  uploaded_by: string | null;
  name: string;
  mime_type: string | null;
  storage_path: string;
  size_bytes: number;
  created_at: string;
  folders?: { name: string } | { name: string }[] | null;
  phases?: { name: string } | { name: string }[] | null;
  profiles?: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
}

export async function getDocumentData(): Promise<{ phases: Phase[]; folders: DocumentFolder[]; files: DocumentFile[] }> {
  if (!isSupabaseConfigured()) {
    return {
      phases: demoPhases,
      folders: demoPhases.map((phase) => ({
        id: phase.id,
        name: phase.name,
        phaseId: phase.id,
        phaseName: phase.name,
        phaseCode: phase.code ?? null,
        parentId: null,
        createdAt: new Date().toISOString(),
        fileCount: demoDocuments.filter((document) => document.phaseId === phase.id).length
      })),
      files: demoDocuments.map((document) => ({
        ...document,
        folderId: document.phaseId,
        phaseName: document.folder,
        mimeType: document.type,
        storagePath: "",
        sizeBytes: Math.round(document.sizeMb * 1024 * 1024)
      }))
    };
  }

  const supabase = await createClient();
  const [phasesResult, foldersResult, filesResult] = await Promise.all([
    supabase.from("phases").select("id, code, name, week_range, progress").order("code"),
    supabase.from("folders").select("id, name, phase_id, parent_id, created_at, phases:phase_id(name, code)").order("created_at", { ascending: true }),
    supabase
      .from("files")
      .select("id, folder_id, phase_id, uploaded_by, name, mime_type, storage_path, size_bytes, created_at, folders:folder_id(name), phases:phase_id(name), profiles:uploaded_by(full_name, email)")
      .order("created_at", { ascending: false })
  ]);

  const phases = (phasesResult.data ?? []).map((phase) => ({
    id: phase.id,
    code: phase.code,
    name: phase.name,
    weekRange: phase.week_range ?? "",
    progress: phase.progress ?? 0
  }));

  const files = ((filesResult.data ?? []) as unknown as FileRow[]).map(mapFile);
  const fileCounts = files.reduce<Record<string, number>>((counts, file) => {
    if (!file.folderId) return counts;
    counts[file.folderId] = (counts[file.folderId] ?? 0) + 1;
    return counts;
  }, {});

  const folders = ((foldersResult.data ?? []) as unknown as FolderRow[]).map((folder) => {
    const phase = firstRelation(folder.phases);
    return {
    id: folder.id,
    name: folder.name,
    phaseId: folder.phase_id,
    phaseName: phase?.name ?? null,
    phaseCode: phase?.code ?? null,
    parentId: folder.parent_id,
    createdAt: folder.created_at,
    fileCount: fileCounts[folder.id] ?? 0
  };
  });

  return { phases, folders, files };
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

export function formatDocumentDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function getFileKind(file: Pick<DocumentFile, "mimeType" | "name">) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (file.mimeType?.startsWith("image/")) return "Imagen";
  if (file.mimeType?.startsWith("audio/")) return "Audio";
  if (file.mimeType?.includes("pdf")) return "PDF";
  if (["doc", "docx"].includes(extension)) return "Word";
  if (["xls", "xlsx", "csv"].includes(extension)) return "Excel";
  if (["ppt", "pptx"].includes(extension)) return "PowerPoint";
  if (["md", "txt"].includes(extension)) return "Texto";
  return extension ? extension.toUpperCase() : "Archivo";
}

function mapFile(file: FileRow): DocumentFile {
  const sizeMb = Number((file.size_bytes / 1024 / 1024).toFixed(2));
  const folder = firstRelation(file.folders);
  const phase = firstRelation(file.phases);
  const profile = firstRelation(file.profiles);

  return {
    id: file.id,
    name: file.name,
    folder: folder?.name ?? "Sin carpeta",
    folderId: file.folder_id,
    phaseId: file.phase_id ?? "",
    phaseName: phase?.name ?? null,
    type: getFileKind({ mimeType: file.mime_type, name: file.name }),
    mimeType: file.mime_type,
    storagePath: file.storage_path,
    sizeMb,
    sizeBytes: file.size_bytes,
    uploadedAt: formatDocumentDate(file.created_at),
    uploadedBy: profile?.full_name ?? "Sin responsable"
  };
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
