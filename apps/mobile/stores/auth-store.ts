import type { RegisterRequest, UserProfile, UserRole } from '@smart-campus/shared';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { usersApi } from '@/services/api';
import { authApi } from '@/services/api/auth';
import { syncPushToken, unregisterPushTokenFromBackend } from '@/services/notifications/push';
import { DEV_ROLE_OVERRIDE_KEY, isRoleUiPreviewEnabled, isUserRoleString } from '@/utils/role-override';

type UserInfo = Pick<UserProfile, 'id' | 'email' | 'firstName' | 'lastName' | 'role'> &
  Partial<
    Pick<
      UserProfile,
      | 'studentId'
      | 'avatarUrl'
      | 'phone'
      | 'address'
      | 'faculty'
      | 'major'
      | 'yearOfAdmission'
    >
  >;

interface AuthState {
  isHydrated: boolean;
  isAuthenticated: boolean;
  user: UserInfo | null;
  accessToken: string | null;
  devRoleOverride: UserRole | null;

  setUser: (user: UserInfo | null) => void;
  setDevRoleOverride: (next: UserRole | null) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  refreshProfile: () => Promise<UserInfo | null>;
}

const TOKEN_KEY = 'auth_access_token';
const REFRESH_KEY = 'auth_refresh_token';

async function readDevRoleOverrideFromStore(): Promise<UserRole | null> {
  if (!isRoleUiPreviewEnabled()) {
    return null;
  }
  try {
    const raw = await SecureStore.getItemAsync(DEV_ROLE_OVERRIDE_KEY);
    if (!raw || !isUserRoleString(raw)) {
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

async function syncPushTokenSafely() {
  try {
    await syncPushToken();
  } catch {
    // Best-effort sync: auth flow should continue even if push registration fails.
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  isHydrated: false,
  isAuthenticated: false,
  user: null,
  accessToken: null,
  devRoleOverride: null,

  setUser: (user) => {
    set((state) => ({
      ...state,
      user,
      isAuthenticated: Boolean(state.accessToken && user),
    }));
  },

  setDevRoleOverride: async (next) => {
    if (!isRoleUiPreviewEnabled()) {
      return;
    }
    try {
      if (next) {
        await SecureStore.setItemAsync(DEV_ROLE_OVERRIDE_KEY, next);
      } else {
        await SecureStore.deleteItemAsync(DEV_ROLE_OVERRIDE_KEY);
      }
    } catch {
      // best-effort
    }
    set((state) => ({ ...state, devRoleOverride: next }));
  },

  login: async (email, password) => {
    const tokens = await authApi.login({ email, password });
    await SecureStore.setItemAsync(TOKEN_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);

    const user = await authApi.getMe(tokens.accessToken);
    const devRoleOverride = await readDevRoleOverrideFromStore();
    set({ isHydrated: true, isAuthenticated: true, user, accessToken: tokens.accessToken, devRoleOverride });
    await syncPushTokenSafely();
  },

  register: async (data) => {
    const tokens = await authApi.register(data);
    await SecureStore.setItemAsync(TOKEN_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);

    const user = await authApi.getMe(tokens.accessToken);
    const devRoleOverride = await readDevRoleOverrideFromStore();
    set({ isHydrated: true, isAuthenticated: true, user, accessToken: tokens.accessToken, devRoleOverride });
    await syncPushTokenSafely();
  },

  logout: async () => {
    await unregisterPushTokenFromBackend();
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    set((state) => ({
      isHydrated: true,
      isAuthenticated: false,
      user: null,
      accessToken: null,
      devRoleOverride: state.devRoleOverride,
    }));
  },

  hydrate: async () => {
    const devRoleOverride = await readDevRoleOverrideFromStore();
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        const user = await authApi.getMe(token);
        set({ isHydrated: true, isAuthenticated: true, user, accessToken: token, devRoleOverride });
        await syncPushTokenSafely();
        return;
      }

      set({ isHydrated: true, isAuthenticated: false, user: null, accessToken: null, devRoleOverride });
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_KEY);
      set({ isHydrated: true, isAuthenticated: false, user: null, accessToken: null, devRoleOverride });
    }
  },

  refreshProfile: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) {
      set((state) => ({
        isHydrated: true,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        devRoleOverride: state.devRoleOverride,
      }));
      return null;
    }

    const user = await usersApi.getProfile();
    set((state) => ({
      isHydrated: true,
      isAuthenticated: true,
      user,
      accessToken: token,
      devRoleOverride: state.devRoleOverride,
    }));
    await syncPushTokenSafely();
    return user;
  },
}));
