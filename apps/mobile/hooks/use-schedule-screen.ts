import { useQuery } from '@tanstack/react-query';

import { gradesApi } from '@/services/api/grades';
import { notificationsApi } from '@/services/api/notifications';
import { parkingApi } from '@/services/api/parking';
import { safetyApi } from '@/services/api/safety';
import { scheduleApi } from '@/services/api/schedule';
import type {
  FireAlertsPayload,
  GPASummary,
  ParkingStatus,
  ScheduleRecord,
  SemesterRecord,
  TelemetrySnapshotRecord,
} from '@/types/app-data';

export function useScheduleScreenData(selectedSemesterId?: string) {
  const semestersQuery = useQuery({
    queryKey: ['semesters'],
    queryFn: scheduleApi.getSemesters,
  });

  const resolvedSemesterId =
    selectedSemesterId ??
    semestersQuery.data?.find((item) => item.isCurrent)?.id ??
    semestersQuery.data?.[0]?.id;

  const scheduleQuery = useQuery({
    queryKey: ['schedule', resolvedSemesterId],
    queryFn: () => scheduleApi.getSchedule(resolvedSemesterId),
    enabled: Boolean(resolvedSemesterId),
    placeholderData: [] as ScheduleRecord[],
  });

  return {
    semesters: semestersQuery.data ?? ([] as SemesterRecord[]),
    resolvedSemesterId,
    isLoading: semestersQuery.isLoading || scheduleQuery.isLoading,
    isError: semestersQuery.isError || scheduleQuery.isError,
    error: semestersQuery.error ?? scheduleQuery.error,
    refetch: async () => {
      await Promise.all([semestersQuery.refetch(), scheduleQuery.refetch()]);
    },
    schedule: scheduleQuery.data ?? ([] as ScheduleRecord[]),
  };
}

export function useOperationsScreenData() {
  return useQuery({
    queryKey: ['operations-summary'],
    queryFn: async () => {
      const [parking, telemetry, fireAlerts, unreadCount, gpa] = await Promise.all([
        parkingApi.getStatus().catch(() => null as ParkingStatus | null),
        safetyApi.getLatestTelemetry().catch(() => null as TelemetrySnapshotRecord | null),
        safetyApi.getFireAlerts(1, 10).catch(
          () =>
            ({
              items: [],
              meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
            }) as FireAlertsPayload,
        ),
        notificationsApi.getUnreadCount().catch(() => 0),
        gradesApi.getGpa().catch(() => null as GPASummary | null),
      ]);

      return {
        parking,
        telemetry,
        fireAlerts,
        unreadCount,
        gpa,
      };
    },
  });
}
