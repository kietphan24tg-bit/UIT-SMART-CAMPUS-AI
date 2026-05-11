import { getLocalizedErrorMessage, localizeErrorMessage } from '../error-message';

describe('error-message localization', () => {
  it('localizes class-validator email and password messages', () => {
    expect(localizeErrorMessage('email must be an email')).toBe(
      'Email kh\u00f4ng \u0111\u00fang \u0111\u1ecbnh d\u1ea1ng.',
    );
    expect(localizeErrorMessage('password must be longer than or equal to 8 characters')).toBe(
      'M\u1eadt kh\u1ea9u ph\u1ea3i c\u00f3 \u00edt nh\u1ea5t 8 k\u00fd t\u1ef1.',
    );
  });

  it('localizes OTP and student id validation messages', () => {
    expect(localizeErrorMessage('otp must match /^\\d{6}$/ regular expression')).toBe(
      'OTP ph\u1ea3i g\u1ed3m \u0111\u00fang 6 ch\u1eef s\u1ed1.',
    );
    expect(localizeErrorMessage('studentId must match /^\\d{8}$/ regular expression')).toBe(
      'M\u00e3 s\u1ed1 sinh vi\u00ean ph\u1ea3i g\u1ed3m \u0111\u00fang 8 ch\u1eef s\u1ed1.',
    );
  });

  it('localizes register conflict and server fallback messages', () => {
    expect(localizeErrorMessage('Email already exists')).toBe(
      'Email \u0111\u00e3 \u0111\u01b0\u1ee3c \u0111\u0103ng k\u00fd.',
    );
    expect(localizeErrorMessage('Internal server error')).toBe(
      'H\u1ec7 th\u1ed1ng \u0111ang b\u1eadn. Vui l\u00f2ng th\u1eed l\u1ea1i sau.',
    );
  });

  it('extracts and localizes fallback errors', () => {
    expect(
      getLocalizedErrorMessage(
        new Error('newPassword must be longer than or equal to 8 characters'),
        'fallback',
      ),
    ).toBe('M\u1eadt kh\u1ea9u ph\u1ea3i c\u00f3 \u00edt nh\u1ea5t 8 k\u00fd t\u1ef1.');
  });
});
