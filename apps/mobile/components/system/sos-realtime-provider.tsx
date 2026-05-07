import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { AppState } from 'react-native';
import { io } from 'socket.io-client';

import { API_ORIGIN } from '@/services/api/client';
import type { SosRealtimeEventPayload } from '@/stores/sos-realtime-store';
import { useSosRealtimeStore } from '@/stores/sos-realtime-store';

export function SosRealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const setConnectionState = useSosRealtimeStore(
    (state) => state.setConnectionState,
  );
  const registerEvent = useSosRealtimeStore((state) => state.registerEvent);
  const reset = useSosRealtimeStore((state) => state.reset);

  useEffect(() => {
    const socket = io(`${API_ORIGIN}/sos-live`, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      timeout: 10000,
    });

    const subscribe = () => {
      socket.emit('sos:subscribe', { scope: 'feed' });
    };

    const invalidateQueries = () => {
      void queryClient.invalidateQueries({ queryKey: ['sos', 'active'] });
      void queryClient.invalidateQueries({ queryKey: ['sos', 'mine'] });
    };

    const handleEvent = (payload: SosRealtimeEventPayload) => {
      setConnectionState('live');
      registerEvent(payload);
      invalidateQueries();
    };

    socket.on('connect', () => {
      setConnectionState('live');
      subscribe();
      invalidateQueries();
    });
    socket.on('disconnect', () => {
      setConnectionState('degraded');
    });
    socket.on('connect_error', () => {
      setConnectionState('degraded');
    });
    socket.on('sos:created', handleEvent);
    socket.on('sos:updated', handleEvent);
    socket.on('sos:cancelled', handleEvent);
    socket.on('sos:resolved', handleEvent);
    socket.on('sos:expired', handleEvent);

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
      reset();
    };
  }, [queryClient, registerEvent, reset, setConnectionState]);

  return children;
}
