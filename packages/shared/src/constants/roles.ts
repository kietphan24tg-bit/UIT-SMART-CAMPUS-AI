export const USER_ROLES = {
  STUDENT: 'student',
  LECTURER: 'lecturer',
  CANTEEN_ADMIN: 'canteen_admin',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [USER_ROLES.STUDENT]: 0,
  [USER_ROLES.LECTURER]: 1,
  [USER_ROLES.CANTEEN_ADMIN]: 2,
  [USER_ROLES.ADMIN]: 3,
  [USER_ROLES.SUPER_ADMIN]: 4,
};
