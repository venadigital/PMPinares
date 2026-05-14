"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { modules, areas } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";

export function UserCreateForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      temporaryPassword: String(formData.get("temporaryPassword") ?? ""),
      role: String(formData.get("role") ?? "Stakeholder Pinares"),
      organization: String(formData.get("organization") ?? "Pinares"),
      position: String(formData.get("position") ?? ""),
      area: String(formData.get("area") ?? ""),
      permissions: modules.map((module) => ({
        moduleKey: module.key,
        canView: formData.get(`${module.key}:view`) === "on",
        canCreate: formData.get(`${module.key}:create`) === "on",
        canEdit: formData.get(`${module.key}:edit`) === "on",
        canDelete: formData.get(`${module.key}:delete`) === "on"
      }))
    };

    startTransition(async () => {
      try {
        const response = await fetch("/api/stakeholders/users", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        const responseText = await response.text();
        const result = parseJsonResponse(responseText);

        if (!result) {
          setError(`La plataforma recibio una respuesta inesperada (${response.status}). Intenta recargar la pagina e iniciar sesion nuevamente.`);
          return;
        }

        if (!response.ok || result.error) {
          setError(result.error ?? "No se pudo crear el usuario");
          return;
        }

        form.reset();
        router.push(`/stakeholders?created=1${result.emailWarning ? "&emailWarning=1" : ""}`);
        router.refresh();
      } catch (requestError) {
        console.error("No se pudo completar la creacion del usuario:", requestError);
        setError("No se pudo crear el usuario. Intentalo nuevamente.");
      }
    });
  }

  return (
    <Card className="mb-6">
      <CardHeader eyebrow="Administracion" title="Crear usuario" />
      {!configured ? (
        <p className="mb-5 rounded-xl bg-sun/20 p-3.5 text-sm font-medium text-ink">Modo demo: para crear usuarios reales configura `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`.</p>
      ) : null}
      {error ? <p className="mb-5 rounded-2xl bg-coral/10 p-4 text-sm font-bold text-coral">{error}</p> : null}
      <form onSubmit={handleSubmit} className="space-y-6">
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
        <Button type="submit" variant="accent" disabled={isPending}>{isPending ? "Creando usuario..." : "Crear usuario y enviar invitacion"}</Button>
      </form>
    </Card>
  );
}

function parseJsonResponse(responseText: string) {
  try {
    return JSON.parse(responseText) as { ok?: boolean; error?: string; emailWarning?: boolean };
  } catch {
    return null;
  }
}
