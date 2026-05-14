import { NextResponse } from "next/server";
import { modules } from "@/lib/data";
import { sendProjectEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import type { ModuleKey, Role } from "@/lib/types";

const adminRoles: Role[] = ["Administrador Vena Digital", "Administrador Pinares"];
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pinarespm.venadigital.com.co/";

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
      return NextResponse.json({ error: "Configura Supabase y SUPABASE_SERVICE_ROLE_KEY para crear usuarios reales" }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Tu sesion expiro. Vuelve a iniciar sesion para crear usuarios." }, { status: 401 });
    }

    const { data: currentProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: Role }>();

    if (profileError || !currentProfile) {
      return NextResponse.json({ error: "No se encontro el perfil administrador activo para esta sesion." }, { status: 403 });
    }

    if (currentProfile.role !== "Administrador Vena Digital") {
      return NextResponse.json({ error: "Solo Administrador Vena Digital puede crear usuarios" }, { status: 403 });
    }

    const formData = await request.formData();
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("temporaryPassword") ?? "");
    const role = String(formData.get("role") ?? "Stakeholder Pinares") as Role;
    const organization = String(formData.get("organization") ?? "Pinares") as "Vena Digital" | "Pinares";
    const position = String(formData.get("position") ?? "").trim();
    const area = String(formData.get("area") ?? "").trim();

    if (!fullName || !email || password.length < 8) {
      return NextResponse.json({ error: "Nombre, correo y contrasena temporal de minimo 8 caracteres son obligatorios" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: createdUser, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role }
    });

    if (authError || !createdUser.user) {
      return NextResponse.json({ error: authError?.message ?? "No se pudo crear el usuario" }, { status: 400 });
    }

    const userId = createdUser.user.id;
    const { error: profileCreationError } = await admin.from("profiles").insert({
      id: userId,
      full_name: fullName,
      email,
      role,
      organization,
      position,
      area,
      status: "Activo"
    });

    if (profileCreationError) {
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileCreationError.message }, { status: 400 });
    }

    const permissions = modules.map((module) => buildPermissionRow(formData, userId, module.key, role));
    const { error: permissionError } = await admin.from("module_permissions").insert(permissions);

    if (permissionError) {
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: permissionError.message }, { status: 400 });
    }

    const emailResult = await sendProjectEmail({
      to: email,
      subject: "Invitacion a Pinares Project Control",
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
          <p>Hola ${fullName},</p>
          <p>Vena Digital creo tu acceso a <strong>Pinares Project Control</strong>.</p>
          <p>
            <strong>Link de acceso:</strong>
            <a href="${appUrl}" style="color: #2563eb;">${appUrl}</a>
          </p>
          <p>
            <strong>Usuario:</strong> ${email}<br/>
            <strong>Contrasena temporal:</strong> ${password}
          </p>
          <p>Puedes cambiar tu contrasena despues de ingresar si lo deseas.</p>
        </div>
      `
    });
    const emailWarning = "error" in emailResult && Boolean(emailResult.error);

    return NextResponse.json({ ok: true, emailWarning });
  } catch (error) {
    console.error("Error inesperado en API de creacion de usuarios:", error);
    return NextResponse.json({ error: getSafeErrorMessage(error, "No se pudo crear el usuario") }, { status: 500 });
  }
}

function buildPermissionRow(formData: FormData, profileId: string, moduleKey: ModuleKey, role: Role) {
  const canView = formData.get(`${moduleKey}:view`) === "on" || adminRoles.includes(role);
  const canCreate = formData.get(`${moduleKey}:create`) === "on" || adminRoles.includes(role);
  const canEdit = formData.get(`${moduleKey}:edit`) === "on" || adminRoles.includes(role);
  const canDelete = adminRoles.includes(role);

  return {
    profile_id: profileId,
    module_key: moduleKey,
    can_view: canView,
    can_create: canCreate,
    can_edit: canEdit,
    can_delete: canDelete
  };
}

function getSafeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
