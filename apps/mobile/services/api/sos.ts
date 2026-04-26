import { apiClient } from './client';

export type SosStatus = 'active' | 'resolved' | 'cancelled' | 'expired';

export interface SosRequestRecord {
  id: string;
  requesterId: string;
  resolverId: string | null;
  status: SosStatus;
  lat: number;
  lng: number;
  accuracyMeters: number | null;
  addressSnapshot: string | null;
  contactSnapshot: {
    name?: string;
    email?: string;
    phone?: string | null;
  } | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  expiresAt: string;
  requester: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  } | null;
}

export const sosApi = {
  create: async (payload: {
    lat: number;
    lng: number;
    accuracyMeters?: number;
    note?: string;
  }): Promise<SosRequestRecord> => {
    return (await apiClient.post('/sos', payload)) as SosRequestRecord;
  },

  listActive: async (): Promise<SosRequestRecord[]> => {
    return (await apiClient.get('/sos/active')) as SosRequestRecord[];
  },

  listMine: async (): Promise<SosRequestRecord[]> => {
    return (await apiClient.get('/sos/me')) as SosRequestRecord[];
  },

  cancel: async (sosId: string): Promise<SosRequestRecord> => {
    return (await apiClient.patch(`/sos/${encodeURIComponent(sosId)}/cancel`)) as SosRequestRecord;
  },

  resolve: async (sosId: string): Promise<SosRequestRecord> => {
    return (await apiClient.patch(`/sos/${encodeURIComponent(sosId)}/resolve`)) as SosRequestRecord;
  },

  getRoute: async (sosId: string, fromLat: number, fromLng: number) => {
    return (await apiClient.get(`/sos/${encodeURIComponent(sosId)}/route`, {
      params: { fromLat, fromLng },
    })) as {
      sosId: string;
      route: Record<string, unknown>;
    };
  },
};
