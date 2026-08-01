import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../database/prisma.service';
import { UsersService } from '../users/users.service';

import { AuthService } from './auth.service';
import { PasswordResetMailerService } from './password-reset-mailer.service';

jest.mock('bcrypt');
jest.mock('node:crypto', () => ({
  randomInt: () => 123456,
  randomUUID: () => 'mock-uuid-token',
}));

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let usersService: jest.Mocked<UsersService>;
  let passwordResetMailerService: jest.Mocked<PasswordResetMailerService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@uit.edu.vn',
    passwordHash: 'hashed-password',
    studentId: '22520001',
    firstName: 'Nguyen',
    lastName: 'Van A',
    role: 'student',
    isActive: true,
    emailVerifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const mockOtpRow = {
    id: 'otp-1',
    userId: 'user-1',
    codeHash: 'hashed-otp',
    expiresAt: new Date(Date.now() + 600000),
    consumedAt: null,
    createdAt: new Date(),
  };
  const mockRegistrationChallenge = {
    id: '9e0df78c-d9e1-43ff-ad1e-3788f07309c6',
    email: 'new@uit.edu.vn',
    passwordHash: 'hashed-pw',
    studentId: '22520002',
    firstName: 'Tran',
    lastName: 'Van B',
    otpHash: 'hashed-otp',
    expiresAt: new Date(Date.now() + 600_000),
    resendAvailableAt: new Date(Date.now() + 60_000),
    failedAttempts: 0,
    lastAttemptAt: null,
    lastSentAt: new Date(),
    consumedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            user: { findUnique: jest.fn(), update: jest.fn() },
            registrationChallenge: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              updateMany: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
            passwordResetOtp: {
              updateMany: jest.fn(),
              create: jest.fn(),
              findFirst: jest.fn(),
            },
            refreshToken: {
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock-access-token') },
        },
        {
          provide: UsersService,
          useValue: { create: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('7d') },
        },
        {
          provide: PasswordResetMailerService,
          useValue: {
            canSendEmail: jest.fn().mockReturnValue(false),
            sendOtpEmail: jest.fn().mockResolvedValue(false),
            sendRegistrationOtpEmail: jest.fn().mockResolvedValue(false),
          },
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    prisma = module.get(PrismaService);
    usersService = module.get(UsersService);
    passwordResetMailerService = module.get(PasswordResetMailerService);
    (prisma.$transaction as jest.Mock).mockImplementation(
      async (callback: (tx: PrismaService) => Promise<unknown>) => callback(prisma),
    );
  });

  describe('register', () => {
    beforeEach(() => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.registrationChallenge.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.registrationChallenge.findFirst as jest.Mock).mockResolvedValue(null);
    });

    it('should create a pending challenge without creating a user or session', async () => {
      (bcrypt.hash as jest.Mock)
        .mockResolvedValueOnce('hashed-pw')
        .mockResolvedValueOnce('hashed-otp');
      (prisma.registrationChallenge.create as jest.Mock).mockResolvedValue(
        mockRegistrationChallenge,
      );

      const result = await authService.register({
        email: ' New@UIT.edu.vn ',
        password: 'Password123',
        studentId: '22520002',
        firstName: 'Tran',
        lastName: 'Van B',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 10);
      expect(prisma.registrationChallenge.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'new@uit.edu.vn',
          passwordHash: 'hashed-pw',
          studentId: '22520002',
          otpHash: 'hashed-otp',
        }),
      });
      expect(usersService.create).not.toHaveBeenCalled();
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        challengeId: mockRegistrationChallenge.id,
        delivery: 'preview',
        previewCode: '123456',
      });
    });

    it('should fail closed without exposing an OTP preview outside development or test', async () => {
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'staging';
      (bcrypt.hash as jest.Mock)
        .mockResolvedValueOnce('hashed-pw')
        .mockResolvedValueOnce('hashed-otp');
      (prisma.registrationChallenge.create as jest.Mock).mockResolvedValue(
        mockRegistrationChallenge,
      );

      try {
        await expect(
          authService.register({
            email: 'new@uit.edu.vn',
            password: 'Password123',
            studentId: '22520002',
            firstName: 'Tran',
            lastName: 'Van B',
          }),
        ).rejects.toThrow('Không thể gửi OTP lúc này.');
      } finally {
        if (previousNodeEnv === undefined) {
          delete process.env.NODE_ENV;
        } else {
          process.env.NODE_ENV = previousNodeEnv;
        }
      }

      expect(prisma.registrationChallenge.deleteMany).toHaveBeenCalledWith({
        where: { id: mockRegistrationChallenge.id },
      });
    });

    it('should reject a non-UIT email before hashing the password', async () => {
      await expect(
        authService.register({
          email: 'student@example.com',
          password: 'Password123',
          studentId: '22520002',
          firstName: 'Tran',
          lastName: 'Van B',
        }),
      ).rejects.toThrow('Email cần thuộc miền UIT.');

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should reject a concurrent challenge for the same email', async () => {
      (bcrypt.hash as jest.Mock)
        .mockResolvedValueOnce('hashed-pw')
        .mockResolvedValueOnce('hashed-otp');
      (prisma.registrationChallenge.create as jest.Mock).mockRejectedValue({ code: 'P2002' });
      (prisma.registrationChallenge.findUnique as jest.Mock).mockResolvedValue(
        mockRegistrationChallenge,
      );

      await expect(
        authService.register({
          email: 'new@uit.edu.vn',
          password: 'Password123',
          studentId: '22520002',
          firstName: 'Tran',
          lastName: 'Van B',
        }),
      ).rejects.toMatchObject({ status: 429 });

      expect(prisma.registrationChallenge.deleteMany).toHaveBeenCalledTimes(1);
    });

    it('should create the verified user and refresh token atomically after valid OTP', async () => {
      (prisma.registrationChallenge.findUnique as jest.Mock).mockResolvedValue(
        mockRegistrationChallenge,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (prisma.registrationChallenge.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (usersService.create as jest.Mock).mockResolvedValue({ id: 'user-1', role: 'student' });
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});
      (prisma.registrationChallenge.delete as jest.Mock).mockResolvedValue({});

      const result = await authService.verifyRegistrationOtp(
        mockRegistrationChallenge.id,
        '123456',
      );

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@uit.edu.vn',
          passwordHash: 'hashed-pw',
          emailVerifiedAt: expect.any(Date),
        }),
        prisma,
      );
      expect(prisma.refreshToken.create).toHaveBeenCalled();
      expect(prisma.registrationChallenge.delete).toHaveBeenCalledWith({
        where: { id: mockRegistrationChallenge.id },
      });
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-uuid-token',
      });
    });

    it('should increment failed OTP attempts and stop before user creation', async () => {
      (prisma.registrationChallenge.findUnique as jest.Mock).mockResolvedValue(
        mockRegistrationChallenge,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      (prisma.registrationChallenge.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      await expect(
        authService.verifyRegistrationOtp(mockRegistrationChallenge.id, '000000'),
      ).rejects.toThrow('OTP không hợp lệ hoặc đã hết hạn.');

      expect(prisma.registrationChallenge.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failedAttempts: { increment: 1 } }),
        }),
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should block verification after five failed attempts', async () => {
      (prisma.registrationChallenge.findUnique as jest.Mock).mockResolvedValue({
        ...mockRegistrationChallenge,
        failedAttempts: 5,
      });

      await expect(
        authService.verifyRegistrationOtp(mockRegistrationChallenge.id, '123456'),
      ).rejects.toThrow('OTP không hợp lệ hoặc đã hết hạn.');

      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should rotate the OTP and reset failed attempts on resend', async () => {
      const resendableChallenge = {
        ...mockRegistrationChallenge,
        failedAttempts: 4,
        lastAttemptAt: new Date(),
        resendAvailableAt: new Date(Date.now() - 1_000),
      };
      (prisma.registrationChallenge.findUnique as jest.Mock).mockResolvedValue(resendableChallenge);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-otp-hash');
      (prisma.registrationChallenge.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await authService.resendRegistrationOtp(resendableChallenge.id);

      expect(prisma.registrationChallenge.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            otpHash: 'new-otp-hash',
            failedAttempts: 0,
            lastAttemptAt: null,
          }),
        }),
      );
      expect(result).toMatchObject({
        challengeId: resendableChallenge.id,
        delivery: 'preview',
        previewCode: '123456',
      });
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await authService.login({
        email: 'test@uit.edu.vn',
        password: 'Password123',
      });

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-uuid-token');
    });

    it('should throw UnauthorizedException for non-existent email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login({ email: 'noone@test.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        authService.login({ email: 'noone@test.com', password: 'pass' }),
      ).rejects.toThrow('Email hoặc mật khẩu chưa đúng.');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({ email: 'test@uit.edu.vn', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        authService.login({ email: 'test@uit.edu.vn', password: 'wrong' }),
      ).rejects.toThrow('Email hoặc mật khẩu chưa đúng.');
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(
        authService.login({ email: 'test@uit.edu.vn', password: 'Password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject a user whose email is not verified', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        emailVerifiedAt: null,
      });

      await expect(
        authService.login({ email: 'test@uit.edu.vn', password: 'Password123' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens for valid refresh token', async () => {
      const stored = {
        id: 'rt-1',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 86400000),
        user: {
          id: 'user-1',
          role: 'student',
          isActive: true,
          emailVerifiedAt: new Date(),
        },
      };
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(stored);
      (prisma.refreshToken.delete as jest.Mock).mockResolvedValue({});
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await authService.refreshToken('valid-token');

      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'rt-1' } });
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('should throw for expired refresh token', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'rt-1',
        token: 'expired',
        expiresAt: new Date(Date.now() - 86400000),
        user: {
          id: 'user-1',
          role: 'student',
          isActive: true,
          emailVerifiedAt: new Date(),
        },
      });

      await expect(authService.refreshToken('expired')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for non-existent refresh token', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.refreshToken('invalid')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for refresh token belonging to inactive user', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'rt-1',
        token: 'inactive-user-token',
        expiresAt: new Date(Date.now() + 86400000),
        user: {
          id: 'user-1',
          role: 'student',
          isActive: false,
          emailVerifiedAt: new Date(),
        },
      });

      await expect(authService.refreshToken('inactive-user-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject a refresh token belonging to an unverified user', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'rt-1',
        token: 'unverified-user-token',
        expiresAt: new Date(Date.now() + 86400000),
        user: {
          id: 'user-1',
          role: 'student',
          isActive: true,
          emailVerifiedAt: null,
        },
      });

      await expect(authService.refreshToken('unverified-user-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.refreshToken.delete).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should delete all refresh tokens for user', async () => {
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });

      await authService.logout('user-1');

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });

  describe('changePassword', () => {
    it('should update password when current password is correct', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password');
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await authService.changePassword('user-1', 'OldPassword123', 'NewPassword456');

      expect(bcrypt.compare).toHaveBeenCalledWith('OldPassword123', 'hashed-password');
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword456', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: 'hashed-new-password' },
      });
      expect(result).toEqual({ success: true });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.changePassword('user-999', 'OldPassword123', 'NewPassword456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when current password is wrong', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.changePassword('user-1', 'WrongPassword', 'NewPassword456'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        authService.changePassword('user-1', 'WrongPassword', 'NewPassword456'),
      ).rejects.toThrow('Mật khẩu hiện tại chưa đúng.');
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, isActive: false });

      await expect(
        authService.changePassword('user-1', 'OldPassword123', 'NewPassword456'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('password reset', () => {
    it('should throw when password reset email is not registered', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.requestPasswordReset('missing@uit.edu.vn')).rejects.toThrow(
        BadRequestException,
      );
      await expect(authService.requestPasswordReset('missing@uit.edu.vn')).rejects.toThrow(
        'Email chưa được đăng ký tài khoản.',
      );
      expect(prisma.passwordResetOtp.create).not.toHaveBeenCalled();
      expect(passwordResetMailerService.sendOtpEmail).not.toHaveBeenCalled();
    });

    it('should throw when password reset email belongs to an inactive user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(authService.requestPasswordReset('inactive@uit.edu.vn')).rejects.toThrow(
        BadRequestException,
      );
      await expect(authService.requestPasswordReset('inactive@uit.edu.vn')).rejects.toThrow(
        'Email chưa được đăng ký tài khoản.',
      );
      expect(prisma.passwordResetOtp.create).not.toHaveBeenCalled();
      expect(passwordResetMailerService.sendOtpEmail).not.toHaveBeenCalled();
    });

    it('should create a password reset OTP for an active user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-otp');
      (prisma.passwordResetOtp.create as jest.Mock).mockResolvedValue(mockOtpRow);

      const result = await authService.requestPasswordReset('test@uit.edu.vn');

      expect(prisma.passwordResetOtp.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          consumedAt: null,
          expiresAt: expect.any(Object),
        },
        data: { consumedAt: expect.any(Date) },
      });
      expect(prisma.passwordResetOtp.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          codeHash: 'hashed-otp',
          expiresAt: expect.any(Date),
        },
      });
      expect(passwordResetMailerService.sendOtpEmail).toHaveBeenCalled();
      expect(result.delivery).toBe('preview');
      expect('previewCode' in result && result.previewCode).toMatch(/^\d{6}$/);
    });

    it('should return email delivery when SMTP send succeeds', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-otp');
      (prisma.passwordResetOtp.create as jest.Mock).mockResolvedValue(mockOtpRow);
      (passwordResetMailerService.canSendEmail as jest.Mock).mockReturnValue(true);
      (passwordResetMailerService.sendOtpEmail as jest.Mock).mockResolvedValue(true);

      const result = await authService.requestPasswordReset('test@uit.edu.vn');

      expect(result.delivery).toBe('email');
      expect(result).not.toHaveProperty('previewCode');
    });

    it('should verify a valid OTP', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-otp');
      (prisma.passwordResetOtp.create as jest.Mock).mockResolvedValue(mockOtpRow);
      (prisma.passwordResetOtp.findFirst as jest.Mock).mockResolvedValue(mockOtpRow);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await authService.requestPasswordReset('test@uit.edu.vn');

      await expect(
        authService.verifyPasswordResetOtp('test@uit.edu.vn', '123456'),
      ).resolves.toEqual({ verified: true });
    });

    it('should update password, consume otp, and clear sessions after reset', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock)
        .mockResolvedValueOnce('hashed-otp')
        .mockResolvedValueOnce('hashed-new-password');
      (prisma.passwordResetOtp.create as jest.Mock).mockResolvedValue(mockOtpRow);
      (prisma.passwordResetOtp.findFirst as jest.Mock).mockResolvedValue(mockOtpRow);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.passwordResetOtp.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });

      await authService.requestPasswordReset('test@uit.edu.vn');

      await expect(
        authService.resetPassword('test@uit.edu.vn', '123456', 'Password123'),
      ).resolves.toEqual({ success: true });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: 'hashed-new-password' },
      });
      expect(prisma.passwordResetOtp.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'otp-1',
          consumedAt: null,
          expiresAt: expect.any(Object),
        },
        data: { consumedAt: expect.any(Date) },
      });
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });
});
