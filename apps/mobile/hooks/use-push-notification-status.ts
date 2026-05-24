import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import {
  readPushNotificationState,
  syncPushToken,
  type PushNotificationState,
} from '@/services/notifications/push';
import { useAuthStore } from '@/stores/auth-store';

const PUSH_STATUS_QUERY_KEY = ['push-notification-status'] as const;

export function usePushNotificationStatus() {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const queryClient = useQueryClient();
  const isEnabled = isHydrated && isAuthenticated;

  const query = useQuery({
    queryKey: PUSH_STATUS_QUERY_KEY,
    queryFn: readPushNotificationState,
    enabled: isEnabled,
    staleTime: 0,
  });
  const { refetch } = query;

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refetch();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isEnabled, refetch]);

  const retryMutation = useMutation({
    mutationFn: syncPushToken,
    onSuccess: (state: PushNotificationState) => {
      queryClient.setQueryData(PUSH_STATUS_QUERY_KEY, state);
    },
  });

  return {
    ...query,
    retrySync: () => retryMutation.mutateAsync(),
    isRetrying: retryMutation.isPending,
  };
}
