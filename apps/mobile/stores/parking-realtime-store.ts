import { create } from 'zustand';

export type ParkingRealtimeConnectionState =
  | 'connecting'
  | 'live'
  | 'degraded';

interface ParkingRealtimeState {
  connectionState: ParkingRealtimeConnectionState;
  setConnectionState: (state: ParkingRealtimeConnectionState) => void;
}

export const useParkingRealtimeStore = create<ParkingRealtimeState>((set) => ({
  connectionState: 'connecting',
  setConnectionState: (connectionState) => set({ connectionState }),
}));
