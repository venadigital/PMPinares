import { cache } from "react";
import { modules as demoModules, users as demoUsers } from "@/lib/data";
import type { ModuleKey, PermissionKey, Role, UserProfile } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface PermissionRow {
  module_key: ModuleKey;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface DbProfile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  organization: "Vena Digital" | "Pinares";
  position: string | null;
  area: string | null;
  status: "Activo" | "Inactivo";
  module_permissions?: PermissionRow[];
}

export const getCurrentProfile = cache(async (): Promise<UserProfile> => {
  if (!isSupabaseConfigured()) return demoUsers[0];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return demoUsers[0];

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, organization, position, area, status, module_permissions(module_key, can_view)")
    .eq("id", user.id)
    .single<DbProfile>();

  if (!data) return demoUsers[0];

  return mapProfile(data);
});

export async function getProfiles() {
  if (!isSupabaseConfigured()) return demoUsers;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, organization, position, area, status, module_permissions(module_key, can_view, can_create, can_edit, can_delete)")
    .order("created_at", { ascending: false });

  if (error || !data) return demoUsers;
  return data.map((profile) => mapProfile(profile as DbProfile));
}

export async function getModulePermissions(profileId: string) {
  if (!isSupabaseConfigured()) {
    const demo = demoUsers.find((user) => user.id === profileId);
    return demoModules.map((module) => ({
      module_key: module.key,
      can_view: demo?.moduleAccess.includes(module.key) ?? false,
      can_create: demo?.moduleAccess.includes(module.key) ?? false,
      can_edit: demo?.moduleAccess.includes(module.key) ?? false,
      can_delete: demo?.role !== "Stakeholder Pinares"
    }));
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("module_permissions")
    .select("module_key, can_view, can_create, can_edit, can_delete")
    .eq("profile_id", profileId);

  return (data ?? []) as PermissionRow[];
}

export function hasPermission(profile: UserProfile, moduleKey: ModuleKey, permission: PermissionKey) {
  if (!profile.moduleAccess.includes(moduleKey)) return false;
  if (permission === "delete") return profile.role === "Administrador Vena Digital" || profile.role === "Administrador Pinares";
  return true;
}

function mapProfile(profile: DbProfile): UserProfile {
  return {
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    role: profile.role,
    organization: profile.organization,
    position: profile.position ?? "",
    area: profile.area ?? "",
    status: profile.status,
    moduleAccess: (profile.module_permissions ?? [])
      .filter((permission) => permission.can_view)
      .map((permission) => permission.module_key)
  };
}
