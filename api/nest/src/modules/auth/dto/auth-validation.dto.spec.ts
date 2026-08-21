import { validate } from 'class-validator';

import { ChangePasswordDto } from './change-password.dto';
import { PasswordResetConfirmDto } from './password-reset-confirm.dto';
import { PasswordResetRequestDto } from './password-reset-request.dto';
import { PasswordResetVerifyDto } from './password-reset-verify.dto';
import { RegisterDto } from './register.dto';
import { RegistrationOtpResendDto } from './registration-otp-resend.dto';
import { RegistrationOtpVerifyDto } from './registration-otp-verify.dto';

describe('Auth validation DTOs', () => {
  it('returns Vietnamese messages for invalid register payloads', async () => {
    const dto = new RegisterDto();
    dto.email = 'student';
    dto.password = 'short';
    dto.studentId = '123';
    dto.firstName = '';
    dto.lastName = '';

    const errors = await validate(dto);
    const messages = errors.flatMap((error) => Object.values(error.constraints ?? {}));

    expect(messages).toContain('Email không đúng định dạng.');
    expect(messages).toContain('Mật khẩu phải có ít nhất 8 ký tự.');
    expect(messages).toContain('Mã số sinh viên phải gồm đúng 8 chữ số.');
    expect(messages).toContain('Vui lòng nhập tên.');
    expect(messages).toContain('Vui lòng nhập họ.');
  });

  it('rejects non-UIT email domains for registration and password reset', async () => {
    const registerDto = new RegisterDto();
    registerDto.email = 'student@example.com';
    registerDto.password = 'Password123';
    registerDto.studentId = '22520001';
    registerDto.firstName = 'An';
    registerDto.lastName = 'Nguyen';
    const resetDto = new PasswordResetRequestDto();
    resetDto.email = 'student@example.com';

    const [registerErrors, resetErrors] = await Promise.all([
      validate(registerDto),
      validate(resetDto),
    ]);

    expect(registerErrors.flatMap((error) => Object.values(error.constraints ?? {}))).toContain(
      'Email cần thuộc miền UIT.',
    );
    expect(resetErrors.flatMap((error) => Object.values(error.constraints ?? {}))).toContain(
      'Email cần thuộc miền UIT.',
    );
  });

  it('validates registration verification and resend payloads', async () => {
    const verifyDto = new RegistrationOtpVerifyDto();
    verifyDto.challengeId = 'invalid';
    verifyDto.otp = '12';
    const resendDto = new RegistrationOtpResendDto();
    resendDto.challengeId = 'invalid';

    const [verifyErrors, resendErrors] = await Promise.all([
      validate(verifyDto),
      validate(resendDto),
    ]);

    const verifyMessages = verifyErrors.flatMap((error) => Object.values(error.constraints ?? {}));
    const resendMessages = resendErrors.flatMap((error) => Object.values(error.constraints ?? {}));
    expect(verifyMessages).toContain('Mã xác thực đăng ký không hợp lệ.');
    expect(verifyMessages).toContain('OTP phải gồm đúng 6 chữ số.');
    expect(resendMessages).toContain('Mã xác thực đăng ký không hợp lệ.');
  });

  it('returns Vietnamese messages for password reset request validation', async () => {
    const dto = new PasswordResetRequestDto();
    dto.email = 'student';

    const errors = await validate(dto);
    const messages = errors.flatMap((error) => Object.values(error.constraints ?? {}));

    expect(messages).toContain('Email không đúng định dạng.');
  });

  it('returns Vietnamese messages for password reset verify validation', async () => {
    const dto = new PasswordResetVerifyDto();
    dto.email = 'student';
    dto.otp = '12';

    const errors = await validate(dto);
    const messages = errors.flatMap((error) => Object.values(error.constraints ?? {}));

    expect(messages).toContain('Email không đúng định dạng.');
    expect(messages).toContain('OTP phải gồm đúng 6 chữ số.');
  });

  it('returns Vietnamese messages for password reset confirm validation', async () => {
    const dto = new PasswordResetConfirmDto();
    dto.email = 'student';
    dto.otp = '12';
    dto.newPassword = 'short';

    const errors = await validate(dto);
    const messages = errors.flatMap((error) => Object.values(error.constraints ?? {}));

    expect(messages).toContain('Email không đúng định dạng.');
    expect(messages).toContain('OTP phải gồm đúng 6 chữ số.');
    expect(messages).toContain('Mật khẩu phải có ít nhất 8 ký tự.');
  });

  it('returns Vietnamese messages for change password validation', async () => {
    const dto = new ChangePasswordDto();
    dto.currentPassword = '';
    dto.newPassword = 'short';

    const errors = await validate(dto);
    const messages = errors.flatMap((error) => Object.values(error.constraints ?? {}));

    expect(messages).toContain('Vui lòng nhập mật khẩu hiện tại.');
    expect(messages).toContain('Mật khẩu phải có ít nhất 8 ký tự.');
  });
});
