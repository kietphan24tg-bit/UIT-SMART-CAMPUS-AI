import type { RegisterRequest, UserProfile } from '@smart-campus/shared';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { usersApi } from '@/services/api';
import { authApi } from '@/services/api/auth';
import { registerAuthSessionHandlers } from '@/services/api/auth-session';
import { tryRefreshAccessToken } from '@/services/api/client';
import {
  clearCachedExpoPushToken,
  unregisterPushTokenFromBackend,
} from '@/services/notifications/push';
import { appQueryClient } from '@/services/query-client';

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

async function logStoredTokens(context: 'login' | 'register') {
  if (!__DEV__) {
    return;
  }

  const [storedAccessTokenAfterLogin, storedRefreshTokenAfterLogin] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);

  console.warn(`[auth-store] ${context} token persistence`, {
    storedAccessTokenAfterLogin: Boolean(storedAccessTokenAfterLogin),
    storedRefreshTokenAfterLogin: Boolean(storedRefreshTokenAfterLogin),
  });
}

async function clearSessionQueries() {
  await appQueryClient.cancelQueries();
  appQueryClient.clear();
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
    if (__DEV__) {
      console.warn('[auth-store] login token response', {
        receivedAccessToken: Boolean(tokens.accessToken),
        receivedRefreshToken: Boolean(tokens.refreshToken),
      });
    }
    await SecureStore.setItemAsync(TOKEN_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
    await logStoredTokens('login');

    const user = await authApi.getMe(tokens.accessToken);
    set({ isHydrated: true, isAuthenticated: true, user, accessToken: tokens.accessToken });
  },

  register: async (data) => {
    const tokens = await authApi.register(data);
    if (__DEV__) {
      console.warn('[auth-store] register token response', {
        receivedAccessToken: Boolean(tokens.accessToken),
        receivedRefreshToken: Boolean(tokens.refreshToken),
      });
    }
    await SecureStore.setItemAsync(TOKEN_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
    await logStoredTokens('register');

    const user = await authApi.getMe(tokens.accessToken);
    set({ isHydrated: true, isAuthenticated: true, user, accessToken: tokens.accessToken });
  },

  logout: async () => {
    await unregisterPushTokenFromBackend();
    set({ isHydrated: true, isAuthenticated: false, user: null, accessToken: null });
    await clearSessionQueries();
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await clearCachedExpoPushToken();
  },

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        let user: UserInfo;

        try {
          user = await usersApi.getProfile();
        } catch {
          const refreshedAccessToken = await tryRefreshAccessToken();
          if (!refreshedAccessToken) {
            throw new Error('Không thể khôi phục phiên đăng nhập. Vui lòng đăng nhập lại.');
          }

          user = await authApi.getMe(refreshedAccessToken);
        }

        const latestToken = await SecureStore.getItemAsync(TOKEN_KEY);
        set({
          isHydrated: true,
          isAuthenticated: true,
          user,
          accessToken: latestToken ?? token,
        });
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
    const latestToken = await SecureStore.getItemAsync(TOKEN_KEY);
    set({
      isHydrated: true,
      isAuthenticated: true,
      user,
      accessToken: latestToken ?? token,
    });
    return user;
  },
}));

registerAuthSessionHandlers({
  onAccessTokenUpdated: (accessToken) => {
    useAuthStore.setState((state) => ({
      ...state,
      accessToken,
      isAuthenticated: Boolean(accessToken && state.user),
    }));
  },
  onSessionInvalidated: () => {
    void clearSessionQueries();
    void clearCachedExpoPushToken();
    useAuthStore.setState({
      isHydrated: true,
      isAuthenticated: false,
      user: null,
      accessToken: null,
    });
  },
});
