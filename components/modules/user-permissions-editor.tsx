import { updateUserPermissionsAction } from "@/app/(dashboard)/stakeholders/actions";
import { modules } from "@/lib/data";
import type { PermissionKey, UserProfile } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

const permissionLabels: Record<PermissionKey, string> = {
  view: "Ver",
  create: "Crear",
  edit: "Editar",
  delete: "Eliminar"
};

const permissions: PermissionKey[] = ["view", "create", "edit", "delete"];

export function UserPermissionsEditor({ users, currentUserId, canEdit }: { users: UserProfile[]; currentUserId: string; canEdit: boolean }) {
  if (!canEdit) return null;

  return (
    <Card className="mb-6 overflow-hidden border-white/80 bg-white/75 p-0">
      <div className="border-b border-white/70 p-5">
        <CardHeader eyebrow="Acceso granular" title="Editar permisos por usuario" action={<Badge tone="blue">{users.length} usuarios</Badge>} />
        <p className="text-sm leading-6 text-slate-600">Ajusta que modulos puede ver, crear, editar o eliminar cada usuario creado en la plataforma.</p>
      </div>
      <div className="grid gap-3 p-4 sm:p-5">
        {users.map((user) => (
          <details key={user.id} className="group rounded-[1.15rem] border border-white/80 bg-white/70 p-4 shadow-sm shadow-ink/5">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{user.name}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{user.email} - {user.role}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={user.id === currentUserId ? "yellow" : "neutral"}>{user.moduleAccess.length} modulos</Badge>
                <span className="rounded-full bg-blueprint/10 px-3 py-1 text-xs font-semibold text-blueprint transition group-open:rotate-180">v</span>
              </div>
            </summary>

            <form action={updateUserPermissionsAction} className="mt-4 border-t border-white/70 pt-4">
              <input type="hidden" name="profileId" value={user.id} />
              {user.id === currentUserId ? (
                <p className="mb-4 rounded-2xl bg-sun/15 p-3 text-sm font-semibold text-amber-700">Por seguridad, tus propios permisos no se editan desde esta pantalla.</p>
              ) : null}
              <div className="overflow-x-auto rounded-2xl border border-white/80 bg-white/55">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-ink/10 text-[0.68rem] uppercase tracking-[0.14em] text-slate-500">
                      <th className="px-4 py-3">Modulo</th>
                      {permissions.map((permission) => <th key={permission} className="px-4 py-3 text-center">{permissionLabels[permission]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((module) => {
                      const currentPermission = user.modulePermissions?.find((item) => item.moduleKey === module.key);
                      return (
                        <tr key={module.key} className="border-b border-ink/5 last:border-0">
                          <td className="px-4 py-3">
                            <span className="font-semibold text-ink">{module.label}</span>
                            <p className="mt-0.5 text-xs text-slate-500">{module.description}</p>
                          </td>
                          <PermissionCheckbox name={`${module.key}:view`} checked={Boolean(currentPermission?.canView)} disabled={user.id === currentUserId} />
                          <PermissionCheckbox name={`${module.key}:create`} checked={Boolean(currentPermission?.canCreate)} disabled={user.id === currentUserId} />
                          <PermissionCheckbox name={`${module.key}:edit`} checked={Boolean(currentPermission?.canEdit)} disabled={user.id === currentUserId} />
                          <PermissionCheckbox name={`${module.key}:delete`} checked={Boolean(currentPermission?.canDelete)} disabled={user.id === currentUserId} />
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <Button type="submit" variant="accent" disabled={user.id === currentUserId}>Guardar permisos</Button>
              </div>
            </form>
          </details>
        ))}
      </div>
    </Card>
  );
}

function PermissionCheckbox({ name, checked, disabled }: { name: string; checked: boolean; disabled: boolean }) {
  return (
    <td className="px-4 py-3 text-center">
      <input name={name} type="checkbox" defaultChecked={checked} disabled={disabled} className="h-4 w-4 rounded border-slate-300 accent-blueprint disabled:opacity-40" />
    </td>
  );
}
