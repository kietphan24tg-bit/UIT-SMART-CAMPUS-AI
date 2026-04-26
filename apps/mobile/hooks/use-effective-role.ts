import { USER_ROLES, type UserRole } from '@smart-campus/shared';

import { useAuthStore } from '@/stores/auth-store';

type EffectiveUser = {
  firstName?: string | null;
  lastName?: string | null;
  role?: UserRole | null;
} | null;

export function useEffectiveUser(): EffectiveUser {
  return useAuthStore((state) => state.user);
}

export function useEffectiveRole(): UserRole {
  const role = useAuthStore((state) => state.user?.role);
  return role ?? USER_ROLES.STUDENT;
}
