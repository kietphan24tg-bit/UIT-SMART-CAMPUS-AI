import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';

import { warmCampusServices, warmStudyMaterialsService } from '@/services/service-warmup';
import { useAuthStore } from '@/stores/auth-store';

export function ServiceWarmupProvider() {
  const queryClient = useQueryClient();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const role = useAuthStore((state) => state.user?.role);
  const warmupSessionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !userId) {
      warmupSessionKeyRef.current = null;
      return;
    }

    const warmupSessionKey = `${userId}:${role ?? 'unknown'}`;
    if (warmupSessionKeyRef.current === warmupSessionKey) {
      return;
    }

    warmupSessionKeyRef.current = warmupSessionKey;
    void warmStudyMaterialsService(queryClient, role).catch(() => undefined);

    const interaction = InteractionManager.runAfterInteractions(() => {
      void warmCampusServices(queryClient, role).catch(() => undefined);
    });

    return () => {
      interaction.cancel();
    };
  }, [isAuthenticated, isHydrated, queryClient, role, userId]);

  return null;
}
