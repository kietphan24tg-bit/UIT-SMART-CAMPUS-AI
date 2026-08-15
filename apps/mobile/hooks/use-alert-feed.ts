import { getNotificationAlertCategory } from '@smart-campus/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  markFireAlertAsReadInAlertFeed,
  markFireAlertAsReadInOperationsSummary,
} from './use-schedule-screen';

import { notificationsApi, type DeleteNotificationsQuery } from '@/services/api/notifications';
import { safetyApi } from '@/services/api/safety';
import { useAuthStore } from '@/stores/auth-store';
import type {
  AlertCategory,
  AlertFeedItem,
  DashboardSnapshot,
  FireAlertRecord,
  NotificationRecord,
  OperationsSummaryState,
} from '@/types/app-data';
import { isAdminRole } from '@/utils/app';
import { repairMojibakeText } from '@/utils/text-encoding';

export function getAlertCategoryFromType(type?: string | null): AlertCategory {
  return getNotificationAlertCategory(repairMojibakeText(type));
}

export function toNotificationFeed(item: NotificationRecord): AlertFeedItem {
  const category = getAlertCategoryFromType(item.type);
  const data = item.data ?? {};
  const classCode = typeof data.classCode === 'string' ? data.classCode : null;
  const courseCode = typeof data.courseCode === 'string' ? data.courseCode : null;
  const courseName = typeof data.courseName === 'string' ? data.courseName : null;
  const room = typeof data.room === 'string' ? data.room : null;
  const date = typeof data.date === 'string' ? data.date : null;
  const totalScore = typeof data.totalScore === 'number' ? data.totalScore : null;
  const contextParts = [
    classCode,
    courseCode,
    room ? `Phòng ${repairMojibakeText(room)}` : null,
    date,
    totalScore != null ? `Điểm ${totalScore}` : null,
  ].filter(Boolean);

  return {
    id: item.id,
    kind: 'notification',
    title: repairMojibakeText(item.title),
    body: repairMojibakeText(item.body),
    timestamp: item.createdAt,
    severity:
      category === 'emergency'
        ? 'critical'
        : category === 'academic' || category === 'payment'
          ? 'warning'
          : 'normal',
    category,
    isRead: item.isRead,
    classCode,
    courseCode,
    courseName: courseName ? repairMojibakeText(courseName) : null,
    room: room ? repairMojibakeText(room) : null,
    notificationContext:
      contextParts.length > 0
        ? contextParts.map((part) => repairMojibakeText(String(part))).join(' · ')
        : courseName
          ? repairMojibakeText(courseName)
          : undefined,
  };
}

function toFireAlertFeed(item: FireAlertRecord): AlertFeedItem {
  const sensorContext = item.telemetrySnapshot
    ? `Gateway ${repairMojibakeText(item.gateId)} · IP ${repairMojibakeText(item.telemetrySnapshot.deviceIp || 'Chưa xác định')}`
    : `Gateway ${repairMojibakeText(item.gateId)}`;

  return {
    id: item.id,
    kind: 'fire_alert',
    title: 'Cảnh báo cháy bãi xe',
    body: repairMojibakeText(item.message),
    timestamp: item.reportedAt,
    severity: item.isResolved ? 'warning' : 'critical',
    category: 'emergency',
    isRead: item.isResolved,
    gateId: repairMojibakeText(item.gateId),
    deviceIp: item.telemetrySnapshot?.deviceIp
      ? repairMojibakeText(item.telemetrySnapshot.deviceIp)
      : null,
    sensorContext,
  };
}

function decrementUnreadCount(value: number, amount = 1) {
  return Math.max(value - amount, 0);
}

function markNotificationAsReadInAlertFeed(current: AlertFeedItem[] | undefined, id: string) {
  if (!current) {
    return current;
  }

  return current.map((item) =>
    item.kind === 'notification' && item.id === id && !item.isRead
      ? {
          ...item,
          isRead: true,
        }
      : item,
  );
}

function markAllNotificationsAsReadInAlertFeed(current: AlertFeedItem[] | undefined) {
  if (!current) {
    return current;
  }

  return current.map((item) =>
    item.kind === 'notification' && !item.isRead
      ? {
          ...item,
          isRead: true,
        }
      : item,
  );
}

function removeNotificationFromAlertFeed(current: AlertFeedItem[] | undefined, id: string) {
  if (!current) {
    return current;
  }

  return current.filter((item) => !(item.kind === 'notification' && item.id === id));
}

export function useAlertFeed(role?: string | null) {
  const canViewFireAlerts = isAdminRole(role);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const queryClient = useQueryClient();
  const alertFeedQueryKey = ['alert-feed', role] as const;
  const dashboardQueryKey = ['dashboard', role] as const;
  const operationsQueryKey = ['operations-summary', role] as const;

  const query = useQuery({
    queryKey: alertFeedQueryKey,
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
    enabled: isHydrated && isAuthenticated,
    placeholderData: [] as AlertFeedItem[],
  });

  const invalidateAlertData = () => {
    queryClient.invalidateQueries({ queryKey: alertFeedQueryKey });
    queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    queryClient.invalidateQueries({ queryKey: operationsQueryKey });
  };

  const markAsRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onMutate: async (id) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: alertFeedQueryKey }),
        queryClient.cancelQueries({ queryKey: dashboardQueryKey }),
        queryClient.cancelQueries({ queryKey: operationsQueryKey }),
      ]);

      const previousAlertFeed = queryClient.getQueryData<AlertFeedItem[]>(alertFeedQueryKey);
      const previousDashboard = queryClient.getQueryData<DashboardSnapshot>(dashboardQueryKey);
      const previousOperationsSummary =
        queryClient.getQueryData<OperationsSummaryState>(operationsQueryKey);
      const target = previousAlertFeed?.find(
        (item) => item.kind === 'notification' && item.id === id,
      );
      const shouldDecrement = Boolean(target && !target.isRead);

      queryClient.setQueryData<AlertFeedItem[] | undefined>(alertFeedQueryKey, (current) =>
        markNotificationAsReadInAlertFeed(current, id),
      );

      if (shouldDecrement) {
        queryClient.setQueryData<DashboardSnapshot | undefined>(dashboardQueryKey, (current) =>
          current
            ? {
                ...current,
                unreadCount: decrementUnreadCount(current.unreadCount),
              }
            : current,
        );
        queryClient.setQueryData<OperationsSummaryState | undefined>(
          operationsQueryKey,
          (current) =>
            current
              ? {
                  ...current,
                  unreadCount: decrementUnreadCount(current.unreadCount),
                }
              : current,
        );
      }

      return { previousAlertFeed, previousDashboard, previousOperationsSummary };
    },
    onError: (_error, _id, context) => {
      if (context) {
        queryClient.setQueryData(alertFeedQueryKey, context.previousAlertFeed);
        queryClient.setQueryData(dashboardQueryKey, context.previousDashboard);
        queryClient.setQueryData(operationsQueryKey, context.previousOperationsSummary);
      }
    },
    onSettled: invalidateAlertData,
  });

  const markAllAsRead = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onMutate: async () => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: alertFeedQueryKey }),
        queryClient.cancelQueries({ queryKey: dashboardQueryKey }),
        queryClient.cancelQueries({ queryKey: operationsQueryKey }),
      ]);

      const previousAlertFeed = queryClient.getQueryData<AlertFeedItem[]>(alertFeedQueryKey);
      const previousDashboard = queryClient.getQueryData<DashboardSnapshot>(dashboardQueryKey);
      const previousOperationsSummary =
        queryClient.getQueryData<OperationsSummaryState>(operationsQueryKey);

      queryClient.setQueryData<AlertFeedItem[] | undefined>(alertFeedQueryKey, (current) =>
        markAllNotificationsAsReadInAlertFeed(current),
      );
      queryClient.setQueryData<DashboardSnapshot | undefined>(dashboardQueryKey, (current) =>
        current
          ? {
              ...current,
              unreadCount: 0,
            }
          : current,
      );
      queryClient.setQueryData<OperationsSummaryState | undefined>(operationsQueryKey, (current) =>
        current
          ? {
              ...current,
              unreadCount: 0,
            }
          : current,
      );

      return { previousAlertFeed, previousDashboard, previousOperationsSummary };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(alertFeedQueryKey, context.previousAlertFeed);
        queryClient.setQueryData(dashboardQueryKey, context.previousDashboard);
        queryClient.setQueryData(operationsQueryKey, context.previousOperationsSummary);
      }
    },
    onSettled: invalidateAlertData,
  });

  const markFireAlertAsRead = useMutation({
    mutationFn: (id: string) => safetyApi.markFireAlertAsRead(id),
    onMutate: async (id) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: alertFeedQueryKey }),
        queryClient.cancelQueries({ queryKey: operationsQueryKey }),
      ]);

      const previousAlertFeed = queryClient.getQueryData<AlertFeedItem[]>(alertFeedQueryKey);
      const previousOperationsSummary =
        queryClient.getQueryData<OperationsSummaryState>(operationsQueryKey);

      queryClient.setQueryData<AlertFeedItem[] | undefined>(alertFeedQueryKey, (current) =>
        markFireAlertAsReadInAlertFeed(current, id),
      );
      queryClient.setQueryData<OperationsSummaryState | undefined>(operationsQueryKey, (current) =>
        markFireAlertAsReadInOperationsSummary(current, id),
      );

      return { previousAlertFeed, previousOperationsSummary };
    },
    onError: (_error, _id, context) => {
      if (context) {
        queryClient.setQueryData(alertFeedQueryKey, context.previousAlertFeed);
        queryClient.setQueryData(operationsQueryKey, context.previousOperationsSummary);
      }
    },
    onSettled: invalidateAlertData,
  });

  const deleteNotification = useMutation({
    mutationFn: (id: string) => notificationsApi.deleteNotification(id),
    onMutate: async (id) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: alertFeedQueryKey }),
        queryClient.cancelQueries({ queryKey: dashboardQueryKey }),
        queryClient.cancelQueries({ queryKey: operationsQueryKey }),
      ]);

      const previousAlertFeed = queryClient.getQueryData<AlertFeedItem[]>(alertFeedQueryKey);
      const previousDashboard = queryClient.getQueryData<DashboardSnapshot>(dashboardQueryKey);
      const previousOperationsSummary =
        queryClient.getQueryData<OperationsSummaryState>(operationsQueryKey);
      const target = previousAlertFeed?.find(
        (item) => item.kind === 'notification' && item.id === id,
      );
      const shouldDecrement = Boolean(target && !target.isRead);

      queryClient.setQueryData<AlertFeedItem[] | undefined>(alertFeedQueryKey, (current) =>
        removeNotificationFromAlertFeed(current, id),
      );

      if (shouldDecrement) {
        queryClient.setQueryData<DashboardSnapshot | undefined>(dashboardQueryKey, (current) =>
          current
            ? {
                ...current,
                unreadCount: decrementUnreadCount(current.unreadCount),
              }
            : current,
        );
        queryClient.setQueryData<OperationsSummaryState | undefined>(
          operationsQueryKey,
          (current) =>
            current
              ? {
                  ...current,
                  unreadCount: decrementUnreadCount(current.unreadCount),
                }
              : current,
        );
      }

      return { previousAlertFeed, previousDashboard, previousOperationsSummary };
    },
    onError: (_error, _id, context) => {
      if (context) {
        queryClient.setQueryData(alertFeedQueryKey, context.previousAlertFeed);
        queryClient.setQueryData(dashboardQueryKey, context.previousDashboard);
        queryClient.setQueryData(operationsQueryKey, context.previousOperationsSummary);
      }
    },
    onSettled: invalidateAlertData,
  });

  const deleteNotifications = useMutation({
    mutationFn: (deleteQuery: DeleteNotificationsQuery) =>
      notificationsApi.deleteNotifications(deleteQuery),
    onSettled: invalidateAlertData,
  });

  return {
    ...query,
    markAsRead: (id: string) => markAsRead.mutateAsync(id),
    markAllAsRead: () => markAllAsRead.mutateAsync(),
    markFireAlertAsRead: (id: string) => markFireAlertAsRead.mutateAsync(id),
    deleteNotification: (id: string) => deleteNotification.mutateAsync(id),
    deleteNotifications: (deleteQuery: DeleteNotificationsQuery) =>
      deleteNotifications.mutateAsync(deleteQuery),
    isMutating:
      markAsRead.isPending ||
      markAllAsRead.isPending ||
      markFireAlertAsRead.isPending ||
      deleteNotification.isPending ||
      deleteNotifications.isPending,
  };
}
