import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const RECOVERY_PATH = "/restablecer-contrasena";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const providerError = url.searchParams.get("error_description");
  const supabase = await createClient();

  let authError: Error | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
  } else if (tokenHash && type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    authError = error;
  } else {
    authError = new Error(providerError ?? "Enlace de recuperacion invalido");
  }

  if (authError) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("mode", "recuperar");
    loginUrl.searchParams.set("resetError", "El enlace de recuperacion vencio, ya fue utilizado o no es valido");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(RECOVERY_PATH, request.url));
}
