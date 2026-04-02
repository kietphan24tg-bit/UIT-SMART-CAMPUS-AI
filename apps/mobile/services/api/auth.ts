import type { AuthTokens, LoginRequest, RegisterRequest } from '@smart-campus/shared';

import { apiClient } from './client';

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthTokens> => {
    return apiClient.post('/auth/login', data);
  },

  register: async (data: RegisterRequest): Promise<AuthTokens> => {
    return apiClient.post('/auth/register', data);
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    return apiClient.post('/auth/refresh', { refreshToken });
  },

  getMe: async (token: string) => {
    const response = await apiClient.get('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response as unknown as {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      studentId?: string;
      role: string;
    };
  },
};
