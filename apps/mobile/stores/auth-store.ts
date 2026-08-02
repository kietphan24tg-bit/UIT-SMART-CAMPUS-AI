import { normalizeEmail } from '@smart-campus/shared';
import type { AuthTokens, RegisterRequest, RegistrationChallenge } from '@smart-campus/shared';
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
import { createRegistrationSessionSetupError } from '@/utils/auth-errors';

type UserInfo = StoredAuthUser;

export interface PendingRegistration {
  challenge: RegistrationChallenge;
  expiresAtMs: number;
  resendAvailableAtMs: number;
}

const STALE_REGISTRATION_BACKEND_MESSAGE =
  'Máy chủ hiện tại vẫn đang chạy luồng đăng ký cũ. Cần deploy backend xác thực OTP trước khi tạo tài khoản mới.';
const INVALID_REGISTRATION_CHALLENGE_MESSAGE =
  'Phản hồi xác thực đăng ký không hợp lệ. Vui lòng cập nhật backend rồi thử lại.';

interface AuthState {
  isHydrated: boolean;
  isAuthenticated: boolean;
  user: UserInfo | null;
  accessToken: string | null;
  pendingRegistration: PendingRegistration | null;

  setUser: (user: UserInfo | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<RegistrationChallenge>;
  verifyRegistrationOtp: (otp: string) => Promise<void>;
  resendRegistrationOtp: () => Promise<RegistrationChallenge>;
  clearPendingRegistration: () => void;
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
    pendingRegistration: null,
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
    pendingRegistration: null,
  });
}

function isFiniteTimestamp(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isRegistrationChallengeShape(value: unknown): value is RegistrationChallenge {
  if (typeof value !== 'object' || value == null) {
    return false;
  }

  const candidate = value as Partial<RegistrationChallenge>;
  return (
    typeof candidate.challengeId === 'string' &&
    candidate.challengeId.trim().length > 0 &&
    typeof candidate.maskedEmail === 'string' &&
    candidate.maskedEmail.trim().length > 0 &&
    isFiniteTimestamp(candidate.expiresInSeconds) &&
    isFiniteTimestamp(candidate.resendAvailableInSeconds) &&
    (candidate.delivery === 'email' || candidate.delivery === 'preview')
  );
}

function isLegacyRegisterTokensShape(value: unknown): value is AuthTokens {
  if (typeof value !== 'object' || value == null) {
    return false;
  }

  const candidate = value as Partial<AuthTokens>;
  return (
    typeof candidate.accessToken === 'string' &&
    candidate.accessToken.trim().length > 0 &&
    typeof candidate.refreshToken === 'string' &&
    candidate.refreshToken.trim().length > 0
  );
}

function toPendingRegistration(challenge: unknown, nowMs = Date.now()): PendingRegistration {
  if (isRegistrationChallengeShape(challenge)) {
    return {
      challenge,
      expiresAtMs: nowMs + challenge.expiresInSeconds * 1_000,
      resendAvailableAtMs: nowMs + challenge.resendAvailableInSeconds * 1_000,
    };
  }

  if (isLegacyRegisterTokensShape(challenge)) {
    throw new Error(STALE_REGISTRATION_BACKEND_MESSAGE);
  }

  throw new Error(INVALID_REGISTRATION_CHALLENGE_MESSAGE);
}

function createPendingRegistration(
  challenge: RegistrationChallenge,
  nowMs = Date.now(),
): PendingRegistration {
  return toPendingRegistration(challenge, nowMs);
}

async function persistUserSnapshot(user: UserInfo) {
  await writeStoredAuthUser(user);
  void prefetchAvatarUrl(user.avatarUrl);
}

async function completeAuthentication(
  set: (nextState: Partial<AuthState>) => void,
  tokens: AuthTokens,
  context: 'login' | 'register',
) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
    await logStoredTokens(context);

    const user = await authApi.getMe(tokens.accessToken);
    await persistUserSnapshot(user);
    setAuthenticatedState(set, user, tokens.accessToken);
  } catch (error) {
    await clearStoredSessionState().catch(() => undefined);
    set({
      isHydrated: true,
      isAuthenticated: false,
      user: null,
      accessToken: null,
      pendingRegistration: null,
    });
    throw error;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isHydrated: false,
  isAuthenticated: false,
  user: null,
  accessToken: null,
  pendingRegistration: null,

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
    await completeAuthentication(set, tokens, 'login');
  },

  register: async (data) => {
    const challenge = await authApi.register({
      ...data,
      email: normalizeEmail(data.email),
    });
    set({ pendingRegistration: createPendingRegistration(challenge) });
    return challenge;
  },

  verifyRegistrationOtp: async (otp) => {
    const pendingRegistration = get().pendingRegistration;
    if (!pendingRegistration) {
      throw new Error('Phiên đăng ký không còn hiệu lực. Vui lòng đăng ký lại.');
    }

    const tokens = await authApi.verifyRegistrationOtp({
      challengeId: pendingRegistration.challenge.challengeId,
      otp,
    });
    if (__DEV__) {
      console.warn('[auth-store] register token response', {
        receivedAccessToken: Boolean(tokens.accessToken),
        receivedRefreshToken: Boolean(tokens.refreshToken),
      });
    }
    try {
      await completeAuthentication(set, tokens, 'register');
    } catch {
      // The server has already consumed the OTP and created the account. Do not
      // leave a dead challenge that can never be verified again.
      throw createRegistrationSessionSetupError();
    }
  },

  resendRegistrationOtp: async () => {
    const pendingRegistration = get().pendingRegistration;
    if (!pendingRegistration) {
      throw new Error('Phiên đăng ký không còn hiệu lực. Vui lòng đăng ký lại.');
    }

    const challenge = await authApi.resendRegistrationOtp({
      challengeId: pendingRegistration.challenge.challengeId,
    });
    set({ pendingRegistration: createPendingRegistration(challenge) });
    return challenge;
  },

  clearPendingRegistration: () => {
    set({ pendingRegistration: null });
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
      pendingRegistration: null,
    });
  },
});
