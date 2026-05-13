import { modules, areas } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { createUserAction } from "@/app/(dashboard)/stakeholders/actions";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";

export function UserCreateForm() {
  const configured = isSupabaseConfigured() && isSupabaseAdminConfigured();

  return (
    <Card className="mb-6">
      <CardHeader eyebrow="Administracion" title="Crear usuario" />
      {!configured ? (
        <p className="mb-5 rounded-xl bg-sun/20 p-3.5 text-sm font-medium text-ink">Modo demo: para crear usuarios reales configura `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`.</p>
      ) : null}
      <form action={createUserAction} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Nombre completo"><Input name="fullName" placeholder="Nombre del usuario" required /></Field>
          <Field label="Correo electronico"><Input name="email" type="email" placeholder="usuario@pinares.co" required /></Field>
          <Field label="Contrasena temporal"><Input name="temporaryPassword" type="text" minLength={8} placeholder="Minimo 8 caracteres" required /></Field>
          <label className="block space-y-2 text-sm font-medium text-ink">
            <span>Rol</span>
            <select name="role" className="focus-ring w-full rounded-xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-sm text-ink shadow-inner shadow-ink/5">
              <option>Stakeholder Pinares</option>
              <option>Administrador Pinares</option>
              <option>Administrador Vena Digital</option>
            </select>
          </label>
          <label className="block space-y-2 text-sm font-medium text-ink">
            <span>Organizacion</span>
            <select name="organization" className="focus-ring w-full rounded-xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-sm text-ink shadow-inner shadow-ink/5">
              <option>Pinares</option>
              <option>Vena Digital</option>
            </select>
          </label>
          <Field label="Cargo"><Input name="position" placeholder="Cargo o responsabilidad" /></Field>
          <label className="block space-y-2 text-sm font-medium text-ink xl:col-span-3">
            <span>Area</span>
            <select name="area" className="focus-ring w-full rounded-xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-sm text-ink shadow-inner shadow-ink/5">
              {areas.map((area) => <option key={area}>{area}</option>)}
            </select>
          </label>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-ink">Permisos por modulo</p>
          <div className="overflow-x-auto rounded-2xl border border-white/70 bg-white/45">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-[0.7rem] uppercase tracking-[0.14em] text-slate-500">
                  <th className="px-4 py-3">Modulo</th>
                  <th className="px-4 py-3">Ver</th>
                  <th className="px-4 py-3">Crear</th>
                  <th className="px-4 py-3">Editar</th>
                  <th className="px-4 py-3">Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((module) => (
                  <tr key={module.key} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-3"><span className="font-semibold text-ink">{module.label}</span><p className="text-xs text-slate-500">{module.description}</p></td>
                    {(["view", "create", "edit", "delete"] as const).map((permission) => (
                      <td key={permission} className="px-4 py-3"><input name={`${module.key}:${permission}`} type="checkbox" defaultChecked={permission === "view"} className="h-4 w-4 accent-blueprint" /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Button type="submit" variant="accent">Crear usuario y enviar invitacion</Button>
      </form>
    </Card>
  );
}
