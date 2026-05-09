import type {
  AuthTokens,
  ChangePasswordRequest,
  ChangePasswordResult,
  LoginRequest,
  PasswordResetChallenge,
  PasswordResetConfirmRequest,
  PasswordResetConfirmResult,
  PasswordResetOtpVerifyRequest,
  PasswordResetOtpVerifyResult,
  PasswordResetRequest,
  RegisterRequest,
  UserProfile,
} from '@smart-campus/shared';

import { apiClient } from './client';

function toAuthApiError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const errorRecord = error as { message?: unknown };

    if (typeof errorRecord.message === 'string' && errorRecord.message.trim()) {
      return new Error(errorRecord.message);
    }

    if (Array.isArray(errorRecord.message) && typeof errorRecord.message[0] === 'string') {
      return new Error(errorRecord.message[0]);
    }
  }

  return new Error(fallback);
}

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

  requestPasswordReset: async (
    data: PasswordResetRequest,
  ): Promise<PasswordResetChallenge> => {
    try {
      return await apiClient.post('/auth/password-reset/request', data);
    } catch (error) {
      throw toAuthApiError(error, 'Không thể gửi OTP lúc này.');
    }
  },

  verifyPasswordResetOtp: async (
    data: PasswordResetOtpVerifyRequest,
  ): Promise<PasswordResetOtpVerifyResult> => {
    try {
      return await apiClient.post('/auth/password-reset/verify', data);
    } catch (error) {
      throw toAuthApiError(error, 'OTP không hợp lệ hoặc đã hết hạn.');
    }
  },

  resetPassword: async (
    data: PasswordResetConfirmRequest,
  ): Promise<PasswordResetConfirmResult> => {
    try {
      return await apiClient.post('/auth/password-reset/reset', data);
    } catch (error) {
      throw toAuthApiError(error, 'Không thể cập nhật mật khẩu.');
    }
  },

  changePassword: async (
    data: ChangePasswordRequest,
  ): Promise<ChangePasswordResult> => {
    return apiClient.post('/auth/change-password', data);
  },

  getMe: async (token: string): Promise<UserProfile> => {
    const response = await apiClient.get('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response as unknown as UserProfile;
  },
};
