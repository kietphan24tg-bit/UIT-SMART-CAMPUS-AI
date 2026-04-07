import { apiClient } from './client';

import type { NotificationRecord, NotificationsPayload } from '@/types/app-data';


export const notificationsApi = {
  getNotifications: async (page = 1, limit = 20): Promise<NotificationsPayload> => {
    return apiClient.get('/notifications', {
      params: { page, limit },
    }) as Promise<NotificationsPayload>;
  },

  getUnreadCount: async (): Promise<number> => {
    return apiClient.get('/notifications/unread-count') as Promise<number>;
  },

  markAsRead: async (id: string): Promise<NotificationRecord> => {
    return apiClient.patch(`/notifications/${id}/read`) as Promise<NotificationRecord>;
  },

  markAllAsRead: async (): Promise<{ count: number }> => {
    return apiClient.patch('/notifications/read-all') as Promise<{ count: number }>;
  },
};
