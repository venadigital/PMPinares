import { areas as demoAreas, risks as demoRisks } from "@/lib/data";
import { formatFileSize, getFileKind } from "@/lib/documents";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Risk, RiskLevel } from "@/lib/types";

export const riskCategories = ["Operativo", "Tecnologico", "Seguridad", "Cumplimiento", "Financiero", "Continuidad", "Integracion"] as const;
export const riskLevels = ["Alto", "Medio", "Bajo"] as const;
export const riskStatuses = ["Abierto", "En revision", "Cerrado"] as const;
export const riskRegulations = ["Ley 1581/2012", "Resolucion 1995/1999", "DIAN / facturacion electronica", "Seguridad de datos de pacientes", "No aplica / por definir"] as const;
export const riskLinkTypes = ["area", "tool", "process", "finding"] as const;

export type RiskStatus = (typeof riskStatuses)[number];
export type RiskCategory = (typeof riskCategories)[number];
export type RiskLinkType = (typeof riskLinkTypes)[number];

export interface RiskOption {
  id: string;
  name: string;
  type: RiskLinkType;
}

export interface RiskAttachment {
  id: string;
  name: string;
  type: string;
  size: string;
  previewUrl: string;
  downloadUrl: string;
}

export interface RiskLink {
  id: string;
  type: RiskLinkType;
  label: string;
}

export interface RiskRecord extends Risk {
  description: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  attachments: RiskAttachment[];
  linkRecords: RiskLink[];
}

export interface RiskOptions {
  areas: RiskOption[];
  tools: RiskOption[];
  processes: RiskOption[];
  findings: RiskOption[];
}

interface RiskRow {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  level: RiskLevel;
  regulation: string | null;
  status: RiskStatus;
  created_at: string;
  updated_at?: string | null;
  profiles?: { full_name: string } | { full_name: string }[] | null;
}

interface AttachmentRow {
  id: string;
  risk_id: string;
  name: string;
  mime_type: string | null;
  size_bytes: number;
}

interface LinkRow {
  id: string;
  source_id: string;
  target_type: RiskLinkType;
  target_id: string;
}

export async function getRisksData(): Promise<{ risks: RiskRecord[]; options: RiskOptions }> {
  if (!isSupabaseConfigured()) {
    return {
      options: {
        areas: demoAreas.map((area) => ({ id: area, name: area, type: "area" })),
        tools: [],
        processes: [],
        findings: []
      },
      risks: demoRisks.map((risk) => ({
        ...risk,
        description: "",
        category: "Operativo",
        createdAt: "",
        updatedAt: "",
        createdBy: "Demo",
        attachments: [],
        linkRecords: risk.links.map((link, index) => ({ id: `${risk.id}-${index}`, type: "area", label: link }))
      }))
    };
  }

  const supabase = await createClient();
  const [risksResult, attachmentsResult, linksResult, areasResult, toolsResult, processesResult, findingsResult] = await Promise.all([
    supabase.from("risks").select("id, title, description, category, level, regulation, status, created_at, updated_at, profiles:created_by(full_name)").order("created_at", { ascending: false }),
    supabase.from("risk_attachments").select("id, risk_id, name, mime_type, size_bytes").order("created_at", { ascending: true }),
    supabase.from("entity_links").select("id, source_id, target_type, target_id").eq("source_type", "risk"),
    supabase.from("areas").select("id, name").order("name"),
    supabase.from("technology_tools").select("id, name").order("name"),
    supabase.from("processes").select("id, name").order("name"),
    supabase.from("findings").select("id, title").order("created_at", { ascending: false })
  ]);

  const options = buildOptions(areasResult.data ?? [], toolsResult.data ?? [], processesResult.data ?? [], findingsResult.data ?? []);
  const attachments = (attachmentsResult.data ?? []) as AttachmentRow[];
  const links = (linksResult.data ?? []) as LinkRow[];

  if (risksResult.error) {
    return { risks: [], options };
  }

  return {
    options,
    risks: ((risksResult.data ?? []) as unknown as RiskRow[]).map((risk) => mapRisk(risk, attachments, links, options))
  };
}

function buildOptions(
  areas: { id: string; name: string }[],
  tools: { id: string; name: string }[],
  processes: { id: string; name: string }[],
  findings: { id: string; title: string }[]
): RiskOptions {
  return {
    areas: areas.map((area) => ({ id: area.id, name: area.name, type: "area" })),
    tools: tools.map((tool) => ({ id: tool.id, name: tool.name, type: "tool" })),
    processes: processes.map((process) => ({ id: process.id, name: process.name, type: "process" })),
    findings: findings.map((finding) => ({ id: finding.id, name: finding.title, type: "finding" }))
  };
}

function mapRisk(risk: RiskRow, attachments: AttachmentRow[], links: LinkRow[], options: RiskOptions): RiskRecord {
  const riskLinks = links.filter((link) => link.source_id === risk.id).map((link) => mapLink(link, options)).filter((link): link is RiskLink => Boolean(link));
  const profile = firstRelation(risk.profiles);

  return {
    id: risk.id,
    title: risk.title,
    description: risk.description ?? "",
    category: risk.category ?? "Operativo",
    level: risk.level,
    regulation: risk.regulation ?? "No aplica / por definir",
    status: risk.status,
    links: riskLinks.map((link) => link.label),
    linkRecords: riskLinks,
    createdAt: formatRiskDate(risk.created_at),
    updatedAt: formatRiskDate(risk.updated_at ?? risk.created_at),
    createdBy: profile?.full_name ?? "Sin responsable",
    attachments: attachments.filter((attachment) => attachment.risk_id === risk.id).map(mapAttachment)
  };
}

function mapLink(link: LinkRow, options: RiskOptions): RiskLink | null {
  const option = [...options.areas, ...options.tools, ...options.processes, ...options.findings].find((item) => item.type === link.target_type && item.id === link.target_id);
  if (!option) return null;
  return { id: `${link.target_type}:${link.target_id}`, type: link.target_type, label: option.name };
}

function mapAttachment(attachment: AttachmentRow): RiskAttachment {
  return {
    id: attachment.id,
    name: attachment.name,
    type: getFileKind({ mimeType: attachment.mime_type, name: attachment.name }),
    size: formatFileSize(attachment.size_bytes),
    previewUrl: `/riesgos/attachments/${attachment.id}/preview`,
    downloadUrl: `/riesgos/attachments/${attachment.id}/download`
  };
}

function formatRiskDate(value: string) {
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
