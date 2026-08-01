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
  RegistrationChallenge,
  RegistrationOtpResendRequest,
  RegistrationOtpVerifyRequest,
  UserProfile,
} from '@smart-campus/shared';

import { apiClient } from './client';

import { createLocalizedError } from '@/utils/error-message';

const OTP_DELIVERY_REQUEST_TIMEOUT_MS = 30_000;

function toAuthApiError(error: unknown, fallback: string) {
  return createLocalizedError(error, fallback);
}

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthTokens> => {
    return apiClient.post('/auth/login', data);
  },

  register: async (data: RegisterRequest): Promise<RegistrationChallenge> => {
    return apiClient.post('/auth/register', data, { timeout: OTP_DELIVERY_REQUEST_TIMEOUT_MS });
  },

  verifyRegistrationOtp: async (data: RegistrationOtpVerifyRequest): Promise<AuthTokens> => {
    return apiClient.post('/auth/register/verify', data);
  },

  resendRegistrationOtp: async (
    data: RegistrationOtpResendRequest,
  ): Promise<RegistrationChallenge> => {
    return apiClient.post('/auth/register/resend', data, {
      timeout: OTP_DELIVERY_REQUEST_TIMEOUT_MS,
    });
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    return apiClient.post('/auth/refresh', { refreshToken });
  },

  requestPasswordReset: async (data: PasswordResetRequest): Promise<PasswordResetChallenge> => {
    try {
      return await apiClient.post('/auth/password-reset/request', data, {
        timeout: OTP_DELIVERY_REQUEST_TIMEOUT_MS,
      });
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

  resetPassword: async (data: PasswordResetConfirmRequest): Promise<PasswordResetConfirmResult> => {
    try {
      return await apiClient.post('/auth/password-reset/reset', data);
    } catch (error) {
      throw toAuthApiError(error, 'Không thể cập nhật mật khẩu.');
    }
  },

  changePassword: async (data: ChangePasswordRequest): Promise<ChangePasswordResult> => {
    return apiClient.post('/auth/change-password', data);
  },

  getMe: async (token: string): Promise<UserProfile> => {
    const response = await apiClient.get('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response as unknown as UserProfile;
  },
};
