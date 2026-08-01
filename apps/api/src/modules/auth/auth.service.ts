import { randomInt, randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Prisma, RegistrationChallenge } from '@prisma/client';
import { isLegacyUserRole, isValidUitEmail, normalizeEmail } from '@smart-campus/shared';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../database/prisma.service';
import { UsersService } from '../users/users.service';

import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { PasswordResetMailerService } from './password-reset-mailer.service';

const PASSWORD_RESET_OTP_TTL_MS = 10 * 60 * 1000;
const REGISTRATION_OTP_TTL_MS = 10 * 60 * 1000;
const REGISTRATION_RESEND_COOLDOWN_MS = 60 * 1000;
const REGISTRATION_MAX_FAILED_ATTEMPTS = 5;
const PASSWORD_RESET_EMAIL_NOT_REGISTERED_MESSAGE = 'Email chưa được đăng ký tài khoản.';
const EMAIL_ALREADY_REGISTERED_MESSAGE = 'Email đã được đăng ký.';
const STUDENT_ID_ALREADY_REGISTERED_MESSAGE = 'MSSV đã được đăng ký.';
const REGISTRATION_CHALLENGE_INVALID_MESSAGE = 'Yêu cầu đăng ký không hợp lệ hoặc đã hết hạn.';
const REGISTRATION_OTP_INVALID_MESSAGE = 'OTP không hợp lệ hoặc đã hết hạn.';
const UIT_EMAIL_MESSAGE = 'Email cần thuộc miền UIT.';

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
    const email = normalizeEmail(dto.email);
    this.assertUitEmail(email);
    await this.cleanupExpiredRegistrationChallenges();
    await this.assertRegistrationIdentityAvailable(email, dto.studentId);
    await this.assertRegistrationRequestCooldown(email, dto.studentId);

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const now = new Date();
    let challenge: RegistrationChallenge;
    try {
      challenge = await this.prisma.registrationChallenge.create({
        data: {
          email,
          passwordHash,
          studentId: dto.studentId,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          otpHash,
          expiresAt: new Date(now.getTime() + REGISTRATION_OTP_TTL_MS),
          resendAvailableAt: new Date(now.getTime() + REGISTRATION_RESEND_COOLDOWN_MS),
          lastSentAt: now,
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        const activeChallenge = await this.prisma.registrationChallenge.findUnique({
          where: { email },
        });
        const retryInSeconds = activeChallenge
          ? this.secondsUntil(activeChallenge.resendAvailableAt)
          : Math.ceil(REGISTRATION_RESEND_COOLDOWN_MS / 1000);
        throw new HttpException(
          `Vui lòng chờ ${retryInSeconds} giây trước khi gửi lại OTP.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw error;
    }

    try {
      return await this.deliverRegistrationChallenge(challenge, otp);
    } catch (error) {
      await this.prisma.registrationChallenge.deleteMany({ where: { id: challenge.id } });
      throw error;
    }
  }

  async verifyRegistrationOtp(challengeId: string, otp: string) {
    const challenge = await this.getActiveRegistrationChallenge(challengeId);

    if (challenge.failedAttempts >= REGISTRATION_MAX_FAILED_ATTEMPTS) {
      throw new UnauthorizedException(REGISTRATION_OTP_INVALID_MESSAGE);
    }

    const isValid = await bcrypt.compare(String(otp).trim(), challenge.otpHash);
    if (!isValid) {
      await this.prisma.registrationChallenge.updateMany({
        where: {
          id: challenge.id,
          otpHash: challenge.otpHash,
          consumedAt: null,
          expiresAt: { gt: new Date() },
          failedAttempts: { lt: REGISTRATION_MAX_FAILED_ATTEMPTS },
        },
        data: {
          failedAttempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });
      throw new UnauthorizedException(REGISTRATION_OTP_INVALID_MESSAGE);
    }

    const verifiedAt = new Date();
    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.registrationChallenge.updateMany({
        where: {
          id: challenge.id,
          otpHash: challenge.otpHash,
          consumedAt: null,
          expiresAt: { gt: verifiedAt },
          failedAttempts: { lt: REGISTRATION_MAX_FAILED_ATTEMPTS },
        },
        data: {
          consumedAt: verifiedAt,
          lastAttemptAt: verifiedAt,
        },
      });

      if (claimed.count === 0) {
        throw new UnauthorizedException(REGISTRATION_OTP_INVALID_MESSAGE);
      }

      const user = await this.usersService.create(
        {
          email: challenge.email,
          passwordHash: challenge.passwordHash,
          studentId: challenge.studentId,
          firstName: challenge.firstName,
          lastName: challenge.lastName,
          emailVerifiedAt: verifiedAt,
        },
        tx,
      );
      const tokens = await this.generateTokens(user.id, user.role, tx);

      // Successful challenges contain password and OTP hashes; remove them atomically.
      await tx.registrationChallenge.delete({ where: { id: challenge.id } });
      return tokens;
    });
  }

  async resendRegistrationOtp(challengeId: string) {
    const challenge = await this.getActiveRegistrationChallenge(challengeId);
    const now = new Date();
    if (challenge.resendAvailableAt > now) {
      throw new HttpException(
        `Vui lòng chờ ${this.secondsUntil(challenge.resendAvailableAt, now)} giây trước khi gửi lại OTP.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(now.getTime() + REGISTRATION_OTP_TTL_MS);
    const resendAvailableAt = new Date(now.getTime() + REGISTRATION_RESEND_COOLDOWN_MS);
    const reserved = await this.prisma.registrationChallenge.updateMany({
      where: {
        id: challenge.id,
        consumedAt: null,
        expiresAt: { gt: now },
        resendAvailableAt: { lte: now },
      },
      data: {
        otpHash,
        expiresAt,
        resendAvailableAt,
        failedAttempts: 0,
        lastAttemptAt: null,
        lastSentAt: now,
      },
    });

    if (reserved.count === 0) {
      throw new HttpException('Vui lòng chờ trước khi gửi lại OTP.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const updatedChallenge = {
      ...challenge,
      otpHash,
      expiresAt,
      resendAvailableAt,
      failedAttempts: 0,
      lastAttemptAt: null,
      lastSentAt: now,
    };

    try {
      return await this.deliverRegistrationChallenge(updatedChallenge, otp);
    } catch (error) {
      // Keep the challenge reusable when production SMTP is unavailable.
      await this.prisma.registrationChallenge.updateMany({
        where: { id: challenge.id, otpHash, consumedAt: null },
        data: { resendAvailableAt: new Date() },
      });
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(dto.email) },
    });
    if (!user || !user.isActive || !user.emailVerifiedAt) {
      throw new UnauthorizedException('Email hoặc mật khẩu chưa đúng.');
    }

    if (isLegacyUserRole(user.role)) {
      throw new UnauthorizedException('Tài khoản không tồn tại.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu chưa đúng.');
    }

    return this.generateTokens(user.id, user.role);
  }

  async refreshToken(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (
      !stored ||
      stored.expiresAt < new Date() ||
      !stored.user.isActive ||
      !stored.user.emailVerifiedAt
    ) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.generateTokens(stored.user.id, stored.user.role);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async requestPasswordReset(email: string) {
    const normalizedEmail = normalizeEmail(email);
    this.assertUitEmail(normalizedEmail);
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

    if (this.canExposeOtpPreview()) {
      // Dev preview keeps the flow testable locally until SMTP is configured.
      return {
        ...baseResponse,
        delivery: 'preview' as const,
        previewCode: otp,
      };
    }

    throw new InternalServerErrorException('Không thể gửi OTP lúc này.');
  }

  async verifyPasswordResetOtp(email: string, otp: string) {
    const user = await this.findActiveUserByEmail(email);
    const passwordResetOtp = await this.getLatestActivePasswordResetOtp(user.id);
    const isValid = await bcrypt.compare(String(otp).trim(), passwordResetOtp.codeHash);

    if (!isValid) {
      throw new UnauthorizedException('OTP không hợp lệ hoặc đã hết hạn.');
    }

    return { verified: true };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Email hoặc mật khẩu chưa đúng.');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu hiện tại chưa đúng.');
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
      throw new UnauthorizedException('OTP không hợp lệ hoặc đã hết hạn.');
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
        throw new UnauthorizedException('OTP không hợp lệ hoặc đã hết hạn.');
      }

      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
      await tx.refreshToken.deleteMany({ where: { userId: user.id } });
    });

    return { success: true };
  }

  private async generateTokens(
    userId: string,
    role: string,
    client: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    const payload = { sub: userId, role };
    const accessToken = this.jwtService.sign(payload);

    const refreshTokenValue = randomUUID();
    const refreshExpDays = parseInt(
      this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d').replace('d', ''),
      10,
    );
    await client.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId,
        expiresAt: new Date(Date.now() + refreshExpDays * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }

  private async cleanupExpiredRegistrationChallenges() {
    const now = new Date();
    await this.prisma.registrationChallenge.deleteMany({
      where: {
        OR: [{ expiresAt: { lte: now } }, { consumedAt: { not: null } }],
      },
    });
  }

  private async assertRegistrationIdentityAvailable(email: string, studentId: string) {
    const [emailOwner, studentIdOwner] = await Promise.all([
      this.prisma.user.findUnique({ where: { email }, select: { id: true } }),
      this.prisma.user.findUnique({ where: { studentId }, select: { id: true } }),
    ]);

    if (emailOwner) {
      throw new ConflictException(EMAIL_ALREADY_REGISTERED_MESSAGE);
    }
    if (studentIdOwner) {
      throw new ConflictException(STUDENT_ID_ALREADY_REGISTERED_MESSAGE);
    }
  }

  private async assertRegistrationRequestCooldown(email: string, studentId: string) {
    const now = new Date();
    const existing = await this.prisma.registrationChallenge.findFirst({
      where: {
        consumedAt: null,
        expiresAt: { gt: now },
        OR: [{ email }, { studentId }],
      },
      orderBy: { lastSentAt: 'desc' },
    });

    if (existing?.resendAvailableAt && existing.resendAvailableAt > now) {
      throw new HttpException(
        `Vui lòng chờ ${this.secondsUntil(existing.resendAvailableAt, now)} giây trước khi gửi lại OTP.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (existing) {
      await this.prisma.registrationChallenge.deleteMany({
        where: {
          consumedAt: null,
          OR: [{ email }, { studentId }],
        },
      });
    }
  }

  private async getActiveRegistrationChallenge(challengeId: string) {
    const challenge = await this.prisma.registrationChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge || challenge.consumedAt) {
      throw new BadRequestException(REGISTRATION_CHALLENGE_INVALID_MESSAGE);
    }

    if (challenge.expiresAt <= new Date()) {
      await this.prisma.registrationChallenge.deleteMany({ where: { id: challenge.id } });
      throw new BadRequestException(REGISTRATION_CHALLENGE_INVALID_MESSAGE);
    }

    return challenge;
  }

  private async deliverRegistrationChallenge(challenge: RegistrationChallenge, otp: string) {
    const sent = await this.passwordResetMailerService.sendRegistrationOtpEmail(
      challenge.email,
      otp,
      Math.round(REGISTRATION_OTP_TTL_MS / 60000),
    );
    const response = {
      challengeId: challenge.id,
      maskedEmail: this.maskEmail(challenge.email),
      expiresInSeconds: this.secondsUntil(challenge.expiresAt),
      resendAvailableInSeconds: this.secondsUntil(challenge.resendAvailableAt),
    };

    if (sent) {
      return { ...response, delivery: 'email' as const };
    }

    if (this.canExposeOtpPreview()) {
      return {
        ...response,
        delivery: 'preview' as const,
        previewCode: otp,
      };
    }

    throw new InternalServerErrorException('Không thể gửi OTP lúc này.');
  }

  private assertUitEmail(email: string) {
    if (!isValidUitEmail(email)) {
      throw new BadRequestException(UIT_EMAIL_MESSAGE);
    }
  }

  private canExposeOtpPreview() {
    const environment = String(
      process.env.NODE_ENV ?? this.configService.get<string>('NODE_ENV', ''),
    )
      .trim()
      .toLowerCase();

    return environment === 'development' || environment === 'test';
  }

  private secondsUntil(target: Date, now = new Date()) {
    return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 1000));
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'P2002'
    );
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
    return `${randomInt(100000, 1000000)}`;
  }

  private async findActiveUserByEmail(email: string) {
    const normalizedEmail = normalizeEmail(email);
    this.assertUitEmail(normalizedEmail);
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('OTP không hợp lệ hoặc đã hết hạn.');
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
      throw new UnauthorizedException('OTP không hợp lệ hoặc đã hết hạn.');
    }

    return passwordResetOtp;
  }
}
