import AsyncStorage from '@react-native-async-storage/async-storage';
import { USER_ROLES } from '@smart-campus/shared';
import * as SecureStore from 'expo-secure-store';

import { useAuthStore } from '../auth-store';

import { usersApi } from '@/services/api';
import { authApi } from '@/services/api/auth';
import { notifySessionInvalidated } from '@/services/api/auth-session';
import {
  AUTH_USER_SNAPSHOT_STORAGE_KEY,
  QUERY_CACHE_STORAGE_KEY,
} from '@/services/storage/local-storage';


jest.mock('@/services/api/auth', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    getMe: jest.fn(),
  },
}));

jest.mock('@/services/api', () => ({
  usersApi: {
    getProfile: jest.fn(),
  },
}));

const mockUser = {
  id: 'user-1',
  email: 'test@uit.edu.vn',
  firstName: 'Nguyen',
  lastName: 'Van A',
  studentId: '22520001',
  role: USER_ROLES.STUDENT,
};

const mockTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

const mockedAuthApi = authApi as unknown as {
  login: jest.Mock;
  register: jest.Mock;
  getMe: jest.Mock;
};
const mockedUsersApi = usersApi as unknown as {
  getProfile: jest.Mock;
};

function createTaggedError(
  message: string,
  appCode?: 'SESSION_INVALIDATED' | 'NETWORK_UNAVAILABLE',
) {
  const error = new Error(message) as Error & {
    appCode?: 'SESSION_INVALIDATED' | 'NETWORK_UNAVAILABLE';
  };
  if (appCode) {
    error.appCode = appCode;
  }

  return error;
}

describe('useAuthStore', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(async () => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    useAuthStore.setState({
      isHydrated: false,
      isAuthenticated: false,
      user: null,
      accessToken: null,
    });
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should have correct initial state', () => {
    const state = useAuthStore.getState();

    expect(state.isHydrated).toBe(false);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  describe('login', () => {
    it('should authenticate user and store tokens plus cached profile snapshot', async () => {
      mockedAuthApi.login.mockResolvedValue(mockTokens);
      mockedAuthApi.getMe.mockResolvedValue(mockUser);

      await useAuthStore.getState().login('test@uit.edu.vn', 'Password123');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('mock-access-token');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth_access_token',
        'mock-access-token',
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth_refresh_token',
        'mock-refresh-token',
      );
      await expect(AsyncStorage.getItem(AUTH_USER_SNAPSHOT_STORAGE_KEY)).resolves.toBe(
        JSON.stringify(mockUser),
      );
    });
  });

  describe('register', () => {
    it('should register, authenticate, and store cached profile snapshot', async () => {
      mockedAuthApi.register.mockResolvedValue(mockTokens);
      mockedAuthApi.getMe.mockResolvedValue(mockUser);

      await useAuthStore.getState().register({
        email: 'test@uit.edu.vn',
        password: 'Password123',
        studentId: '22520001',
        firstName: 'Nguyen',
        lastName: 'Van A',
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      await expect(AsyncStorage.getItem(AUTH_USER_SNAPSHOT_STORAGE_KEY)).resolves.toBe(
        JSON.stringify(mockUser),
      );
    });
  });

  describe('logout', () => {
    it('should clear auth state, tokens, cached user, and persisted query cache', async () => {
      await AsyncStorage.setItem(QUERY_CACHE_STORAGE_KEY, '{"clientState":{}}');
      await AsyncStorage.setItem(AUTH_USER_SNAPSHOT_STORAGE_KEY, JSON.stringify(mockUser));
      useAuthStore.setState({
        isHydrated: true,
        isAuthenticated: true,
        user: mockUser,
        accessToken: 'token',
      });

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.isHydrated).toBe(true);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_access_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_refresh_token');
      await expect(AsyncStorage.getItem(AUTH_USER_SNAPSHOT_STORAGE_KEY)).resolves.toBeNull();
      await expect(AsyncStorage.getItem(QUERY_CACHE_STORAGE_KEY)).resolves.toBeNull();
    });
  });

  describe('hydrate', () => {
    it('should restore auth state from stored token and refresh profile snapshot', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('stored-token');
      mockedUsersApi.getProfile.mockResolvedValue(mockUser);

      await useAuthStore.getState().hydrate();

      const state = useAuthStore.getState();
      expect(state.isHydrated).toBe(true);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('stored-token');
      await expect(AsyncStorage.getItem(AUTH_USER_SNAPSHOT_STORAGE_KEY)).resolves.toBe(
        JSON.stringify(mockUser),
      );
    });

    it('should remain unauthenticated when no stored token', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      await useAuthStore.getState().hydrate();

      expect(useAuthStore.getState().isHydrated).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should keep cached user logged in when hydrate fails offline', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('stored-token');
      await AsyncStorage.setItem(AUTH_USER_SNAPSHOT_STORAGE_KEY, JSON.stringify(mockUser));
      mockedUsersApi.getProfile.mockRejectedValue(
        createTaggedError('Network Error', 'NETWORK_UNAVAILABLE'),
      );

      await useAuthStore.getState().hydrate();

      const state = useAuthStore.getState();
      expect(state.isHydrated).toBe(true);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('stored-token');
      expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
    });

    it('should clear tokens and cached data on invalidated session', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('expired-token');
      await AsyncStorage.setItem(AUTH_USER_SNAPSHOT_STORAGE_KEY, JSON.stringify(mockUser));
      mockedUsersApi.getProfile.mockRejectedValue(
        createTaggedError('Invalid refresh token', 'SESSION_INVALIDATED'),
      );

      await useAuthStore.getState().hydrate();

      expect(useAuthStore.getState().isHydrated).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_access_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_refresh_token');
      await expect(AsyncStorage.getItem(AUTH_USER_SNAPSHOT_STORAGE_KEY)).resolves.toBeNull();
    });
  });

  describe('session invalidation handler', () => {
    it('should reset store state and clear persisted data when session is invalidated', async () => {
      await AsyncStorage.setItem(AUTH_USER_SNAPSHOT_STORAGE_KEY, JSON.stringify(mockUser));
      await AsyncStorage.setItem(QUERY_CACHE_STORAGE_KEY, '{"clientState":{}}');
      useAuthStore.setState({
        isHydrated: true,
        isAuthenticated: true,
        user: mockUser,
        accessToken: 'token',
      });

      notifySessionInvalidated();
      await Promise.resolve();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().accessToken).toBeNull();
      await expect(AsyncStorage.getItem(AUTH_USER_SNAPSHOT_STORAGE_KEY)).resolves.toBeNull();
      await expect(AsyncStorage.getItem(QUERY_CACHE_STORAGE_KEY)).resolves.toBeNull();
    });
  });
});
