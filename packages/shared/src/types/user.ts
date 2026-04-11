import type { UserRole } from '../constants/roles';

export interface User {
  id: string;
  email: string;
  studentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  faculty?: string;
  major?: string;
  yearOfAdmission?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends Omit<User, 'createdAt' | 'updatedAt'> {
  phone?: string;
  dateOfBirth?: string;
  address?: string;
}
