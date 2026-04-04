import { isStrongPassword, isValidEmail, isValidStudentId } from '../validation';

describe('isValidEmail', () => {
  it('should return true for valid emails', () => {
    expect(isValidEmail('user@uit.edu.vn')).toBe(true);
    expect(isValidEmail('student@gm.uit.edu.vn')).toBe(true);
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('should return false for invalid emails', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('@no-local.com')).toBe(false);
    expect(isValidEmail('no-domain@')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
  });
});

describe('isValidStudentId', () => {
  it('should return true for valid 8-digit IDs', () => {
    expect(isValidStudentId('22520001')).toBe(true);
    expect(isValidStudentId('12345678')).toBe(true);
  });

  it('should return false for invalid student IDs', () => {
    expect(isValidStudentId('')).toBe(false);
    expect(isValidStudentId('1234567')).toBe(false);
    expect(isValidStudentId('123456789')).toBe(false);
    expect(isValidStudentId('abcdefgh')).toBe(false);
    expect(isValidStudentId('2252 001')).toBe(false);
  });
});

describe('isStrongPassword', () => {
  it('should return true for strong passwords', () => {
    expect(isStrongPassword('Password1')).toBe(true);
    expect(isStrongPassword('MyP@ss123')).toBe(true);
    expect(isStrongPassword('Abcdefg1')).toBe(true);
  });

  it('should return false for weak passwords', () => {
    expect(isStrongPassword('short')).toBe(false);
    expect(isStrongPassword('alllowercase1')).toBe(false);
    expect(isStrongPassword('NoDigits')).toBe(false);
    expect(isStrongPassword('12345678')).toBe(false);
    expect(isStrongPassword('')).toBe(false);
  });
});
