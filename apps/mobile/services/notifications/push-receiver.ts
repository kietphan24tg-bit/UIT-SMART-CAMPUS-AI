import type { QueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';

import { useAuthStore } from '@/stores/auth-store';

type PushData = {
  notificationId?: unknown;
  kind?: unknown;
};

let pendingNotificationId: string | null = null;

export function configureForegroundNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export function subscribePushNotificationEvents(queryClient: QueryClient) {
  const receivedSubscription = Notifications.addNotificationReceivedListener(() => {
    invalidateNotificationQueries(queryClient);
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    invalidateNotificationQueries(queryClient);
    handleNotificationResponse(response);
  });

  const lastResponse = Notifications.getLastNotificationResponse?.();
  if (lastResponse) {
    handleNotificationResponse(lastResponse);
    Notifications.clearLastNotificationResponseAsync?.().catch(() => undefined);
  }

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

export function flushPendingNotificationNavigation() {
  if (!pendingNotificationId || !useAuthStore.getState().isAuthenticated) {
    return;
  }

  const notificationId = pendingNotificationId;
  pendingNotificationId = null;
  navigateToNotification(notificationId);
}

function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const notificationId = extractNotificationId(response.notification.request.content.data);
  if (!notificationId) {
    return;
  }

  if (!useAuthStore.getState().isAuthenticated) {
    pendingNotificationId = notificationId;
    return;
  }

  navigateToNotification(notificationId);
}

function navigateToNotification(notificationId: string) {
  router.push({
    pathname: '/alerts/[id]',
    params: { id: notificationId, kind: 'notification' },
  } as never);
}

function extractNotificationId(data: PushData | null | undefined) {
  if (!data || data.kind !== 'notification' || typeof data.notificationId !== 'string') {
    return null;
  }

  return data.notificationId;
}

function invalidateNotificationQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['alert-feed'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}
