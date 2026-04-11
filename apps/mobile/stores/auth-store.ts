import type { RegisterRequest, UserProfile } from '@smart-campus/shared';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { usersApi } from '@/services/api';
import { authApi } from '@/services/api/auth';

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

export const useAuthStore = create<AuthState>((set) => ({
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

  refreshProfile: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) {
      set({ isAuthenticated: false, user: null, accessToken: null });
      return null;
    }

    const user = await usersApi.getProfile();
    set({ isAuthenticated: true, user, accessToken: token });
    return user;
  },
}));
