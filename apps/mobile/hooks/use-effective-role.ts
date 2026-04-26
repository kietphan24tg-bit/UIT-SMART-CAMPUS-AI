import { useShallow } from 'zustand/react/shallow';

import { useAuthStore } from '@/stores/auth-store';
import { getEffectiveRole, getEffectiveUserForUi } from '@/utils/role-override';

export function useEffectiveRole() {
  return useAuthStore((s) => getEffectiveRole(s.user?.role, s.devRoleOverride));
}

/** Preview role merge returns a new object each read; shallow keeps the store snapshot stable for React. */
export function useEffectiveUser() {
  return useAuthStore(useShallow((s) => getEffectiveUserForUi(s.user, s.devRoleOverride)));
}
