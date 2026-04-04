import * as SecureStore from 'expo-secure-store';

import { useAuthStore } from '../auth-store';

jest.mock('@/services/api/auth', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    getMe: jest.fn(),
  },
}));

const { authApi } = require('@/services/api/auth');

const mockUser = {
  id: 'user-1',
  email: 'test@uit.edu.vn',
  firstName: 'Nguyen',
  lastName: 'Van A',
  studentId: '22520001',
  role: 'student',
};

const mockTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
    });
    jest.clearAllMocks();
  });

  it('should have correct initial state', () => {
    const state = useAuthStore.getState();

    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  describe('login', () => {
    it('should authenticate user and store tokens', async () => {
      authApi.login.mockResolvedValue(mockTokens);
      authApi.getMe.mockResolvedValue(mockUser);

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
    });
  });

  describe('register', () => {
    it('should register, authenticate, and store tokens', async () => {
      authApi.register.mockResolvedValue(mockTokens);
      authApi.getMe.mockResolvedValue(mockUser);

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
    });
  });

  describe('logout', () => {
    it('should clear auth state and delete tokens', async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: mockUser,
        accessToken: 'token',
      });

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_access_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_refresh_token');
    });
  });

  describe('hydrate', () => {
    it('should restore auth state from stored token', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('stored-token');
      authApi.getMe.mockResolvedValue(mockUser);

      await useAuthStore.getState().hydrate();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('stored-token');
    });

    it('should remain unauthenticated when no stored token', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      await useAuthStore.getState().hydrate();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should clear tokens on hydration error', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('bad-token');
      authApi.getMe.mockRejectedValue(new Error('Unauthorized'));

      await useAuthStore.getState().hydrate();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_access_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_refresh_token');
    });
  });
});
