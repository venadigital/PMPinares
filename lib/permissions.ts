import { modules, users } from "@/lib/data";
import type { ModuleKey, PermissionKey, Role, UserProfile } from "@/lib/types";

const deleteRoles: Role[] = ["Administrador Vena Digital", "Administrador Pinares"];

export function can(user: UserProfile, moduleKey: ModuleKey, permission: PermissionKey) {
  if (!user.moduleAccess.includes(moduleKey)) return false;
  if (permission === "delete") return deleteRoles.includes(user.role);
  if (user.role === "Stakeholder Pinares" && permission !== "view") return user.moduleAccess.includes(moduleKey);
  return true;
}

export const currentUser = users[0];

export function accessibleModules(user: UserProfile = currentUser) {
  return modules.filter((module) => user.moduleAccess.includes(module.key));
}
