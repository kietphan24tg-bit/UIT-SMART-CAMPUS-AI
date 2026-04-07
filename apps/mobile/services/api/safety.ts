import { apiClient } from './client';

import type { FireAlertsPayload, TelemetrySnapshotRecord } from '@/types/app-data';


export const safetyApi = {
  getFireAlerts: async (page = 1, limit = 20): Promise<FireAlertsPayload> => {
    return apiClient.get('/safety/fire-alerts', {
      params: { page, limit },
    }) as Promise<FireAlertsPayload>;
  },

  getLatestTelemetry: async (gateId = 'uit-gate-a'): Promise<TelemetrySnapshotRecord> => {
    return apiClient.get('/iot/telemetry/latest', {
      params: { gateId },
    }) as Promise<TelemetrySnapshotRecord>;
  },
};
