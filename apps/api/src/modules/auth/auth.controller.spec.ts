import { Test } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };
  const passwordResetChallenge = {
    maskedEmail: 'st***@gm.uit.edu.vn',
    expiresInSeconds: 600,
    delivery: 'preview' as const,
    previewCode: '123456',
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn().mockResolvedValue(mockTokens),
            login: jest.fn().mockResolvedValue(mockTokens),
            refreshToken: jest.fn().mockResolvedValue(mockTokens),
            requestPasswordReset: jest.fn().mockResolvedValue(passwordResetChallenge),
            verifyPasswordResetOtp: jest.fn().mockResolvedValue({ verified: true }),
            resetPassword: jest.fn().mockResolvedValue({ success: true }),
            changePassword: jest.fn().mockResolvedValue({ success: true }),
            logout: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
  });

  describe('register', () => {
    it('should call authService.register and return tokens', async () => {
      const dto = {
        email: 'test@uit.edu.vn',
        password: 'Password123',
        studentId: '22520001',
        firstName: 'Nguyen',
        lastName: 'Van A',
      };

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTokens);
    });
  });

  describe('login', () => {
    it('should call authService.login and return tokens', async () => {
      const dto = { email: 'test@uit.edu.vn', password: 'Password123' };

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTokens);
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshToken and return new tokens', async () => {
      const dto = { refreshToken: 'old-refresh-token' };

      const result = await controller.refresh(dto);

      expect(authService.refreshToken).toHaveBeenCalledWith('old-refresh-token');
      expect(result).toEqual(mockTokens);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with userId', async () => {
      await controller.logout('user-1');

      expect(authService.logout).toHaveBeenCalledWith('user-1');
    });
  });

  describe('changePassword', () => {
    it('should call authService.changePassword with userId and dto fields', async () => {
      const dto = { currentPassword: 'OldPassword123', newPassword: 'NewPassword456' };

      const result = await controller.changePassword('user-1', dto);

      expect(authService.changePassword).toHaveBeenCalledWith(
        'user-1',
        dto.currentPassword,
        dto.newPassword,
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('requestPasswordReset', () => {
    it('should request an OTP for password reset', async () => {
      const dto = { email: 'student@gm.uit.edu.vn' };

      const result = await controller.requestPasswordReset(dto);

      expect(authService.requestPasswordReset).toHaveBeenCalledWith(dto.email);
      expect(result).toEqual(passwordResetChallenge);
    });
  });

  describe('verifyPasswordResetOtp', () => {
    it('should verify OTP before reset', async () => {
      const dto = { email: 'student@gm.uit.edu.vn', otp: '123456' };

      const result = await controller.verifyPasswordResetOtp(dto);

      expect(authService.verifyPasswordResetOtp).toHaveBeenCalledWith(dto.email, dto.otp);
      expect(result).toEqual({ verified: true });
    });
  });

  describe('resetPassword', () => {
    it('should reset password with email, otp, and new password', async () => {
      const dto = {
        email: 'student@gm.uit.edu.vn',
        otp: '123456',
        newPassword: 'Password123',
      };

      const result = await controller.resetPassword(dto);

      expect(authService.resetPassword).toHaveBeenCalledWith(
        dto.email,
        dto.otp,
        dto.newPassword,
      );
      expect(result).toEqual({ success: true });
    });
  });
});
