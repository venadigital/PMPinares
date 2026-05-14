import { DataTable, StatusBadge } from "@/components/modules/data-table";
import { PageHeader } from "@/components/modules/page-header";
import { UserCreateForm } from "@/components/modules/user-create-form";
import { UserDeleteButton } from "@/components/modules/user-delete-button";
import { getCurrentProfile, getProfiles } from "@/lib/auth";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";

interface StakeholdersPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StakeholdersPage({ searchParams }: StakeholdersPageProps) {
  const params = searchParams ? await searchParams : {};
  const [users, currentProfile] = await Promise.all([getProfiles(), getCurrentProfile()]);
  const error = typeof params.error === "string" ? params.error : null;
  const created = params.created === "1";
  const emailWarning = params.emailWarning === "1";
  const deleted = params.deleted === "1";
  const canDeleteUsers = currentProfile.role === "Administrador Vena Digital";
  const configured = isSupabaseConfigured() && isSupabaseAdminConfigured();

  return (
    <>
      <PageHeader eyebrow="Usuarios y permisos" title="Stakeholders" description="Gestion de usuarios, roles, contrasena temporal y acceso granular por modulo." />
      {created ? <p className="mb-5 rounded-2xl bg-emerald-500/10 p-4 text-sm font-bold text-emerald-700">Usuario creado correctamente{emailWarning ? "." : " y la invitacion fue enviada por correo."}</p> : null}
      {emailWarning ? <p className="mb-5 rounded-2xl bg-gold/15 p-4 text-sm font-bold text-amber-700">El usuario fue creado, pero no se pudo enviar la invitacion por correo. Revisa la configuracion de Resend o comparte el acceso manualmente.</p> : null}
      {deleted ? <p className="mb-5 rounded-2xl bg-blueprint/10 p-4 text-sm font-bold text-blueprint">Usuario eliminado correctamente.</p> : null}
      {error ? <p className="mb-5 rounded-2xl bg-coral/10 p-4 text-sm font-bold text-coral">{error}</p> : null}
      <UserCreateForm configured={configured} />
      <DataTable columns={["Nombre", "Rol", "Organizacion", "Area", "Estado", "Modulos", "Acciones"]} rows={users.map((user) => [user.name, <StatusBadge key={user.id} value={user.role} />, user.organization, user.area, <StatusBadge key={`${user.id}-status`} value={user.status} />, user.moduleAccess.length, canDeleteUsers ? <UserDeleteButton key={`${user.id}-delete`} userId={user.id} disabled={user.id === currentProfile.id} /> : "Sin permiso"])} />
    </>
  );
}
