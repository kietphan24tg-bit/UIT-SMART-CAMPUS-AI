import * as Notifications from 'expo-notifications';

import { canUseRemotePushNotifications, syncPushToken } from './push';

import { useAuthStore } from '@/stores/auth-store';

/**
 * When the native push token rotates, refresh Expo token and re-register with backend if logged in.
 */
export function subscribeExpoPushTokenChanges() {
  if (!canUseRemotePushNotifications()) {
    return () => undefined;
  }

  const subscription = Notifications.addPushTokenListener(async () => {
    if (!useAuthStore.getState().isAuthenticated) {
      return;
    }

    await syncPushToken();
  });

  return () => subscription.remove();
}
