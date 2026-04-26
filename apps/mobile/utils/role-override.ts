import { USER_ROLES, type UserRole } from '@smart-campus/shared';

const VALID_ROLE_SET = new Set<UserRole>(Object.values(USER_ROLES));

export function getPreviewRoleOverride(role: string | null | undefined): UserRole | null {
  if (!role) {
    return null;
  }

  return VALID_ROLE_SET.has(role as UserRole) ? (role as UserRole) : null;
}
