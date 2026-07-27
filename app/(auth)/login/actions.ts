"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const PRODUCTION_APP_URL = "https://pinarespm.venadigital.com.co";

async function getAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (host?.startsWith("localhost:") || host?.startsWith("127.0.0.1:")) {
    return `http://${host}`;
  }

  // Never send production password-recovery links back to a developer machine.
  return PRODUCTION_APP_URL;
}

export async function loginAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/dashboard?demo=1");
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard") || "/dashboard";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent("Correo o contrasena incorrectos")}`);
  }

  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!isSupabaseConfigured()) {
    redirect("/login?mode=recuperar&resetError=La recuperacion de contrasena requiere la conexion con Supabase");
  }

  if (!email || !email.includes("@")) {
    redirect("/login?mode=recuperar&resetError=Ingresa un correo electronico valido");
  }

  const supabase = await createClient();
  const redirectTo = `${await getAppUrl()}/auth/callback`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    redirect("/login?mode=recuperar&resetError=No fue posible enviar el enlace. Espera unos minutos e intentalo nuevamente");
  }

  // The same response is shown whether or not the account exists to avoid email enumeration.
  redirect("/login?mode=recuperar&resetSent=1");
}

export async function updateRecoveredPasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    redirect("/restablecer-contrasena?error=La contrasena debe tener minimo 8 caracteres");
  }

  if (password !== confirmPassword) {
    redirect("/restablecer-contrasena?error=Las contrasenas no coinciden");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?mode=recuperar&resetError=El enlace de recuperacion vencio o ya fue utilizado");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/restablecer-contrasena?error=No fue posible actualizar la contrasena. Solicita un enlace nuevo");
  }

  await supabase
    .from("profiles")
    .update({ temporary_password_changed: true })
    .eq("id", user.id);

  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?passwordUpdated=1");
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
