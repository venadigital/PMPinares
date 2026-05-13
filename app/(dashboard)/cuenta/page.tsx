import { PageHeader } from "@/components/modules/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth";
import { updatePasswordAction } from "@/app/(dashboard)/cuenta/actions";

interface AccountPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = searchParams ? await searchParams : {};
  const profile = await getCurrentProfile();
  const error = typeof params.error === "string" ? params.error : null;
  const updated = params.updated === "1";
  const demo = params.demo === "1";

  return (
    <>
      <PageHeader eyebrow="Cuenta" title="Mi cuenta" description="Consulta tu perfil y cambia tu contrasena temporal si lo deseas." />
      {updated ? <p className="mb-5 rounded-2xl bg-emerald-500/10 p-4 text-sm font-bold text-emerald-700">Contrasena actualizada correctamente.</p> : null}
      {demo ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Modo demo: configura Supabase para cambiar contrasenas reales.</p> : null}
      {error ? <p className="mb-5 rounded-2xl bg-coral/10 p-4 text-sm font-bold text-coral">{error}</p> : null}
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader eyebrow="Perfil" title={profile.name} />
          <dl className="space-y-4 text-sm">
            <div><dt className="font-bold text-slate-500">Correo</dt><dd className="font-semibold text-ink">{profile.email}</dd></div>
            <div><dt className="font-bold text-slate-500">Rol</dt><dd className="font-semibold text-ink">{profile.role}</dd></div>
            <div><dt className="font-bold text-slate-500">Organizacion</dt><dd className="font-semibold text-ink">{profile.organization}</dd></div>
            <div><dt className="font-bold text-slate-500">Area</dt><dd className="font-semibold text-ink">{profile.area}</dd></div>
          </dl>
        </Card>
        <Card>
          <CardHeader eyebrow="Seguridad" title="Cambiar contrasena" />
          <form action={updatePasswordAction} className="space-y-5">
            <Field label="Nueva contrasena"><Input name="password" type="password" minLength={8} required /></Field>
            <Field label="Confirmar contrasena"><Input name="confirmPassword" type="password" minLength={8} required /></Field>
            <Button type="submit" variant="accent">Actualizar contrasena</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
