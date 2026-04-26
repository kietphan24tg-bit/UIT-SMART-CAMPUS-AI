import { USER_ROLES, type UserRole } from '@smart-campus/shared';
import Constants from 'expo-constants';

export const DEV_ROLE_OVERRIDE_KEY = 'dev.role.override.v1';
export const DEFAULT_UI_PREVIEW_ROLE: UserRole = USER_ROLES.LECTURER;

const ROLE_VALUES = new Set<string>(Object.values(USER_ROLES));

export function isUserRoleString(value: string): value is UserRole {
  return ROLE_VALUES.has(value);
}

export function isRoleUiPreviewEnabled(): boolean {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return true;
  }
  const fromEnv = process.env.EXPO_PUBLIC_UI_ROLE_PREVIEW;
  if (fromEnv === '1' || fromEnv === 'true' || fromEnv === 'yes') {
    return true;
  }
  const fromExtra = Constants.expoConfig?.extra as { uiRolePreview?: boolean } | undefined;
  if (fromExtra?.uiRolePreview) {
    return true;
  }
  return false;
}

function readPreviewRoleFromConfig(): UserRole | null {
  const fromEnv = process.env.EXPO_PUBLIC_UI_PREVIEW_ROLE;
  if (fromEnv && isUserRoleString(fromEnv)) {
    return fromEnv;
  }

  const fromExtra = Constants.expoConfig?.extra as { uiPreviewRole?: string } | undefined;
  if (fromExtra?.uiPreviewRole && isUserRoleString(fromExtra.uiPreviewRole)) {
    return fromExtra.uiPreviewRole;
  }

  return null;
}

export function getPreviewRoleOverride(devOverride: UserRole | null | undefined): UserRole | null {
  if (!isRoleUiPreviewEnabled()) {
    return null;
  }

  return devOverride ?? readPreviewRoleFromConfig() ?? DEFAULT_UI_PREVIEW_ROLE;
}

export function getEffectiveRole(
  userRole: string | null | undefined,
  devOverride: UserRole | null | undefined,
): string | null {
  const previewRole = getPreviewRoleOverride(devOverride);
  if (previewRole) {
    return previewRole;
  }
  return userRole ?? null;
}

const PREVIEW_USERS = {
  [USER_ROLES.LECTURER]: {
    id: 'preview-lecturer',
    email: 'lecturer@uit.edu.vn',
    firstName: 'Phúc',
    lastName: 'Nguyễn Hoàng',
    role: USER_ROLES.LECTURER,
    faculty: 'Khoa Công nghệ Phần mềm',
  },
  [USER_ROLES.STUDENT]: {
    id: 'preview-student',
    email: 'student@gm.uit.edu.vn',
    firstName: 'Nguyen',
    lastName: 'Van A',
    role: USER_ROLES.STUDENT,
    studentId: '22520001',
    faculty: 'Khoa Công nghệ Phần mềm',
    major: 'Công nghệ phần mềm',
    yearOfAdmission: 2022,
  },
} as const;

export function getEffectiveUserForUi<T extends { role?: string | null }>(
  user: T | null,
  devOverride: UserRole | null | undefined,
): T | null {
  const previewRole = getPreviewRoleOverride(devOverride);
  if (previewRole) {
    const previewUser = PREVIEW_USERS[previewRole as keyof typeof PREVIEW_USERS];
    if (previewUser) {
      return {
        ...(user ?? {}),
        ...previewUser,
      } as T;
    }
  }

  if (!user) {
    return null;
  }

  const nextRole = getEffectiveRole(user.role, devOverride);
  if (nextRole == null || nextRole === user.role) {
    return user;
  }
  return { ...user, role: nextRole };
}
