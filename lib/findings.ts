import { areas as demoAreas, findings as demoFindings } from "@/lib/data";
import { formatFileSize, getFileKind } from "@/lib/documents";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Criticality, Finding } from "@/lib/types";

export const findingClassifications = [
  "Operativo",
  "Tecnologico",
  "Seguridad",
  "Cumplimiento",
  "Costos",
  "Experiencia del paciente",
  "Integracion",
  "Automatizacion"
] as const;

export const findingCriticalities = ["Alta", "Media", "Baja"] as const;

export const findingStatuses = [
  "Identificado",
  "En analisis",
  "Validado",
  "Descartado",
  "Convertido en recomendacion/iniciativa"
] as const;

export interface FindingArea {
  id: string;
  name: string;
}

export interface FindingAttachment {
  id: string;
  name: string;
  type: string;
  size: string;
  previewUrl: string;
  downloadUrl: string;
}

export interface FindingRecord extends Finding {
  description: string;
  areaId: string | null;
  identifiedBy: string;
  identifiedByEmail: string;
  createdAt: string;
  updatedAt: string;
  attachments: FindingAttachment[];
}

interface FindingRow {
  id: string;
  title: string;
  description: string | null;
  classification: string;
  criticality: Criticality;
  status: FindingRecord["status"];
  area_id: string | null;
  identified_by: string | null;
  created_at: string;
  updated_at: string | null;
  areas?: { name: string } | { name: string }[] | null;
  profiles?: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
}

interface AttachmentRow {
  id: string;
  finding_id: string;
  name: string;
  mime_type: string | null;
  size_bytes: number;
}

export async function getFindingsData(): Promise<{ findings: FindingRecord[]; areas: FindingArea[] }> {
  if (!isSupabaseConfigured()) {
    return {
      areas: demoAreas.map((area) => ({ id: area, name: area })),
      findings: demoFindings.map((finding) => ({
        ...finding,
        description: "",
        areaId: finding.area,
        identifiedBy: "Demo",
        identifiedByEmail: "",
        createdAt: "",
        updatedAt: "",
        attachments: []
      }))
    };
  }

  const supabase = await createClient();
  const [findingsResult, attachmentsResult, areasResult] = await Promise.all([
    supabase
      .from("findings")
      .select("id, title, description, classification, criticality, status, area_id, identified_by, created_at, updated_at, areas:area_id(name), profiles:identified_by(full_name, email)")
      .order("created_at", { ascending: false }),
    supabase.from("finding_attachments").select("id, finding_id, name, mime_type, size_bytes").order("created_at", { ascending: true }),
    supabase.from("areas").select("id, name").order("name")
  ]);

  const attachments = (attachmentsResult.data ?? []) as AttachmentRow[];

  return {
    areas: (areasResult.data ?? []) as FindingArea[],
    findings: ((findingsResult.data ?? []) as unknown as FindingRow[]).map((finding) => mapFinding(finding, attachments))
  };
}

function mapFinding(finding: FindingRow, attachments: AttachmentRow[]): FindingRecord {
  const area = firstRelation(finding.areas);
  const profile = firstRelation(finding.profiles);

  return {
    id: finding.id,
    title: finding.title,
    description: finding.description ?? "",
    classification: finding.classification,
    criticality: finding.criticality,
    status: finding.status,
    area: area?.name ?? "Sin area",
    areaId: finding.area_id,
    identifiedBy: profile?.full_name ?? "Sin responsable",
    identifiedByEmail: profile?.email ?? "",
    createdAt: formatFindingDate(finding.created_at),
    updatedAt: formatFindingDate(finding.updated_at ?? finding.created_at),
    attachments: attachments.filter((attachment) => attachment.finding_id === finding.id).map(mapAttachment)
  };
}

function mapAttachment(attachment: AttachmentRow): FindingAttachment {
  return {
    id: attachment.id,
    name: attachment.name,
    type: getFileKind({ mimeType: attachment.mime_type, name: attachment.name }),
    size: formatFileSize(attachment.size_bytes),
    previewUrl: `/hallazgos/attachments/${attachment.id}/preview`,
    downloadUrl: `/hallazgos/attachments/${attachment.id}/download`
  };
}

function formatFindingDate(value: string) {
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
