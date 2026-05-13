import { tools as demoTools, areas as demoAreas } from "@/lib/data";
import { formatFileSize, getFileKind } from "@/lib/documents";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Currency, ToolItem, TrafficLight } from "@/lib/types";

export interface ToolAttachment {
  id: string;
  name: string;
  type: string;
  size: string;
  previewUrl: string;
  downloadUrl: string;
}

export interface InventoryTool extends ToolItem {
  contractedFeatures: string;
  usedFeatures: string;
  integrations: string;
  associatedRisks: string;
  createdAt: string;
  attachments: ToolAttachment[];
}

interface ToolRow {
  id: string;
  name: string;
  provider: string;
  cost: number | string;
  currency: Currency;
  license_type: string;
  user_count: number;
  internal_owner: string;
  area_names: string[] | null;
  contracted_features: string | null;
  used_features: string | null;
  integrations: string | null;
  api_available: boolean;
  usage_light: TrafficLight;
  user_satisfaction: number | null;
  associated_risks: string | null;
  created_at: string;
}

interface AttachmentRow {
  id: string;
  tool_id: string;
  name: string;
  mime_type: string | null;
  size_bytes: number;
}

export async function getInventoryData(): Promise<{ tools: InventoryTool[]; areas: string[] }> {
  if (!isSupabaseConfigured()) {
    return {
      areas: demoAreas,
      tools: demoTools.map((tool) => ({
        ...tool,
        contractedFeatures: "",
        usedFeatures: "",
        integrations: "",
        associatedRisks: "",
        createdAt: "",
        attachments: []
      }))
    };
  }

  const supabase = await createClient();
  const [toolsResult, attachmentsResult, areasResult] = await Promise.all([
    supabase
      .from("technology_tools")
      .select("id, name, provider, cost, currency, license_type, user_count, internal_owner, area_names, contracted_features, used_features, integrations, api_available, usage_light, user_satisfaction, associated_risks, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("technology_tool_attachments").select("id, tool_id, name, mime_type, size_bytes").order("created_at", { ascending: true }),
    supabase.from("areas").select("name").order("name")
  ]);

  const attachments = (attachmentsResult.data ?? []) as AttachmentRow[];

  return {
    areas: (areasResult.data ?? []).map((area) => area.name),
    tools: ((toolsResult.data ?? []) as ToolRow[]).map((tool) => mapTool(tool, attachments))
  };
}

function mapTool(tool: ToolRow, attachments: AttachmentRow[]): InventoryTool {
  return {
    id: tool.id,
    name: tool.name,
    provider: tool.provider,
    cost: Number(tool.cost),
    currency: tool.currency,
    licenseType: tool.license_type,
    users: tool.user_count,
    owner: tool.internal_owner,
    areas: tool.area_names ?? [],
    contractedFeatures: tool.contracted_features ?? "",
    usedFeatures: tool.used_features ?? "",
    integrations: tool.integrations ?? "",
    apiAvailable: tool.api_available,
    trafficLight: tool.usage_light,
    satisfaction: tool.user_satisfaction ?? 1,
    associatedRisks: tool.associated_risks ?? "",
    createdAt: formatInventoryDate(tool.created_at),
    attachments: attachments.filter((attachment) => attachment.tool_id === tool.id).map(mapAttachment)
  };
}

function mapAttachment(attachment: AttachmentRow): ToolAttachment {
  return {
    id: attachment.id,
    name: attachment.name,
    type: getFileKind({ mimeType: attachment.mime_type, name: attachment.name }),
    size: formatFileSize(attachment.size_bytes),
    previewUrl: `/inventario/attachments/${attachment.id}/preview`,
    downloadUrl: `/inventario/attachments/${attachment.id}/download`
  };
}

function formatInventoryDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}
