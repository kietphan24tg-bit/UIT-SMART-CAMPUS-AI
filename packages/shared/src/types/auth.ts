export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  studentId: string;
  firstName: string;
  lastName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetOtpVerifyRequest {
  email: string;
  otp: string;
}

export interface PasswordResetConfirmRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface PasswordResetChallenge {
  maskedEmail: string;
  expiresInSeconds: number;
  delivery: 'email' | 'preview';
  previewCode?: string;
}

export interface PasswordResetOtpVerifyResult {
  verified: boolean;
}

export interface PasswordResetConfirmResult {
  success: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResult {
  success: boolean;
}
