import type { Server } from 'node:http';

import { RequestMethod, ValidationPipe, type INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { API_PREFIX } from '@smart-campus/shared';
import request from 'supertest';

import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/database/prisma.service';

jest.setTimeout(180_000);

process.env.DATABASE_URL ??=
  'postgresql://smartcampus:smartcampus_dev@localhost:65432/smart_campus';
process.env.JWT_SECRET ??= 'smart-campus-e2e-secret';
process.env.JWT_EXPIRATION ??= '15m';
process.env.JWT_REFRESH_EXPIRATION ??= '7d';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.CORS_ORIGIN ??= '*';
process.env.APP_BASE_URL ??= 'http://localhost:3000';
process.env.NODE_ENV = 'test';
process.env.SMTP_HOST = '';
process.env.SMTP_FROM = '';

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Server;

  const uniqueSuffix = `${Date.now()}`;
  const registerPayload = {
    email: `auth.e2e.${uniqueSuffix}@gm.uit.edu.vn`,
    password: 'Password123',
    studentId: `9${uniqueSuffix.slice(-7)}`,
    firstName: 'Auth',
    lastName: 'E2E',
  };
  let createdUserId: string | null = null;

  beforeAll(async () => {
    const { AppModule } = await import('../src/app.module');
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix(API_PREFIX, {
      exclude: [{ path: 'live/(.*)', method: RequestMethod.ALL }],
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor(app.get(Reflector)));
    await app.init();

    prisma = app.get(PrismaService);
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await prisma.registrationChallenge.deleteMany({
      where: { OR: [{ email: registerPayload.email }, { studentId: registerPayload.studentId }] },
    });
    if (createdUserId) {
      await prisma.refreshToken.deleteMany({
        where: { userId: createdUserId },
      });
      await prisma.passwordResetOtp.deleteMany({
        where: { userId: createdUserId },
      });
      await prisma.user.delete({
        where: { id: createdUserId },
      });
    }

    if (app) {
      await app.close();
    }
  });

  it('returns exact 401 message when login credentials are invalid', async () => {
    const response = await request(server)
      .post('/api/v1/auth/login')
      .send({ email: 'invalid@test.com', password: 'wrongpass' })
      .expect(401);

    expect(response.body.message).toBe('Email hoặc mật khẩu chưa đúng.');
  });

  it('returns exact 400 message when login password is too short', async () => {
    const response = await request(server)
      .post('/api/v1/auth/login')
      .send({ email: 'student@gm.uit.edu.vn', password: 'short' })
      .expect(400);

    expect(response.body.message).toBe('Mật khẩu phải có ít nhất 8 ký tự.');
  });

  it('returns exact 400 message when register email is invalid', async () => {
    const response = await request(server)
      .post('/api/v1/auth/register')
      .send({ ...registerPayload, email: 'student' })
      .expect(400);

    expect(response.body.message).toBe('Email không đúng định dạng.');
  });

  it('rejects a syntactically valid non-UIT registration email', async () => {
    const response = await request(server)
      .post('/api/v1/auth/register')
      .send({ ...registerPayload, email: 'student@example.com' })
      .expect(400);

    expect(response.body.message).toBe('Email cần thuộc miền UIT.');
  });

  it('returns exact 400 message when register password is too short', async () => {
    const response = await request(server)
      .post('/api/v1/auth/register')
      .send({ ...registerPayload, password: 'short' })
      .expect(400);

    expect(response.body.message).toBe('Mật khẩu phải có ít nhất 8 ký tự.');
  });

  it('returns exact 400 message when register student id is invalid', async () => {
    const response = await request(server)
      .post('/api/v1/auth/register')
      .send({ ...registerPayload, studentId: '123' })
      .expect(400);

    expect(response.body.message).toBe('Mã số sinh viên phải gồm đúng 8 chữ số.');
  });

  it('creates a challenge, resends OTP, then creates the verified account atomically', async () => {
    const challengeResponse = await request(server)
      .post('/api/v1/auth/register')
      .send({ ...registerPayload, email: registerPayload.email.toUpperCase() })
      .expect(201);

    expect(challengeResponse.body.data).toMatchObject({
      maskedEmail: expect.stringContaining('@gm.uit.edu.vn'),
      expiresInSeconds: expect.any(Number),
      resendAvailableInSeconds: expect.any(Number),
      delivery: 'preview',
    });
    expect(challengeResponse.body.data?.accessToken).toBeUndefined();

    const challengeId = challengeResponse.body.data?.challengeId as string;
    expect(challengeId).toBeTruthy();
    expect(await prisma.user.findUnique({ where: { email: registerPayload.email } })).toBeNull();

    await prisma.registrationChallenge.update({
      where: { id: challengeId },
      data: { resendAvailableAt: new Date(Date.now() - 1_000) },
    });
    const resendResponse = await request(server)
      .post('/api/v1/auth/register/resend')
      .send({ challengeId })
      .expect(200);
    const otp = resendResponse.body.data?.previewCode as string;
    expect(otp).toMatch(/^\d{6}$/);

    const verifyResponse = await request(server)
      .post('/api/v1/auth/register/verify')
      .send({ challengeId, otp })
      .expect(200);
    expect(verifyResponse.body.data?.accessToken).toBeTruthy();
    expect(verifyResponse.body.data?.refreshToken).toBeTruthy();

    const createdUser = await prisma.user.findUnique({
      where: { email: registerPayload.email },
      select: { id: true, emailVerifiedAt: true },
    });

    expect(createdUser?.id).toBeTruthy();
    expect(createdUser?.emailVerifiedAt).toBeTruthy();
    expect(
      await prisma.registrationChallenge.findUnique({ where: { id: challengeId } }),
    ).toBeNull();
    createdUserId = createdUser?.id ?? null;
  });

  it('returns exact 400 message when password reset request email format is invalid', async () => {
    const response = await request(server)
      .post('/api/v1/auth/password-reset/request')
      .send({ email: 'student' })
      .expect(400);

    expect(response.body.message).toBe('Email không đúng định dạng.');
  });

  it('rejects a syntactically valid non-UIT password reset email', async () => {
    const response = await request(server)
      .post('/api/v1/auth/password-reset/request')
      .send({ email: 'student@example.com' })
      .expect(400);

    expect(response.body.message).toBe('Email cần thuộc miền UIT.');
  });

  it('returns exact 400 message when password reset email is not registered', async () => {
    const response = await request(server)
      .post('/api/v1/auth/password-reset/request')
      .send({ email: `missing.${uniqueSuffix}@gm.uit.edu.vn` })
      .expect(400);

    expect(response.body.message).toBe('Email chưa được đăng ký tài khoản.');
  });

  it('returns exact 401 message when OTP verify receives a wrong 6-digit code', async () => {
    const requestOtpResponse = await request(server)
      .post('/api/v1/auth/password-reset/request')
      .send({ email: registerPayload.email })
      .expect(200);

    const previewCode = requestOtpResponse.body.data?.previewCode as string | undefined;
    const wrongOtp = previewCode === '000000' ? '111111' : '000000';

    const response = await request(server)
      .post('/api/v1/auth/password-reset/verify')
      .send({ email: registerPayload.email, otp: wrongOtp })
      .expect(401);

    expect(response.body.message).toBe('OTP không hợp lệ hoặc đã hết hạn.');
  });

  it('returns exact 400 message when OTP verify format is invalid', async () => {
    const response = await request(server)
      .post('/api/v1/auth/password-reset/verify')
      .send({ email: registerPayload.email, otp: '12' })
      .expect(400);

    expect(response.body.message).toBe('OTP phải gồm đúng 6 chữ số.');
  });

  it('returns exact 400 message when reset password is too short', async () => {
    const response = await request(server)
      .post('/api/v1/auth/password-reset/reset')
      .send({ email: registerPayload.email, otp: '123456', newPassword: 'short' })
      .expect(400);

    expect(response.body.message).toBe('Mật khẩu phải có ít nhất 8 ký tự.');
  });

  it('returns exact 401 message when reset password OTP is invalid', async () => {
    const requestOtpResponse = await request(server)
      .post('/api/v1/auth/password-reset/request')
      .send({ email: registerPayload.email })
      .expect(200);

    const previewCode = requestOtpResponse.body.data?.previewCode as string | undefined;
    const wrongOtp = previewCode === '999999' ? '888888' : '999999';

    const response = await request(server)
      .post('/api/v1/auth/password-reset/reset')
      .send({
        email: registerPayload.email,
        otp: wrongOtp,
        newPassword: 'Password123',
      })
      .expect(401);

    expect(response.body.message).toBe('OTP không hợp lệ hoặc đã hết hạn.');
  });
});
