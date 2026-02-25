import type { Session } from "next-auth";

export type Permission =
  | "can_manage_leads"
  | "can_do_analysis"
  | "can_manage_operations"
  | "can_manage_finance"
  | "can_manage_team"
  | "can_manage_onboarding";

export function hasPermission(
  session: Session | null,
  permission: Permission
): boolean {
  if (!session?.user) return false;
  if (session.user.role !== "MANAGER") return false;
  if (session.user.permissions?.is_super_admin) return true;
  return session.user.permissions?.[permission] === true;
}

export function hasAnyPermission(
  session: Session | null,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(session, p));
}
