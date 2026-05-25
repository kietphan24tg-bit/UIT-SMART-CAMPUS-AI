import type {
  AdminUserListItem,
  AdminUserListPayload,
  AdminUserListQuery,
  ActiveUserRole,
  UpdateUserActiveRequest,
  UpdateUserRoleRequest,
  UserProfile,
} from '@smart-campus/shared';

import { apiClient, postMultipart } from './client';

function normalizeAdminUsersPayload(
  response: unknown,
  fallbackPage: number,
  fallbackLimit: number,
): AdminUserListPayload {
  const candidate =
    typeof response === 'object' &&
    response !== null &&
    'data' in response &&
    (response as { data?: unknown }).data !== undefined
      ? (response as { data?: unknown }).data
      : response;

  const items = Array.isArray(candidate)
    ? (candidate as AdminUserListItem[])
    : typeof candidate === 'object' &&
        candidate !== null &&
        'items' in candidate &&
        Array.isArray((candidate as { items?: unknown }).items)
      ? ((candidate as { items: AdminUserListItem[] }).items ?? [])
      : [];

  const rawMeta =
    typeof candidate === 'object' && candidate !== null && 'meta' in candidate
      ? (candidate as { meta?: Partial<AdminUserListPayload['meta']> }).meta
      : undefined;

  const total = typeof rawMeta?.total === 'number' ? rawMeta.total : items.length;
  const page = typeof rawMeta?.page === 'number' ? rawMeta.page : fallbackPage;
  const limit = typeof rawMeta?.limit === 'number' ? rawMeta.limit : fallbackLimit;
  const totalPages =
    typeof rawMeta?.totalPages === 'number'
      ? rawMeta.totalPages
      : Math.max(1, Math.ceil(total / Math.max(limit, 1)));

  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

export const usersApi = {
  getProfile: async (): Promise<UserProfile> => {
    return apiClient.get('/users/me');
  },

  listUsers: async (query: AdminUserListQuery = {}): Promise<AdminUserListPayload> => {
    const page = typeof query.page === 'number' ? query.page : 1;
    const limit = typeof query.limit === 'number' ? query.limit : 25;
    const response = await apiClient.get('/users', {
      params: {
        ...(typeof query.page === 'number' ? { page: query.page } : {}),
        ...(typeof query.limit === 'number' ? { limit: query.limit } : {}),
        ...(query.search?.trim() ? { search: query.search.trim() } : {}),
      },
    });

    return normalizeAdminUsersPayload(response, page, limit);
  },

  updateRole: async (userId: string, role: ActiveUserRole) => {
    return apiClient.patch(`/users/${encodeURIComponent(userId)}/role`, {
      role,
    } satisfies UpdateUserRoleRequest) as Promise<AdminUserListItem>;
  },

  updateActive: async (userId: string, isActive: boolean) => {
    return apiClient.patch(`/users/${encodeURIComponent(userId)}/active`, {
      isActive,
    } satisfies UpdateUserActiveRequest) as Promise<AdminUserListItem>;
  },

  deleteUser: async (userId: string) => {
    return apiClient.delete(`/users/${encodeURIComponent(userId)}`) as Promise<{
      id: string;
      deleted: true;
    }>;
  },

  uploadAvatar: async (uri: string, fileName = 'avatar.jpg', mimeType = 'image/jpeg') => {
    return postMultipart<UserProfile>('/users/me/avatar', {
      fieldName: 'avatar',
      uri,
      fileName,
      mimeType,
    });
  },
};
