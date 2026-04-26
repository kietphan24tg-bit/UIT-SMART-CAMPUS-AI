import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class PasswordResetMailerService {
  private readonly logger = new Logger(PasswordResetMailerService.name);
  private transporter: Transporter | null | undefined;

  constructor(private readonly configService: ConfigService) {}

  canSendEmail() {
    return this.getTransporter() !== null && Boolean(this.getFromAddress());
  }

  async sendOtpEmail(email: string, otp: string, expiresInMinutes: number) {
    const transporter = this.getTransporter();
    const from = this.getFromAddress();
    if (!transporter || !from) {
      return false;
    }

    try {
      await transporter.sendMail({
        from,
        to: email,
        subject: 'UIT Smart Campus | Mã OTP đặt lại mật khẩu',
        text: [
          'Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản UIT Smart Campus.',
          `Mã OTP của bạn là: ${otp}`,
          `Mã có hiệu lực trong ${expiresInMinutes} phút.`,
          'Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.',
        ].join('\n'),
        html: `
          <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
            <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản <strong>UIT Smart Campus</strong>.</p>
            <p style="margin: 20px 0;">
              <span style="display: inline-block; padding: 12px 18px; border-radius: 12px; background: #eff6ff; color: #1d4ed8; font-size: 24px; font-weight: 700; letter-spacing: 4px;">
                ${otp}
              </span>
            </p>
            <p>Mã OTP có hiệu lực trong <strong>${expiresInMinutes} phút</strong>.</p>
            <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown mail transport error';
      this.logger.warn(`Failed to send password reset OTP email: ${message}`);
      return false;
    }
  }

  private getFromAddress() {
    return this.configService.get<string>('SMTP_FROM', '').trim();
  }

  private getTransporter() {
    if (this.transporter !== undefined) {
      return this.transporter;
    }

    const host = this.configService.get<string>('SMTP_HOST', '').trim();
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER', '').trim();
    const pass = this.configService.get<string>('SMTP_PASS', '').trim();

    if (!host) {
      this.transporter = null;
      return this.transporter;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: this.configService.get<boolean>('SMTP_SECURE', port === 465),
      auth: user && pass ? { user, pass } : undefined,
    });

    return this.transporter;
  }
}
