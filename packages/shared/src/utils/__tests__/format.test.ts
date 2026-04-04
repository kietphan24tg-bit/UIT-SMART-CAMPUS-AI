import { formatFullName, formatGPA, formatStudentId } from '../format';

describe('formatFullName', () => {
  it('should format Vietnamese full name (lastName firstName)', () => {
    expect(formatFullName('An', 'Nguyen Van')).toBe('Nguyen Van An');
  });

  it('should trim whitespace', () => {
    expect(formatFullName('', 'Nguyen')).toBe('Nguyen');
    expect(formatFullName('An', '')).toBe('An');
  });
});

describe('formatGPA', () => {
  it('should format GPA on 4-point scale with 2 decimals', () => {
    expect(formatGPA(3.71)).toBe('3.71');
    expect(formatGPA(4.0)).toBe('4.00');
    expect(formatGPA(0)).toBe('0.00');
  });

  it('should format GPA on 10-point scale with 1 decimal', () => {
    expect(formatGPA(8.5, 10)).toBe('8.5');
    expect(formatGPA(10.0, 10)).toBe('10.0');
  });
});

describe('formatStudentId', () => {
  it('should uppercase the student ID', () => {
    expect(formatStudentId('22520001')).toBe('22520001');
    expect(formatStudentId('abc')).toBe('ABC');
  });
});
