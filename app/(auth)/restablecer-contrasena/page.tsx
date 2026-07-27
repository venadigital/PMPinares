import Link from "next/link";
import { AuthSplitLayout } from "@/components/modules/auth-split-layout";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { updateRecoveredPasswordAction } from "@/app/(auth)/login/actions";
import { createClient } from "@/lib/supabase/server";

interface ResetPasswordPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = searchParams ? await searchParams : {};
  const error = typeof params.error === "string" ? params.error : null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <AuthSplitLayout>
      <div className="glass-panel w-full max-w-md rounded-[26px] p-7">
        <div className="mb-7">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-blueprint">Seguridad de la cuenta</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-ink">Crear nueva contrasena</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Elige una contrasena de minimo 8 caracteres que puedas recordar y que no uses en otros servicios.
          </p>
        </div>

        {user ? (
          <>
            {error ? <p className="mb-5 rounded-2xl bg-coral/10 p-4 text-sm font-semibold text-coral">{error}</p> : null}
            <form action={updateRecoveredPasswordAction} className="space-y-5">
              <Field label="Nueva contrasena">
                <Input name="password" type="password" minLength={8} autoComplete="new-password" required />
              </Field>
              <Field label="Confirmar contrasena">
                <Input name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required />
              </Field>
              <Button type="submit" variant="accent" className="w-full">Guardar nueva contrasena</Button>
            </form>
          </>
        ) : (
          <div className="space-y-5">
            <p className="rounded-2xl bg-coral/10 p-4 text-sm leading-6 text-coral">
              El enlace de recuperacion vencio, ya fue utilizado o no es valido. Solicita un enlace nuevo para continuar.
            </p>
            <Link
              href="/login?mode=recuperar"
              className="focus-ring inline-flex w-full items-center justify-center rounded-full bg-sun px-4 py-2 text-sm font-semibold text-ink shadow-md shadow-sun/20 transition hover:-translate-y-px"
            >
              Solicitar enlace nuevo
            </Link>
          </div>
        )}
      </div>
    </AuthSplitLayout>
  );
}
