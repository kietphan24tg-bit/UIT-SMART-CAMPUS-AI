import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { notificationsApi } from '@/services/api/notifications';
import { safetyApi } from '@/services/api/safety';
import type { AlertFeedItem, FireAlertRecord, NotificationRecord } from '@/types/app-data';
import { isAdminRole } from '@/utils/app';

function toNotificationFeed(item: NotificationRecord): AlertFeedItem {
  return {
    id: item.id,
    kind: 'notification',
    title: item.title,
    body: item.body,
    timestamp: item.createdAt,
    severity:
      item.type === 'fire_alert'
        ? 'critical'
        : item.type === 'system' || item.type === 'deadline'
          ? 'warning'
          : 'normal',
    isRead: item.isRead,
  };
}

function toFireAlertFeed(item: FireAlertRecord): AlertFeedItem {
  const sensorContext = item.telemetrySnapshot
    ? `IP gateway: ${item.telemetrySnapshot.deviceIp || 'Chưa xác định'}`
    : 'Không có snapshot cảm biến đi kèm.';

  return {
    id: item.id,
    kind: 'fire_alert',
    title: 'Cảnh báo cháy bãi xe',
    body: item.message,
    timestamp: item.reportedAt,
    severity: item.isResolved ? 'warning' : 'critical',
    isRead: item.isResolved,
    gateId: item.gateId,
    deviceIp: item.telemetrySnapshot?.deviceIp ?? null,
    sensorContext,
  };
}

export function useAlertFeed(role?: string | null) {
  const canViewFireAlerts = isAdminRole(role);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['alert-feed', role],
    queryFn: async (): Promise<AlertFeedItem[]> => {
      const [notifications, fireAlerts] = await Promise.all([
        notificationsApi.getNotifications(1, 20),
        canViewFireAlerts
          ? safetyApi.getFireAlerts(1, 20)
          : Promise.resolve({
              items: [],
              meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
            }),
      ]);

      return [
        ...fireAlerts.items.map(toFireAlertFeed),
        ...notifications.items.map(toNotificationFeed),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    placeholderData: [] as AlertFeedItem[],
  });

  const markAsRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-feed', role] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', role] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-feed', role] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', role] });
    },
  });

  return {
    ...query,
    markAsRead: (id: string) => markAsRead.mutateAsync(id),
    markAllAsRead: () => markAllAsRead.mutateAsync(),
    isMutating: markAsRead.isPending || markAllAsRead.isPending,
  };
}
