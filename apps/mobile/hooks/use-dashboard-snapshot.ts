import { USER_ROLES } from '@smart-campus/shared';
import { useQuery } from '@tanstack/react-query';

import { gradesApi } from '@/services/api/grades';
import { notificationsApi } from '@/services/api/notifications';
import { parkingApi } from '@/services/api/parking';
import { scheduleApi } from '@/services/api/schedule';
import type { DashboardSnapshot, GPASummary, ParkingStatus, ScheduleRecord } from '@/types/app-data';
import { getNextClass, getTelemetryHealthState, getTodaySchedule } from '@/utils/app';

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

  return useQuery({
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
    placeholderData: createEmptySnapshot(resolvedRole),
  });
}
