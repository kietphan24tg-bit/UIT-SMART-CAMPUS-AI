import { apiClient } from './client';

import type { FireAlertsPayload, TelemetrySnapshotRecord } from '@/types/app-data';


export const safetyApi = {
  getFireAlerts: async (page = 1, limit = 20): Promise<FireAlertsPayload> => {
    return apiClient.get('/safety/fire-alerts', {
      params: { page, limit },
    }) as Promise<FireAlertsPayload>;
  },

  deleteFireAlert: async (id: string): Promise<{ deleted: true }> => {
    return apiClient.delete(`/safety/fire-alerts/${encodeURIComponent(id)}`) as Promise<{
      deleted: true;
    }>;
  },

  deleteFireAlerts: async (): Promise<{ count: number }> => {
    return apiClient.delete('/safety/fire-alerts') as Promise<{ count: number }>;
  },

  getLatestTelemetry: async (gateId = 'uit-gate-a'): Promise<TelemetrySnapshotRecord> => {
    return apiClient.get('/iot/telemetry/latest', {
      params: { gateId },
    }) as Promise<TelemetrySnapshotRecord>;
  },
};
