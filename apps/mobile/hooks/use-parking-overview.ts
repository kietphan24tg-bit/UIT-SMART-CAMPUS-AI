import type { CreateVehicleRequest } from '@smart-campus/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { parkingApi } from '@/services/api';
import type { ParkingOverviewState } from '@/types/app-data';
import { getTelemetryHealthState } from '@/utils/app';

export function useParkingOverview() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['parking-overview'],
    queryFn: async (): Promise<ParkingOverviewState> => {
      const [status, vehicles] = await Promise.all([
        parkingApi.getStatus(),
        parkingApi.getVehicles(),
      ]);

      return {
        status,
        vehicles,
        telemetryHealth: getTelemetryHealthState(
          status.lastUpdated ?? status.sensors.reportedAt ?? null,
          status.sensors.fireDetected,
        ),
      };
    },
    refetchInterval: 15_000,
  });

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
    createVehicle: (data: CreateVehicleRequest) => createVehicle.mutateAsync(data),
    createPayment: (vehicleId: string) => createPayment.mutateAsync(vehicleId),
    isSubmittingVehicle: createVehicle.isPending,
    isSubmittingPayment: createPayment.isPending,
  };
}
