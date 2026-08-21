import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import type { PrismaService } from '../../../database/prisma.service';

import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const configService = {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  } as unknown as ConfigService;
  const prisma = {
    user: { findUnique: jest.fn() },
  } as unknown as jest.Mocked<PrismaService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('accepts an active user with a verified email', async () => {
    const user = {
      id: 'user-1',
      email: 'student@gm.uit.edu.vn',
      role: 'student',
      isActive: true,
      emailVerifiedAt: new Date(),
    };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
    const strategy = new JwtStrategy(configService, prisma);

    await expect(strategy.validate({ sub: 'user-1', role: 'student' })).resolves.toEqual(user);
  });

  it('rejects an access token when the user email is not verified', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'student@gm.uit.edu.vn',
      role: 'student',
      isActive: true,
      emailVerifiedAt: null,
    });
    const strategy = new JwtStrategy(configService, prisma);

    await expect(strategy.validate({ sub: 'user-1', role: 'student' })).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
