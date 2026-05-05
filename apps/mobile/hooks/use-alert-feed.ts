import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { notificationsApi } from '@/services/api/notifications';
import { safetyApi } from '@/services/api/safety';
import { useAuthStore } from '@/stores/auth-store';
import type {
  AlertCategory,
  AlertFeedItem,
  FireAlertRecord,
  NotificationRecord,
} from '@/types/app-data';
import { isAdminRole } from '@/utils/app';

function repairMojibakeText(value?: string | null) {
  if (!value || !/[ÃÂÄÆ]/.test(value)) {
    return value ?? '';
  }

  try {
    return Buffer.from(value, 'latin1').toString('utf8');
  } catch {
    return value;
  }
}

export function getAlertCategoryFromType(type?: string | null): AlertCategory {
  const normalized = repairMojibakeText(type).toLowerCase();

  if (normalized.includes('fire')) {
    return 'emergency';
  }

  if (
    normalized.includes('pay') ||
    normalized.includes('bill') ||
    normalized.includes('invoice') ||
    normalized.includes('transaction')
  ) {
    return 'payment';
  }

  if (
    normalized.includes('academic') ||
    normalized.includes('grade') ||
    normalized.includes('schedule') ||
    normalized.includes('class') ||
    normalized.includes('course') ||
    normalized.includes('attendance') ||
    normalized.includes('registration') ||
    normalized.includes('deadline') ||
    normalized.includes('exam')
  ) {
    return 'academic';
  }

  return 'general';
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

export function useAlertFeed(role?: string | null) {
  const canViewFireAlerts = isAdminRole(role);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
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
    enabled: isHydrated && isAuthenticated,
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
