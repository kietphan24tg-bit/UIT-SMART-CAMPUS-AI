import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { gradesApi } from '@/services/api/grades';
import { notificationsApi } from '@/services/api/notifications';
import { parkingApi } from '@/services/api/parking';
import { safetyApi } from '@/services/api/safety';
import { scheduleApi } from '@/services/api/schedule';
import { useAuthStore } from '@/stores/auth-store';
import { useParkingRealtimeStore } from '@/stores/parking-realtime-store';
import type {
  AlertFeedItem,
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

function updateFireAlertsMeta(
  payload: FireAlertsPayload,
  nextItems: FireAlertsPayload['items'],
  nextTotal: number,
  nextUnresolvedTotal = payload.meta.unresolvedTotal,
): FireAlertsPayload {
  const safeTotal = Math.max(nextTotal, 0);
  const safeLimit = Math.max(payload.meta.limit, 1);
  const safeUnresolvedTotal =
    typeof nextUnresolvedTotal === 'number' ? Math.max(nextUnresolvedTotal, 0) : undefined;

  return {
    ...payload,
    items: nextItems,
    meta: {
      ...payload.meta,
      total: safeTotal,
      unresolvedTotal: safeUnresolvedTotal,
      totalPages: Math.max(1, Math.ceil(safeTotal / safeLimit)),
    },
  };
}

export function getUnreadFireAlertsCount(payload?: FireAlertsPayload | null) {
  if (!payload) {
    return 0;
  }

  if (typeof payload.meta.unresolvedTotal === 'number') {
    return Math.max(payload.meta.unresolvedTotal, 0);
  }

  return payload.items.filter((item) => !item.isResolved).length;
}

export function removeFireAlertFromOperationsSummary(
  current: OperationsSummaryState | undefined,
  id: string,
) {
  if (!current) {
    return current;
  }

  const removedItem = current.fireAlerts.items.find((item) => item.id === id);
  const nextItems = current.fireAlerts.items.filter((item) => item.id !== id);
  if (!removedItem) {
    return current;
  }

  return {
    ...current,
    fireAlerts: updateFireAlertsMeta(
      current.fireAlerts,
      nextItems,
      Math.max(current.fireAlerts.meta.total - 1, nextItems.length),
      removedItem.isResolved
        ? getUnreadFireAlertsCount(current.fireAlerts)
        : getUnreadFireAlertsCount(current.fireAlerts) - 1,
    ),
  };
}

export function clearFireAlertsFromOperationsSummary(current: OperationsSummaryState | undefined) {
  if (!current) {
    return current;
  }

  if (current.fireAlerts.items.length === 0 && current.fireAlerts.meta.total === 0) {
    return current;
  }

  return {
    ...current,
    fireAlerts: updateFireAlertsMeta(current.fireAlerts, [], 0, 0),
  };
}

export function markFireAlertAsReadInOperationsSummary(
  current: OperationsSummaryState | undefined,
  id: string,
  resolvedAt = new Date().toISOString(),
) {
  if (!current) {
    return current;
  }

  const target = current.fireAlerts.items.find((item) => item.id === id);
  if (!target || target.isResolved) {
    return current;
  }

  return {
    ...current,
    fireAlerts: updateFireAlertsMeta(
      current.fireAlerts,
      current.fireAlerts.items.map((item) =>
        item.id === id
          ? {
              ...item,
              isResolved: true,
              resolvedAt,
            }
          : item,
      ),
      current.fireAlerts.meta.total,
      getUnreadFireAlertsCount(current.fireAlerts) - 1,
    ),
  };
}

export function removeFireAlertFromAlertFeed(current: AlertFeedItem[] | undefined, id: string) {
  if (!current) {
    return current;
  }

  return current.filter((item) => !(item.kind === 'fire_alert' && item.id === id));
}

export function clearFireAlertsFromAlertFeed(current: AlertFeedItem[] | undefined) {
  if (!current) {
    return current;
  }

  return current.filter((item) => item.kind !== 'fire_alert');
}

export function markFireAlertAsReadInAlertFeed(current: AlertFeedItem[] | undefined, id: string) {
  if (!current) {
    return current;
  }

  return current.map((item) =>
    item.kind === 'fire_alert' && item.id === id && !item.isRead
      ? {
          ...item,
          isRead: true,
          severity: 'warning' as const,
        }
      : item,
  );
}

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
  const operationsQueryKey = ['operations-summary', role] as const;
  const alertFeedQueryKey = ['alert-feed', role] as const;
  const dashboardQueryKey = ['dashboard', role] as const;

  const query = useQuery({
    queryKey: operationsQueryKey,
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
                  meta: { total: 0, unresolvedTotal: 0, page: 1, limit: 10, totalPages: 1 },
                }) as FireAlertsPayload,
            )
          : Promise.resolve({
              items: [],
              meta: { total: 0, unresolvedTotal: 0, page: 1, limit: 10, totalPages: 1 },
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
      if (connectionState === 'live') return 15_000;
      return query.state.error ? 60_000 : 10_000;
    },
  });

  const invalidateOperationsData = () => {
    queryClient.invalidateQueries({ queryKey: operationsQueryKey });
    queryClient.invalidateQueries({ queryKey: alertFeedQueryKey });
    queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
  };

  const deleteFireAlert = useMutation({
    mutationFn: (id: string) => safetyApi.deleteFireAlert(id),
    onMutate: async (id) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: operationsQueryKey }),
        queryClient.cancelQueries({ queryKey: alertFeedQueryKey }),
      ]);

      const previousOperationsSummary =
        queryClient.getQueryData<OperationsSummaryState>(operationsQueryKey);
      const previousAlertFeed = queryClient.getQueryData<AlertFeedItem[]>(alertFeedQueryKey);

      queryClient.setQueryData<OperationsSummaryState | undefined>(operationsQueryKey, (current) =>
        removeFireAlertFromOperationsSummary(current, id),
      );
      queryClient.setQueryData<AlertFeedItem[] | undefined>(alertFeedQueryKey, (current) =>
        removeFireAlertFromAlertFeed(current, id),
      );

      return { previousOperationsSummary, previousAlertFeed };
    },
    onError: (_error, _id, context) => {
      if (context) {
        queryClient.setQueryData(operationsQueryKey, context.previousOperationsSummary);
        queryClient.setQueryData(alertFeedQueryKey, context.previousAlertFeed);
      }
    },
    onSettled: invalidateOperationsData,
  });

  const deleteFireAlerts = useMutation({
    mutationFn: safetyApi.deleteFireAlerts,
    onMutate: async () => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: operationsQueryKey }),
        queryClient.cancelQueries({ queryKey: alertFeedQueryKey }),
      ]);

      const previousOperationsSummary =
        queryClient.getQueryData<OperationsSummaryState>(operationsQueryKey);
      const previousAlertFeed = queryClient.getQueryData<AlertFeedItem[]>(alertFeedQueryKey);

      queryClient.setQueryData<OperationsSummaryState | undefined>(operationsQueryKey, (current) =>
        clearFireAlertsFromOperationsSummary(current),
      );
      queryClient.setQueryData<AlertFeedItem[] | undefined>(alertFeedQueryKey, (current) =>
        clearFireAlertsFromAlertFeed(current),
      );

      return { previousOperationsSummary, previousAlertFeed };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(operationsQueryKey, context.previousOperationsSummary);
        queryClient.setQueryData(alertFeedQueryKey, context.previousAlertFeed);
      }
    },
    onSettled: invalidateOperationsData,
  });

  const markFireAlertAsRead = useMutation({
    mutationFn: (id: string) => safetyApi.markFireAlertAsRead(id),
    onMutate: async (id) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: operationsQueryKey }),
        queryClient.cancelQueries({ queryKey: alertFeedQueryKey }),
      ]);

      const previousOperationsSummary =
        queryClient.getQueryData<OperationsSummaryState>(operationsQueryKey);
      const previousAlertFeed = queryClient.getQueryData<AlertFeedItem[]>(alertFeedQueryKey);

      queryClient.setQueryData<OperationsSummaryState | undefined>(operationsQueryKey, (current) =>
        markFireAlertAsReadInOperationsSummary(current, id),
      );
      queryClient.setQueryData<AlertFeedItem[] | undefined>(alertFeedQueryKey, (current) =>
        markFireAlertAsReadInAlertFeed(current, id),
      );

      return { previousOperationsSummary, previousAlertFeed };
    },
    onError: (_error, _id, context) => {
      if (context) {
        queryClient.setQueryData(operationsQueryKey, context.previousOperationsSummary);
        queryClient.setQueryData(alertFeedQueryKey, context.previousAlertFeed);
      }
    },
    onSettled: invalidateOperationsData,
  });

  return {
    ...query,
    deleteFireAlert: (id: string) => deleteFireAlert.mutateAsync(id),
    deleteFireAlerts: () => deleteFireAlerts.mutateAsync(),
    markFireAlertAsRead: (id: string) => markFireAlertAsRead.mutateAsync(id),
    isMutatingFireAlerts:
      deleteFireAlert.isPending || deleteFireAlerts.isPending || markFireAlertAsRead.isPending,
  };
}
