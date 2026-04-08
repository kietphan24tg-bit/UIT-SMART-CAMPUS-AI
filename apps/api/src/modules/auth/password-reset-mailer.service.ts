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
        subject: 'UIT Smart Campus | Ma OTP dat lai mat khau',
        text: [
          'Ban da yeu cau dat lai mat khau cho tai khoan UIT Smart Campus.',
          `Ma OTP cua ban la: ${otp}`,
          `Ma co hieu luc trong ${expiresInMinutes} phut.`,
          'Neu ban khong thuc hien yeu cau nay, vui long bo qua email.',
        ].join('\n'),
        html: `
          <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
            <p>Ban da yeu cau dat lai mat khau cho tai khoan <strong>UIT Smart Campus</strong>.</p>
            <p style="margin: 20px 0;">
              <span style="display: inline-block; padding: 12px 18px; border-radius: 12px; background: #eff6ff; color: #1d4ed8; font-size: 24px; font-weight: 700; letter-spacing: 4px;">
                ${otp}
              </span>
            </p>
            <p>Ma OTP co hieu luc trong <strong>${expiresInMinutes} phut</strong>.</p>
            <p>Neu ban khong thuc hien yeu cau nay, vui long bo qua email.</p>
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
