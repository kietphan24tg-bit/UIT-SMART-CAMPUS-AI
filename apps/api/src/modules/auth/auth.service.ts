import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../database/prisma.service';
import { UsersService } from '../users/users.service';

import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { PasswordResetMailerService } from './password-reset-mailer.service';

const PASSWORD_RESET_OTP_TTL_MS = 10 * 60 * 1000;
const PASSWORD_RESET_EMAIL_NOT_REGISTERED_MESSAGE = 'Email chưa được đăng ký tài khoản.';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly passwordResetMailerService: PasswordResetMailerService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      studentId: dto.studentId,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
    return this.generateTokens(user.id, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.role);
  }

  async refreshToken(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date() || !stored.user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.generateTokens(stored.user.id, stored.user.role);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async requestPasswordReset(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const emailDeliveryAvailable = this.passwordResetMailerService.canSendEmail();
    const deliveryMode: 'email' | 'preview' = emailDeliveryAvailable ? 'email' : 'preview';
    const baseResponse = {
      maskedEmail: this.maskEmail(normalizedEmail),
      expiresInSeconds: PASSWORD_RESET_OTP_TTL_MS / 1000,
      delivery: deliveryMode,
    };
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.isActive) {
      throw new BadRequestException(PASSWORD_RESET_EMAIL_NOT_REGISTERED_MESSAGE);
    }

    const otp = this.generateOtp();
    const codeHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_OTP_TTL_MS);

    await this.prisma.passwordResetOtp.updateMany({
      where: {
        userId: user.id,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { consumedAt: new Date() },
    });

    await this.prisma.passwordResetOtp.create({
      data: {
        userId: user.id,
        codeHash,
        expiresAt,
      },
    });

    const sent = await this.passwordResetMailerService.sendOtpEmail(
      normalizedEmail,
      otp,
      Math.round(PASSWORD_RESET_OTP_TTL_MS / 60000),
    );

    if (sent) {
      return baseResponse;
    }

    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      // Dev preview keeps the flow testable locally until SMTP is configured.
      return {
        ...baseResponse,
        delivery: 'preview' as const,
        previewCode: otp,
      };
    }

    throw new InternalServerErrorException('Unable to send OTP at the moment');
  }

  async verifyPasswordResetOtp(email: string, otp: string) {
    const user = await this.findActiveUserByEmail(email);
    const passwordResetOtp = await this.getLatestActivePasswordResetOtp(user.id);
    const isValid = await bcrypt.compare(String(otp).trim(), passwordResetOtp.codeHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    return { verified: true };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.findActiveUserByEmail(email);
    const passwordResetOtp = await this.getLatestActivePasswordResetOtp(user.id);
    const isValid = await bcrypt.compare(String(otp).trim(), passwordResetOtp.codeHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const consumedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetOtp.updateMany({
        where: {
          id: passwordResetOtp.id,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { consumedAt },
      });

      if (consumed.count === 0) {
        throw new UnauthorizedException('Invalid or expired OTP');
      }

      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
      await tx.refreshToken.deleteMany({ where: { userId: user.id } });
    });

    return { success: true };
  }

  private async generateTokens(userId: string, role: string) {
    const payload = { sub: userId, role };
    const accessToken = this.jwtService.sign(payload);

    const refreshTokenValue = randomUUID();
    const refreshExpDays = parseInt(
      this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d').replace('d', ''),
      10,
    );
    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId,
        expiresAt: new Date(Date.now() + refreshExpDays * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }

  private normalizeEmail(email: string) {
    return String(email || '')
      .trim()
      .toLowerCase();
  }

  private maskEmail(email: string) {
    const [localPart, domain = 'uit.edu.vn'] = email.split('@');
    if (!localPart) {
      return `***@${domain}`;
    }

    if (localPart.length <= 2) {
      return `${localPart[0] || '*'}*@${domain}`;
    }

    return `${localPart.slice(0, 2)}***@${domain}`;
  }

  private generateOtp() {
    return `${Math.floor(100000 + Math.random() * 900000)}`;
  }

  private async findActiveUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(email) },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    return user;
  }

  private async getLatestActivePasswordResetOtp(userId: string) {
    const passwordResetOtp = await this.prisma.passwordResetOtp.findFirst({
      where: {
        userId,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!passwordResetOtp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    return passwordResetOtp;
  }
}
