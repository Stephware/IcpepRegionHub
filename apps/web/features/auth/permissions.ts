import type { UserRole } from "./types";

export function canAccessRole(
  userRole: UserRole,
  allowedRoles?: UserRole[],
) {
  return !allowedRoles?.length || allowedRoles.includes(userRole);
}
