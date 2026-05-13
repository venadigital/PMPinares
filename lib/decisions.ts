import { decisions as demoDecisions } from "@/lib/data";
import { getDocumentData, type DocumentFile } from "@/lib/documents";
import { getProfiles } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Decision, UserProfile } from "@/lib/types";

export const decisionStatuses = ["Pendiente", "Tomada", "En seguimiento", "Cerrada"] as const;
export type DecisionStatus = (typeof decisionStatuses)[number];

export interface DecisionDocument {
  id: string;
  name: string;
  type: string;
  folder: string;
}

export interface DecisionRecord extends Decision {
  description: string;
  decisionDate: string;
  context: string;
  participants: string;
  alternatives: string;
  decisionTaken: string;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
  documents: DecisionDocument[];
}

interface DecisionRow {
  id: string;
  title: string;
  description: string | null;
  decision_date: string | null;
  participants: string | null;
  context: string | null;
  alternatives: string | null;
  decision_taken: string | null;
  owner_id: string | null;
  status: DecisionStatus;
  created_at: string;
  updated_at?: string | null;
  profiles?: { full_name: string } | { full_name: string }[] | null;
}

interface LinkRow {
  id: string;
  source_id: string;
  target_id: string;
  target_type: string;
}

export async function getDecisionsData(): Promise<{ decisions: DecisionRecord[]; users: UserProfile[]; documents: DocumentFile[] }> {
  if (!isSupabaseConfigured()) {
    return {
      decisions: demoDecisions.map((decision) => ({
        ...decision,
        description: "",
        decisionDate: "",
        context: "",
        participants: "",
        alternatives: "",
        decisionTaken: "",
        ownerId: null,
        createdAt: decision.date,
        updatedAt: decision.date,
        documents: []
      })),
      users: await getProfiles(),
      documents: []
    };
  }

  const supabase = await createClient();
  const [{ users, documents }, decisionsResult, linksResult] = await Promise.all([
    getDecisionOptions(),
    supabase
      .from("decisions")
      .select("id, title, description, decision_date, participants, context, alternatives, decision_taken, owner_id, status, created_at, updated_at, profiles:owner_id(full_name)")
      .order("created_at", { ascending: false }),
    supabase.from("entity_links").select("id, source_id, target_type, target_id").eq("source_type", "decision").eq("target_type", "file")
  ]);

  const links = (linksResult.data ?? []) as LinkRow[];
  const documentById = new Map(documents.map((document) => [document.id, document]));

  return {
    users,
    documents,
    decisions: ((decisionsResult.data ?? []) as unknown as DecisionRow[]).map((decision) => mapDecision(decision, links, documentById))
  };
}

async function getDecisionOptions() {
  const [users, documentData] = await Promise.all([getProfiles(), getDocumentData()]);
  return { users, documents: documentData.files };
}

function mapDecision(decision: DecisionRow, links: LinkRow[], documents: Map<string, DocumentFile>): DecisionRecord {
  const profile = firstRelation(decision.profiles);
  const linkedDocuments = links
    .filter((link) => link.source_id === decision.id)
    .map((link) => documents.get(link.target_id))
    .filter((document): document is DocumentFile => Boolean(document))
    .map((document) => ({
      id: document.id,
      name: document.name,
      type: document.type,
      folder: document.folder
    }));

  return {
    id: decision.id,
    title: decision.title,
    date: decision.decision_date ? formatDate(decision.decision_date) : "Sin fecha",
    owner: profile?.full_name ?? "Sin responsable",
    status: decision.status,
    description: decision.description ?? "",
    decisionDate: decision.decision_date ?? "",
    context: decision.context ?? "",
    participants: decision.participants ?? "",
    alternatives: decision.alternatives ?? "",
    decisionTaken: decision.decision_taken ?? "",
    ownerId: decision.owner_id,
    createdAt: formatDateTime(decision.created_at),
    updatedAt: formatDateTime(decision.updated_at ?? decision.created_at),
    documents: linkedDocuments
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string) {
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
