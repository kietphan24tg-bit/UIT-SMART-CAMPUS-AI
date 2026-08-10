import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { gradesApi } from '@/services/api/grades';
import { notificationsApi } from '@/services/api/notifications';
import { parkingApi } from '@/services/api/parking';
import { safetyApi } from '@/services/api/safety';
import { scheduleApi } from '@/services/api/schedule';
import { useAuthStore } from '@/stores/auth-store';
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
import { isAdminRole } from '@/utils/app';

export function useScheduleScreenData(selectedSemesterId?: string) {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const canQuery = isHydrated && isAuthenticated;

  const allSemestersQuery = useQuery({
    queryKey: ['schedule', 'semesters-with-sessions'],
    queryFn: scheduleApi.getAllSemestersWithSchedules,
    enabled: canQuery,
  });

  const resolvedSemesterId =
    selectedSemesterId ??
    allSemestersQuery.data?.find((item) => item.isCurrent)?.id ??
    allSemestersQuery.data?.[0]?.id;

  const scheduleQuery = useQuery({
    queryKey: ['schedule', 'semester', resolvedSemesterId],
    queryFn: () => scheduleApi.getScheduleBySemesterId(resolvedSemesterId as string),
    enabled: canQuery && Boolean(resolvedSemesterId),
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

export function useOperationsScreenData(role?: string | null) {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const queryClient = useQueryClient();
  const connectionState = useParkingRealtimeStore(
    (state) => state.connectionState,
  );
  const canViewTelemetry = isAdminRole(role);
  const canViewFireAlerts = isAdminRole(role);

  const query = useQuery({
    queryKey: ['operations-summary', role],
    queryFn: async (): Promise<OperationsSummaryState> => {
      const [parking, telemetry, fireAlerts, unreadCount, gpa] = await Promise.all([
        parkingApi.getStatus().catch(() => null as ParkingStatus | null),
        canViewTelemetry
          ? safetyApi.getLatestTelemetry().catch(() => null as TelemetrySnapshotRecord | null)
          : Promise.resolve(null as TelemetrySnapshotRecord | null),
        canViewFireAlerts
          ? safetyApi.getFireAlerts(1, 10).catch(
              () =>
                ({
                  items: [],
                  meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
                }) as FireAlertsPayload,
            )
          : Promise.resolve({
              items: [],
              meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
            } as FireAlertsPayload),
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
    enabled: isHydrated && isAuthenticated,
    refetchInterval: (query) => {
      if (connectionState === 'live') return false;
      return query.state.error ? 60_000 : 10_000;
    },
  });

  const invalidateOperationsData = () => {
    queryClient.invalidateQueries({ queryKey: ['operations-summary', role] });
    queryClient.invalidateQueries({ queryKey: ['alert-feed', role] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', role] });
  };

  const deleteFireAlert = useMutation({
    mutationFn: (id: string) => safetyApi.deleteFireAlert(id),
    onSuccess: invalidateOperationsData,
  });

  const deleteFireAlerts = useMutation({
    mutationFn: safetyApi.deleteFireAlerts,
    onSuccess: invalidateOperationsData,
  });

  return {
    ...query,
    deleteFireAlert: (id: string) => deleteFireAlert.mutateAsync(id),
    deleteFireAlerts: () => deleteFireAlerts.mutateAsync(),
    isMutatingFireAlerts: deleteFireAlert.isPending || deleteFireAlerts.isPending,
  };
}
