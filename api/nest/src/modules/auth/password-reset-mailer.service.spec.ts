import type { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

import { PasswordResetMailerService } from './password-reset-mailer.service';

const sendMailMock = jest.fn();

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(),
  },
}));

const mockedNodemailer = jest.mocked(nodemailer);

describe('PasswordResetMailerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNodemailer.createTransport.mockReturnValue({
      sendMail: sendMailMock,
    } as never);
  });

  it('uses Vietnamese copy with dấu in password reset email payload', async () => {
    const configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const map: Record<string, unknown> = {
          SMTP_HOST: 'smtp.test.local',
          SMTP_PORT: 587,
          SMTP_SECURE: false,
          SMTP_USER: 'mailer',
          SMTP_PASS: 'secret',
          SMTP_FROM: 'UIT Smart Campus <noreply@uit.edu.vn>',
        };
        return key in map ? map[key] : defaultValue;
      }),
    } as unknown as ConfigService;

    const service = new PasswordResetMailerService(configService);
    await service.sendOtpEmail('student@gm.uit.edu.vn', '123456', 10);

    expect(mockedNodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionTimeout: 5_000,
        greetingTimeout: 5_000,
        socketTimeout: 15_000,
      }),
    );
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'UIT Smart Campus | Mã OTP đặt lại mật khẩu',
        text: expect.stringContaining('Bạn đã yêu cầu đặt lại mật khẩu'),
        html: expect.stringContaining('Mã OTP có hiệu lực trong'),
      }),
    );
  });

  it('sends registration OTP with registration-specific copy', async () => {
    const configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const map: Record<string, unknown> = {
          SMTP_HOST: 'smtp.test.local',
          SMTP_PORT: 587,
          SMTP_SECURE: false,
          SMTP_USER: 'mailer',
          SMTP_PASS: 'secret',
          SMTP_FROM: 'UIT Smart Campus <noreply@uit.edu.vn>',
        };
        return key in map ? map[key] : defaultValue;
      }),
    } as unknown as ConfigService;

    const service = new PasswordResetMailerService(configService);
    await service.sendRegistrationOtpEmail('student@gm.uit.edu.vn', '654321', 10);

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'UIT Smart Campus | Mã OTP xác thực đăng ký',
        text: expect.stringContaining('Mã OTP xác thực đăng ký của bạn là: 654321'),
        html: expect.stringContaining('Mã OTP có hiệu lực trong'),
      }),
    );
  });
});
