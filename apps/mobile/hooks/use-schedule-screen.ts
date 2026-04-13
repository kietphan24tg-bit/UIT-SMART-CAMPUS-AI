import { useQuery } from '@tanstack/react-query';

import { gradesApi } from '@/services/api/grades';
import { notificationsApi } from '@/services/api/notifications';
import { parkingApi } from '@/services/api/parking';
import { safetyApi } from '@/services/api/safety';
import { scheduleApi } from '@/services/api/schedule';
import { useParkingRealtimeStore } from '@/stores/parking-realtime-store';
import type {
  FireAlertsPayload,
  GPASummary,
  OperationsSummaryState,
  ParkingStatus,
  ScheduleRecord,
  SemesterScheduleRecord,
  SemesterRecord,
  TelemetrySnapshotRecord,
} from '@/types/app-data';

export function useScheduleScreenData(selectedSemesterId?: string) {
  const allSemestersQuery = useQuery({
    queryKey: ['schedule', 'semesters-with-sessions'],
    queryFn: scheduleApi.getAllSemestersWithSchedules,
  });

  const resolvedSemesterId =
    selectedSemesterId ??
    allSemestersQuery.data?.find((item) => item.isCurrent)?.id ??
    allSemestersQuery.data?.[0]?.id;

  const scheduleQuery = useQuery({
    queryKey: ['schedule', 'semester', resolvedSemesterId],
    queryFn: () => scheduleApi.getScheduleBySemesterId(resolvedSemesterId as string),
    enabled: Boolean(resolvedSemesterId),
    placeholderData: undefined as SemesterScheduleRecord | undefined,
  });

  return {
    semesters:
      allSemestersQuery.data?.map(({ id, name, academicYear, term, startDate, endDate, isCurrent }) => ({
        id,
        name,
        academicYear,
        term,
        startDate,
        endDate,
        isCurrent,
      })) ?? ([] as SemesterRecord[]),
    resolvedSemesterId,
    isLoading: allSemestersQuery.isLoading || scheduleQuery.isLoading,
    isError: allSemestersQuery.isError || scheduleQuery.isError,
    error: allSemestersQuery.error ?? scheduleQuery.error,
    refetch: async () => {
      await Promise.all([allSemestersQuery.refetch(), scheduleQuery.refetch()]);
    },
    schedule: scheduleQuery.data?.sessions ?? ([] as ScheduleRecord[]),
  };
}

export function useOperationsScreenData() {
  const connectionState = useParkingRealtimeStore(
    (state) => state.connectionState,
  );

  return useQuery({
    queryKey: ['operations-summary'],
    queryFn: async (): Promise<OperationsSummaryState> => {
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
        gradesApi.getGradesSummary().catch(() => null as GPASummary | null),
      ]);

      return {
        parking,
        telemetry,
        fireAlerts,
        unreadCount,
        gpa,
      };
    },
    refetchInterval: connectionState === 'live' ? false : 10_000,
  });
}
