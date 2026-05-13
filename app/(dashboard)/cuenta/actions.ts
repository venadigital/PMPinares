"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function updatePasswordAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/cuenta?demo=1");
  }

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8 || password !== confirmPassword) {
    redirect("/cuenta?error=La contrasena debe tener minimo 8 caracteres y coincidir con la confirmacion");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/cuenta?error=${encodeURIComponent(error.message)}`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("profiles").update({ temporary_password_changed: true }).eq("id", user.id);
  }

  redirect("/cuenta?updated=1");
}
