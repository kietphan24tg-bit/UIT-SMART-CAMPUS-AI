import type {
  CreateVehicleRequest,
  ParkingStatus,
  PaymentCheckout,
  RegisteredVehicle,
} from '@smart-campus/shared';

import { apiClient } from './client';

export const parkingApi = {
  getStatus: async (gateId = 'uit-gate-a'): Promise<ParkingStatus> => {
    return apiClient.get('/parking/status', {
      params: { gateId },
    }) as Promise<ParkingStatus>;
  },

  getVehicles: async (): Promise<RegisteredVehicle[]> => {
    return apiClient.get('/parking/vehicles') as Promise<RegisteredVehicle[]>;
  },

  createVehicle: async (
    data: CreateVehicleRequest,
  ): Promise<RegisteredVehicle> => {
    return apiClient.post('/parking/vehicles', data) as Promise<RegisteredVehicle>;
  },

  createMomoPayment: async (vehicleId: string): Promise<PaymentCheckout> => {
    return apiClient.post(
      `/parking/subscriptions/${vehicleId}/payments/momo`,
    ) as Promise<PaymentCheckout>;
  },
};
