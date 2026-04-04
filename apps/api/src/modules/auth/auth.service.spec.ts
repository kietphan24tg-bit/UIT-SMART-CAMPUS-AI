import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../database/prisma.service';
import { UsersService } from '../users/users.service';

import { AuthService } from './auth.service';

jest.mock('bcrypt');
jest.mock('uuid', () => ({ v4: () => 'mock-uuid-token' }));

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let usersService: jest.Mocked<UsersService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@uit.edu.vn',
    passwordHash: 'hashed-password',
    studentId: '22520001',
    firstName: 'Nguyen',
    lastName: 'Van A',
    role: 'student',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn() },
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
      ],
    }).compile();

    authService = module.get(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
    usersService = module.get(UsersService);
    configService = module.get(ConfigService);
  });

  describe('register', () => {
    it('should hash password, create user, and return tokens', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      (usersService.create as jest.Mock).mockResolvedValue({
        id: 'user-1',
        role: 'student',
      });
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await authService.register({
        email: 'new@uit.edu.vn',
        password: 'Password123',
        studentId: '22520002',
        firstName: 'Tran',
        lastName: 'Van B',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 10);
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'new@uit.edu.vn',
        passwordHash: 'hashed-pw',
        studentId: '22520002',
        firstName: 'Tran',
        lastName: 'Van B',
      });
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-uuid-token',
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
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({ email: 'test@uit.edu.vn', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens for valid refresh token', async () => {
      const stored = {
        id: 'rt-1',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 86400000),
        user: { id: 'user-1', role: 'student' },
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
        user: { id: 'user-1', role: 'student' },
      });

      await expect(authService.refreshToken('expired')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw for non-existent refresh token', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.refreshToken('invalid')).rejects.toThrow(
        UnauthorizedException,
      );
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
});
