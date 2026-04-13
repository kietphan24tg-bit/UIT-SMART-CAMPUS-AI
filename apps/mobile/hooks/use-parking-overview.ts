import type { CreateVehicleRequest } from '@smart-campus/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { parkingApi } from '@/services/api';
import { useParkingRealtimeStore } from '@/stores/parking-realtime-store';
import type { ParkingOverviewState } from '@/types/app-data';
import { getTelemetryHealthState } from '@/utils/app';
import { useNowTick } from './use-now-tick';

export function useParkingOverview() {
  const queryClient = useQueryClient();
  const connectionState = useParkingRealtimeStore(
    (state) => state.connectionState,
  );

  const query = useQuery({
    queryKey: ['parking-overview'],
    queryFn: async (): Promise<ParkingOverviewState> => {
      const status = await parkingApi.getStatus();
      const vehicles = await parkingApi.getVehicles().catch(() => []);

      return {
        status,
        vehicles,
        telemetryHealth: getTelemetryHealthState(
          status.lastUpdated ?? status.sensors.reportedAt ?? null,
          status.sensors.fireDetected,
        ),
      };
    },
    refetchInterval: connectionState === 'live' ? false : 10_000,
  });
  useNowTick(10_000);

  const data = query.data
    ? {
        ...query.data,
        telemetryHealth: getTelemetryHealthState(
          query.data.status?.lastUpdated ??
            query.data.status?.sensors.reportedAt ??
            null,
          query.data.status?.sensors.fireDetected,
          connectionState === 'degraded' && !query.data.status,
        ),
      }
    : query.data;

  const createVehicle = useMutation({
    mutationFn: (data: CreateVehicleRequest) => parkingApi.createVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parking-overview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const createPayment = useMutation({
    mutationFn: (vehicleId: string) => parkingApi.createMomoPayment(vehicleId),
  });

  return {
    ...query,
    data,
    createVehicle: (data: CreateVehicleRequest) => createVehicle.mutateAsync(data),
    createPayment: (vehicleId: string) => createPayment.mutateAsync(vehicleId),
    isSubmittingVehicle: createVehicle.isPending,
    isSubmittingPayment: createPayment.isPending,
  };
}
