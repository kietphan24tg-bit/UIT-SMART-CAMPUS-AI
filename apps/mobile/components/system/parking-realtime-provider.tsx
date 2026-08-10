import type { ParkingStatus } from '@smart-campus/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { AppState } from 'react-native';
import { io } from 'socket.io-client';

import { API_ORIGIN } from '@/services/api/client';
import {
  applyParkingStatusToDashboard,
  applyParkingStatusToOperationsSummary,
  applyParkingStatusToParkingOverview,
  applyTelemetryToOperationsSummary,
} from '@/services/realtime/parking-realtime-cache';
import { useParkingRealtimeStore } from '@/stores/parking-realtime-store';
import type {
  DashboardSnapshot,
  OperationsSummaryState,
  ParkingOverviewState,
  TelemetrySnapshotRecord,
} from '@/types/app-data';

const DEFAULT_GATE_ID = 'uit-gate-a';

export function ParkingRealtimeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const setConnectionState = useParkingRealtimeStore(
    (state) => state.setConnectionState,
  );

  useEffect(() => {
    const socket = io(`${API_ORIGIN}/parking-live`, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      timeout: 10000,
    });

    const invalidateRealtimeQueries = () => {
      void queryClient.invalidateQueries({ queryKey: ['parking-overview'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['operations-summary'] });
    };

    const subscribeToGate = () => {
      socket.emit('parking:subscribe', { gateId: DEFAULT_GATE_ID });
    };

    socket.on('connect', () => {
      setConnectionState('live');
      subscribeToGate();
      invalidateRealtimeQueries();
    });
    socket.on('disconnect', () => {
      setConnectionState('degraded');
    });
    socket.on('connect_error', () => {
      setConnectionState('degraded');
    });
    socket.on('parking:status_updated', (status: ParkingStatus) => {
      setConnectionState('live');
      queryClient.setQueryData<ParkingOverviewState | undefined>(
        ['parking-overview'],
        (previous) => applyParkingStatusToParkingOverview(previous, status),
      );
      queryClient.setQueriesData<DashboardSnapshot | undefined>(
        { queryKey: ['dashboard'] },
        (previous) => applyParkingStatusToDashboard(previous, status),
      );
      queryClient.setQueriesData<OperationsSummaryState | undefined>(
        { queryKey: ['operations-summary'] },
        (previous) => applyParkingStatusToOperationsSummary(previous, status),
      );
    });
    socket.on(
      'parking:telemetry_updated',
      (telemetry: TelemetrySnapshotRecord) => {
        setConnectionState('live');
        const previousOperationsSummaries =
          queryClient.getQueriesData<OperationsSummaryState | undefined>({
            queryKey: ['operations-summary'],
          });
        const shouldRefreshAlerts =
          (previousOperationsSummaries.length === 0 && telemetry.fireDetected) ||
          previousOperationsSummaries.some(([, previous]) => {
            if (!previous?.telemetry) {
              return telemetry.fireDetected;
            }

            return telemetry.fireDetected && !previous.telemetry.fireDetected;
          });

        queryClient.setQueriesData<OperationsSummaryState | undefined>(
          { queryKey: ['operations-summary'] },
          (previous) => applyTelemetryToOperationsSummary(previous, telemetry),
        );

        if (shouldRefreshAlerts) {
          void queryClient.invalidateQueries({ queryKey: ['operations-summary'] });
          void queryClient.invalidateQueries({ queryKey: ['alert-feed'] });
          void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
      },
    );

    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextState) => {
        if (nextState === 'active' && !socket.connected) {
          setConnectionState('connecting');
          socket.connect();
        }
      },
    );

    return () => {
      appStateSubscription.remove();
      socket.removeAllListeners();
      socket.disconnect();
      setConnectionState('degraded');
    };
  }, [queryClient, setConnectionState]);

  return children;
}
