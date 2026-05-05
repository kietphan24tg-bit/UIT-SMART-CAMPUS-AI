import { USER_ROLES } from '@smart-campus/shared';
import { useQuery } from '@tanstack/react-query';

import { gradesApi } from '@/services/api/grades';
import { notificationsApi } from '@/services/api/notifications';
import { parkingApi } from '@/services/api/parking';
import { scheduleApi } from '@/services/api/schedule';
import { useAuthStore } from '@/stores/auth-store';
import { useParkingRealtimeStore } from '@/stores/parking-realtime-store';
import type { DashboardSnapshot, GPASummary, ParkingStatus, ScheduleRecord } from '@/types/app-data';
import { getNextClass, getTelemetryHealthState, getTodaySchedule } from '@/utils/app';
import { useNowTick } from './use-now-tick';

function createEmptySnapshot(role: string): DashboardSnapshot {
  return {
    role,
    todayClasses: [],
    nextClass: null,
    gpa: null,
    unreadCount: 0,
    parking: null,
    telemetryHealth: 'no-data',
  };
}

export function useDashboardSnapshot(role?: string | null) {
  const resolvedRole = role ?? USER_ROLES.STUDENT;
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const connectionState = useParkingRealtimeStore(
    (state) => state.connectionState,
  );

  const query = useQuery({
    queryKey: ['dashboard', resolvedRole],
    queryFn: async (): Promise<DashboardSnapshot> => {
      const isAcademicRole =
        resolvedRole === USER_ROLES.STUDENT || resolvedRole === USER_ROLES.LECTURER;

      const [schedule, gpa, unreadCount, parking] = await Promise.all([
        isAcademicRole
          ? scheduleApi
              .getCurrentSchedule()
              .then((semester) => semester.sessions)
              .catch(() => [] as ScheduleRecord[])
          : Promise.resolve<ScheduleRecord[]>([]),
        isAcademicRole
          ? gradesApi.getGradesSummary().catch(() => null as GPASummary | null)
          : Promise.resolve<GPASummary | null>(null),
        notificationsApi.getUnreadCount().catch(() => 0),
        parkingApi.getStatus().catch(() => null as ParkingStatus | null),
      ]);

      const todayClasses = getTodaySchedule(schedule);
      const nextClass = getNextClass(schedule);
      const telemetryHealth = getTelemetryHealthState(
        parking?.lastUpdated ?? parking?.sensors.reportedAt ?? null,
        parking?.sensors.fireDetected,
        !parking,
      );

      return {
        role: resolvedRole,
        todayClasses,
        nextClass,
        gpa,
        unreadCount,
        parking,
        telemetryHealth,
      };
    },
    enabled: isHydrated && isAuthenticated,
    placeholderData: createEmptySnapshot(resolvedRole),
    refetchInterval: connectionState === 'live' ? false : 10_000,
  });
  useNowTick(10_000);

  const snapshot = query.data ?? createEmptySnapshot(resolvedRole);

  return {
    ...query,
    data: {
      ...snapshot,
      telemetryHealth: getTelemetryHealthState(
        snapshot.parking?.lastUpdated ?? snapshot.parking?.sensors.reportedAt ?? null,
        snapshot.parking?.sensors.fireDetected,
        connectionState === 'degraded' && !snapshot.parking,
      ),
    },
  };
}
