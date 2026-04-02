import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { authApi } from '@/services/api/auth';
import type { RegisterRequest } from '@smart-campus/shared';

interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  studentId?: string;
  role: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  accessToken: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

const TOKEN_KEY = 'auth_access_token';
const REFRESH_KEY = 'auth_refresh_token';

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  accessToken: null,

  login: async (email, password) => {
    const tokens = await authApi.login({ email, password });
    await SecureStore.setItemAsync(TOKEN_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);

    const user = await authApi.getMe(tokens.accessToken);
    set({ isAuthenticated: true, user, accessToken: tokens.accessToken });
  },

  register: async (data) => {
    const tokens = await authApi.register(data);
    await SecureStore.setItemAsync(TOKEN_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);

    const user = await authApi.getMe(tokens.accessToken);
    set({ isAuthenticated: true, user, accessToken: tokens.accessToken });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    set({ isAuthenticated: false, user: null, accessToken: null });
  },

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        const user = await authApi.getMe(token);
        set({ isAuthenticated: true, user, accessToken: token });
      }
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_KEY);
    }
  },
}));
