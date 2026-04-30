import { apiClient } from './client';

import type {
  NotificationAudience,
  NotificationBroadcastResult,
  NotificationType,
} from '@smart-campus/shared';
import type { NotificationRecord, NotificationsPayload } from '@/types/app-data';

export interface RegisterPushTokenRequest {
  expoPushToken: string;
  platform: 'ios' | 'android';
  deviceId?: string;
}

export interface RemovePushTokenRequest {
  expoPushToken: string;
}

export interface BroadcastNotificationRequest {
  title: string;
  body: string;
  type?: NotificationType;
  data?: Record<string, unknown>;
  audience: NotificationAudience;
}

export const notificationsApi = {
  getNotifications: async (page = 1, limit = 20): Promise<NotificationsPayload> => {
    return apiClient.get('/notifications', {
      params: { page, limit },
    }) as Promise<NotificationsPayload>;
  },

  getUnreadCount: async (): Promise<number> => {
    return apiClient.get('/notifications/unread-count') as Promise<number>;
  },

  getNotification: async (id: string): Promise<NotificationRecord> => {
    return apiClient.get(`/notifications/${encodeURIComponent(id)}`) as Promise<NotificationRecord>;
  },

  markAsRead: async (id: string): Promise<NotificationRecord> => {
    return apiClient.patch(`/notifications/${id}/read`) as Promise<NotificationRecord>;
  },

  markAllAsRead: async (): Promise<{ count: number }> => {
    return apiClient.patch('/notifications/read-all') as Promise<{ count: number }>;
  },

  broadcast: async (payload: BroadcastNotificationRequest): Promise<NotificationBroadcastResult> => {
    return apiClient.post('/notifications', payload) as Promise<NotificationBroadcastResult>;
  },

  registerPushToken: async (payload: RegisterPushTokenRequest) => {
    return apiClient.post('/notifications/push-token', payload);
  },

  removePushToken: async (payload: RemovePushTokenRequest) => {
    return apiClient.delete('/notifications/push-token', { data: payload });
  },
};
