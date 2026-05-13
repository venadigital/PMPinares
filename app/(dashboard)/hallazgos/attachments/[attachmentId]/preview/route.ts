import { NextResponse, type NextRequest } from "next/server";
import { getCurrentProfile, hasPermission } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";

const BUCKET = "project-files";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ attachmentId: string }> }) {
  const profile = await getCurrentProfile();
  if (!hasPermission(profile, "hallazgos", "view")) return new NextResponse("No autorizado", { status: 403 });
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) return new NextResponse("Supabase no configurado", { status: 500 });

  const { attachmentId } = await params;
  const admin = createAdminClient();
  const { data: attachment, error } = await admin.from("finding_attachments").select("storage_path").eq("id", attachmentId).single();

  if (error || !attachment) return new NextResponse("Evidencia no encontrada", { status: 404 });

  const { data, error: signedError } = await admin.storage.from(BUCKET).createSignedUrl(attachment.storage_path, 60);
  if (signedError || !data?.signedUrl) return new NextResponse("No se pudo generar la vista previa", { status: 500 });

  return NextResponse.redirect(data.signedUrl);
}
