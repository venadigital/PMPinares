"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { modules } from "@/lib/data";
import { sendProjectEmail } from "@/lib/email";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import type { ModuleKey, Role } from "@/lib/types";

const adminRoles: Role[] = ["Administrador Vena Digital", "Administrador Pinares"];
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pinarespm.venadigital.com.co/";

export async function createUserAction(formData: FormData) {
  try {
    await createUser(formData);
  } catch (error) {
    unstable_rethrow(error);
    console.error("Error inesperado creando usuario:", error);
    redirect(`/stakeholders?error=${encodeURIComponent(getSafeErrorMessage(error, "No se pudo crear el usuario"))}`);
  }
}

async function createUser(formData: FormData) {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    redirect("/stakeholders?error=Configura Supabase y SUPABASE_SERVICE_ROLE_KEY para crear usuarios reales");
  }

  const currentProfile = await getCurrentProfile();
  if (currentProfile.role !== "Administrador Vena Digital") {
    redirect("/stakeholders?error=Solo Administrador Vena Digital puede crear usuarios");
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("temporaryPassword") ?? "");
  const role = String(formData.get("role") ?? "Stakeholder Pinares") as Role;
  const organization = String(formData.get("organization") ?? "Pinares") as "Vena Digital" | "Pinares";
  const position = String(formData.get("position") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();

  if (!fullName || !email || password.length < 8) {
    redirect("/stakeholders?error=Nombre, correo y contrasena temporal de minimo 8 caracteres son obligatorios");
  }

  const admin = createAdminClient();
  const { data: createdUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role }
  });

  if (authError || !createdUser.user) {
    redirect(`/stakeholders?error=${encodeURIComponent(authError?.message ?? "No se pudo crear el usuario")}`);
  }

  const userId = createdUser.user.id;
  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    full_name: fullName,
    email,
    role,
    organization,
    position,
    area,
    status: "Activo"
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    redirect(`/stakeholders?error=${encodeURIComponent(profileError.message)}`);
  }

  const permissions = modules.map((module) => buildPermissionRow(formData, userId, module.key, role));
  const { error: permissionError } = await admin.from("module_permissions").insert(permissions);

  if (permissionError) {
    await admin.auth.admin.deleteUser(userId);
    redirect(`/stakeholders?error=${encodeURIComponent(permissionError.message)}`);
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

  revalidatePath("/stakeholders");
  redirect(emailWarning ? "/stakeholders?created=1&emailWarning=1" : "/stakeholders?created=1");
}

export async function deleteUserAction(formData: FormData) {
  try {
    await deleteUser(formData);
  } catch (error) {
    unstable_rethrow(error);
    console.error("Error inesperado eliminando usuario:", error);
    redirect(`/stakeholders?error=${encodeURIComponent(getSafeErrorMessage(error, "No se pudo eliminar el usuario"))}`);
  }
}

async function deleteUser(formData: FormData) {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    redirect("/stakeholders?error=Configura Supabase y SUPABASE_SERVICE_ROLE_KEY para eliminar usuarios reales");
  }

  const currentProfile = await getCurrentProfile();
  if (currentProfile.role !== "Administrador Vena Digital") {
    redirect("/stakeholders?error=Solo Administrador Vena Digital puede eliminar usuarios");
  }

  const userId = String(formData.get("userId") ?? "");
  if (!userId) {
    redirect("/stakeholders?error=No se encontro el usuario a eliminar");
  }

  if (userId === currentProfile.id) {
    redirect("/stakeholders?error=No puedes eliminar tu propio usuario administrador");
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    redirect(`/stakeholders?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/stakeholders");
  redirect("/stakeholders?deleted=1");
}

function getSafeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
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
