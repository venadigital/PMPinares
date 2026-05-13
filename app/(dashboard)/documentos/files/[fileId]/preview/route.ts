import { NextResponse, type NextRequest } from "next/server";
import { getCurrentProfile, hasPermission } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";

const BUCKET = "project-files";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const profile = await getCurrentProfile();
  if (!hasPermission(profile, "documentos", "view")) return new NextResponse("No autorizado", { status: 403 });
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) return new NextResponse("Supabase no configurado", { status: 500 });

  const { fileId } = await params;
  const admin = createAdminClient();
  const { data: file, error } = await admin.from("files").select("storage_path").eq("id", fileId).single();

  if (error || !file) return new NextResponse("Archivo no encontrado", { status: 404 });

  const { data, error: signedError } = await admin.storage.from(BUCKET).createSignedUrl(file.storage_path, 60);
  if (signedError || !data?.signedUrl) return new NextResponse("No se pudo generar la vista previa", { status: 500 });

  return NextResponse.redirect(data.signedUrl);
}
