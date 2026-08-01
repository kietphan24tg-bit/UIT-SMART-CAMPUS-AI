export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const UIT_EMAIL_PATTERN = /^[^\s@]+@(gm\.)?uit\.edu\.vn$/i;

export function normalizeEmail(email: string): string {
  return String(email || '')
    .trim()
    .toLowerCase();
}

export function isValidUitEmail(email: string): boolean {
  return UIT_EMAIL_PATTERN.test(normalizeEmail(email));
}

export function isValidStudentId(studentId: string): boolean {
  const studentIdRegex = /^\d{8}$/;
  return studentIdRegex.test(studentId);
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
}
