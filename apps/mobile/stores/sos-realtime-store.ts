import { create } from 'zustand';

import type { SosRequestRecord } from '@/services/api/sos';

export type SosRealtimeConnectionState = 'connecting' | 'live' | 'degraded';

export type SosRealtimeEventName =
  | 'sos:created'
  | 'sos:updated'
  | 'sos:cancelled'
  | 'sos:resolved'
  | 'sos:expired';

export interface SosRealtimeEventPayload {
  sosId: string;
  request: SosRequestRecord;
}

interface SosRealtimeState {
  connectionState: SosRealtimeConnectionState;
  eventsById: Record<string, SosRealtimeEventPayload | undefined>;
  setConnectionState: (state: SosRealtimeConnectionState) => void;
  registerEvent: (payload: SosRealtimeEventPayload) => void;
  reset: () => void;
}

export const useSosRealtimeStore = create<SosRealtimeState>((set) => ({
  connectionState: 'connecting',
  eventsById: {},
  setConnectionState: (connectionState) => set({ connectionState }),
  registerEvent: (payload) =>
    set((state) => ({
      eventsById: {
        ...state.eventsById,
        [payload.sosId]: payload,
      },
    })),
  reset: () => set({ connectionState: 'connecting', eventsById: {} }),
}));
