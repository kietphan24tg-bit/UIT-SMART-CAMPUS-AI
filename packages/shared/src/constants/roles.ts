export const USER_ROLES = {
  STUDENT: 'student',
  LECTURER: 'lecturer',
  CANTEEN_ADMIN: 'canteen_admin',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ACTIVE_USER_ROLES = [
  USER_ROLES.STUDENT,
  USER_ROLES.LECTURER,
  USER_ROLES.ADMIN,
] as const;

export type ActiveUserRole = (typeof ACTIVE_USER_ROLES)[number];

export const LEGACY_USER_ROLES = [USER_ROLES.CANTEEN_ADMIN, USER_ROLES.SUPER_ADMIN] as const;

export type LegacyUserRole = (typeof LEGACY_USER_ROLES)[number];

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [USER_ROLES.STUDENT]: 0,
  [USER_ROLES.LECTURER]: 1,
  [USER_ROLES.CANTEEN_ADMIN]: 2,
  [USER_ROLES.ADMIN]: 3,
  [USER_ROLES.SUPER_ADMIN]: 4,
};

export function isActiveUserRole(role?: string | null): role is ActiveUserRole {
  return ACTIVE_USER_ROLES.includes(role as ActiveUserRole);
}

export function isLegacyUserRole(role?: string | null): role is LegacyUserRole {
  return LEGACY_USER_ROLES.includes(role as LegacyUserRole);
}
