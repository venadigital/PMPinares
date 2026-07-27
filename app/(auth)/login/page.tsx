import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { AuthSplitLayout } from "@/components/modules/auth-split-layout";
import { loginAction, requestPasswordResetAction } from "@/app/(auth)/login/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface LoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const error = typeof params.error === "string" ? params.error : null;
  const resetError = typeof params.resetError === "string" ? params.resetError : null;
  const next = typeof params.next === "string" ? params.next : "/dashboard";
  const recoveryMode = params.mode === "recuperar";
  const resetSent = params.resetSent === "1";
  const passwordUpdated = params.passwordUpdated === "1";
  const isConfigured = isSupabaseConfigured();

  return (
    <AuthSplitLayout>
      <div className="glass-panel w-full max-w-md rounded-[26px] p-7">
        {recoveryMode ? (
          <>
            <div className="mb-7">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-blueprint">Seguridad de la cuenta</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-ink">Recuperar contrasena</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Ingresa el correo asociado a tu usuario. Recibiras un enlace seguro para crear una nueva contrasena.
              </p>
            </div>
            {resetSent ? (
              <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-800">
                Si el correo esta registrado, recibiras un enlace de recuperacion en los proximos minutos. Revisa tambien la carpeta de spam.
              </div>
            ) : null}
            {resetError ? <p className="mb-5 rounded-2xl bg-coral/10 p-4 text-sm font-semibold text-coral">{resetError}</p> : null}
            {!resetSent ? (
              <form action={requestPasswordResetAction} className="space-y-5">
                <Field label="Correo electronico">
                  <Input name="email" type="email" placeholder="usuario@pinares.co" autoComplete="email" required />
                </Field>
                <Button type="submit" variant="accent" className="w-full">Enviar enlace de recuperacion</Button>
              </form>
            ) : null}
            <Link
              href="/login"
              className="focus-ring mt-5 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white/70 hover:text-ink"
            >
              Volver a ingresar
            </Link>
          </>
        ) : (
          <>
            <div className="mb-7">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-blueprint">Acceso privado</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-ink">Ingresar</h2>
              <p className="mt-2 text-sm text-slate-600">Usa el correo y la contrasena temporal asignada por Vena Digital.</p>
            </div>
            {passwordUpdated ? (
              <p className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-800">
                Contrasena actualizada correctamente. Ya puedes ingresar con tu nueva contrasena.
              </p>
            ) : null}
            {error ? <p className="mb-5 rounded-2xl bg-coral/10 p-4 text-sm font-semibold text-coral">{error}</p> : null}
            <form action={loginAction} className="space-y-5">
              <input type="hidden" name="next" value={next} />
              <Field label="Correo electronico">
                <Input name="email" type="email" placeholder="usuario@pinares.co" autoComplete="email" required />
              </Field>
              <div>
                <Field label="Contrasena">
                  <Input name="password" type="password" placeholder="Contrasena temporal" autoComplete="current-password" required />
                </Field>
                <div className="mt-2 text-right">
                  <Link href="/login?mode=recuperar" className="focus-ring rounded-md text-sm font-semibold text-blueprint hover:underline">
                    Olvidaste tu contrasena?
                  </Link>
                </div>
              </div>
              <Button type="submit" variant="accent" className="w-full">Entrar a la plataforma</Button>
            </form>
            {!isConfigured ? (
              <p className="mt-6 rounded-2xl bg-blueprint/10 p-4 text-xs leading-5 text-slate-600">
                Modo demo activo: configura `.env.local` con Supabase para activar autenticacion real. Mientras tanto, el boton entra al dashboard demo.
              </p>
            ) : null}
          </>
        )}
      </div>
    </AuthSplitLayout>
  );
}
