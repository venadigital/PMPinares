import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const RECOVERY_PATH = "/restablecer-contrasena";
const PRODUCTION_APP_URL = "https://pinarespm.venadigital.com.co";

function isInternalHost(host: string) {
  const normalizedHost = host.toLowerCase().split(":")[0];
  return normalizedHost === "0.0.0.0" || normalizedHost === "::" || normalizedHost === "[::]";
}

function getPublicAppUrl(request: NextRequest) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");

  if (configuredUrl) {
    try {
      const configuredHost = new URL(configuredUrl).hostname;

      if (!isInternalHost(configuredHost)) {
        return configuredUrl;
      }
    } catch {
      // Ignore malformed environment values and fall back to the public host.
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host");

  if (forwardedHost && !isInternalHost(forwardedHost)) {
    const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, "");
  }

  return PRODUCTION_APP_URL;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const publicAppUrl = getPublicAppUrl(request);
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
    const loginUrl = new URL("/login", `${publicAppUrl}/`);
    loginUrl.searchParams.set("mode", "recuperar");
    loginUrl.searchParams.set("resetError", "El enlace de recuperacion vencio, ya fue utilizado o no es valido");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(RECOVERY_PATH, `${publicAppUrl}/`));
}
