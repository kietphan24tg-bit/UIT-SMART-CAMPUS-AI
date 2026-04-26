import type { RegisterRequest, UserProfile } from '@smart-campus/shared';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { usersApi } from '@/services/api';
import { authApi } from '@/services/api/auth';
import { syncPushToken, unregisterPushTokenFromBackend } from '@/services/notifications/push';

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

  setUser: (user: UserInfo | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  refreshProfile: () => Promise<UserInfo | null>;
}

const TOKEN_KEY = 'auth_access_token';
const REFRESH_KEY = 'auth_refresh_token';

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

  setUser: (user) => {
    set((state) => ({
      ...state,
      user,
      isAuthenticated: Boolean(state.accessToken && user),
    }));
  },

  login: async (email, password) => {
    const tokens = await authApi.login({ email, password });
    await SecureStore.setItemAsync(TOKEN_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);

    const user = await authApi.getMe(tokens.accessToken);
    set({ isHydrated: true, isAuthenticated: true, user, accessToken: tokens.accessToken });
    await syncPushTokenSafely();
  },

  register: async (data) => {
    const tokens = await authApi.register(data);
    await SecureStore.setItemAsync(TOKEN_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);

    const user = await authApi.getMe(tokens.accessToken);
    set({ isHydrated: true, isAuthenticated: true, user, accessToken: tokens.accessToken });
    await syncPushTokenSafely();
  },

  logout: async () => {
    await unregisterPushTokenFromBackend();
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    set({ isHydrated: true, isAuthenticated: false, user: null, accessToken: null });
  },

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        const user = await authApi.getMe(token);
        set({ isHydrated: true, isAuthenticated: true, user, accessToken: token });
        await syncPushTokenSafely();
        return;
      }

      set({ isHydrated: true, isAuthenticated: false, user: null, accessToken: null });
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_KEY);
      set({ isHydrated: true, isAuthenticated: false, user: null, accessToken: null });
    }
  },

  refreshProfile: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) {
      set({ isHydrated: true, isAuthenticated: false, user: null, accessToken: null });
      return null;
    }

    const user = await usersApi.getProfile();
    set({ isHydrated: true, isAuthenticated: true, user, accessToken: token });
    await syncPushTokenSafely();
    return user;
  },
}));
