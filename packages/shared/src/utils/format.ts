export function formatFullName(firstName: string, lastName: string): string {
  return `${lastName} ${firstName}`.trim();
}

export function formatGPA(gpa: number, scale: 4 | 10 = 4): string {
  return gpa.toFixed(scale === 4 ? 2 : 1);
}

export function formatStudentId(id: string): string {
  return id.toUpperCase();
}
