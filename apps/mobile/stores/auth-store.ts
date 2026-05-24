import type { RegisterRequest } from '@smart-campus/shared';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { usersApi } from '@/services/api';
import { authApi } from '@/services/api/auth';
import { registerAuthSessionHandlers } from '@/services/api/auth-session';
import { isSessionInvalidatedError } from '@/services/api/client';
import { prefetchAvatarUrl } from '@/services/avatar-cache';
import {
  clearCachedExpoPushToken,
  unregisterPushTokenFromBackend,
} from '@/services/notifications/push';
import { clearAppQueryState } from '@/services/query-client';
import {
  clearStoredAuthUser,
  readStoredAuthUser,
  type StoredAuthUser,
  writeStoredAuthUser,
} from '@/services/storage/local-storage';

type UserInfo = StoredAuthUser;

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

async function clearStoredSessionState() {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
    clearStoredAuthUser(),
    clearAppQueryState(),
    clearCachedExpoPushToken(),
  ]);
}

function setAuthenticatedState(
  set: (nextState: Partial<AuthState>) => void,
  user: UserInfo,
  accessToken: string,
) {
  set({
    isHydrated: true,
    isAuthenticated: true,
    user,
    accessToken,
  });
}

function setUnauthenticatedState(
  set: (nextState: Partial<AuthState>) => void,
  accessToken: string | null = null,
) {
  set({
    isHydrated: true,
    isAuthenticated: false,
    user: null,
    accessToken,
  });
}

async function persistUserSnapshot(user: UserInfo) {
  await writeStoredAuthUser(user);
  void prefetchAvatarUrl(user.avatarUrl);
}

export const useAuthStore = create<AuthState>((set) => ({
  isHydrated: false,
  isAuthenticated: false,
  user: null,
  accessToken: null,

  setUser: (user) => {
    if (user) {
      void persistUserSnapshot(user);
    } else {
      void clearStoredAuthUser();
    }

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
    await persistUserSnapshot(user);
    setAuthenticatedState(set, user, tokens.accessToken);
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
    await persistUserSnapshot(user);
    setAuthenticatedState(set, user, tokens.accessToken);
  },

  logout: async () => {
    await unregisterPushTokenFromBackend();
    setUnauthenticatedState(set);
    await clearStoredSessionState();
  },

  hydrate: async () => {
    try {
      const [token, cachedUser] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        readStoredAuthUser(),
      ]);

      if (!token) {
        await Promise.all([clearStoredAuthUser(), clearAppQueryState()]);
        setUnauthenticatedState(set);
        return;
      }

      if (cachedUser) {
        void prefetchAvatarUrl(cachedUser.avatarUrl);
        setAuthenticatedState(set, cachedUser, token);
      }

      try {
        const user = await usersApi.getProfile();
        await persistUserSnapshot(user);
        const latestToken = await SecureStore.getItemAsync(TOKEN_KEY);
        setAuthenticatedState(set, user, latestToken ?? token);
        return;
      } catch (error) {
        if (isSessionInvalidatedError(error)) {
          await clearStoredSessionState();
          setUnauthenticatedState(set);
          return;
        }

        if (cachedUser) {
          const latestToken = await SecureStore.getItemAsync(TOKEN_KEY);
          setAuthenticatedState(set, cachedUser, latestToken ?? token);
          return;
        }

        setUnauthenticatedState(set, token);
      }
    } catch {
      await clearStoredSessionState();
      setUnauthenticatedState(set);
    }
  },

  refreshProfile: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) {
      setUnauthenticatedState(set);
      return null;
    }

    try {
      const user = await usersApi.getProfile();
      await persistUserSnapshot(user);
      const latestToken = await SecureStore.getItemAsync(TOKEN_KEY);
      setAuthenticatedState(set, user, latestToken ?? token);
      return user;
    } catch (error) {
      if (isSessionInvalidatedError(error)) {
        await clearStoredSessionState();
        setUnauthenticatedState(set);
        return null;
      }

      throw error;
    }
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
    void SecureStore.deleteItemAsync(TOKEN_KEY);
    void SecureStore.deleteItemAsync(REFRESH_KEY);
    void clearStoredAuthUser();
    void clearAppQueryState();
    void clearCachedExpoPushToken();
    useAuthStore.setState({
      isHydrated: true,
      isAuthenticated: false,
      user: null,
      accessToken: null,
    });
  },
});
