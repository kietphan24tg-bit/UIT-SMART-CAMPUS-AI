import type { UserRole } from '../constants/roles';

export interface AdminUserListQuery {
  page?: number;
  limit?: number;
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  studentId: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  faculty: string | null;
  major: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDetail extends AdminUserListItem {
  phone: string | null;
  dateOfBirth: string | null;
  address: string | null;
  avatarUrl: string | null;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

export interface UpdateUserActiveRequest {
  isActive: boolean;
}
