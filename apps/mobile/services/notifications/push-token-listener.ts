import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { fetchExpoPushTokenAndCache } from './push';

import { notificationsApi } from '@/services/api/notifications';
import { useAuthStore } from '@/stores/auth-store';

/**
 * When the native push token rotates, refresh Expo token and re-register with backend if logged in.
 */
export function subscribeExpoPushTokenChanges() {
  const subscription = Notifications.addPushTokenListener(async () => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return;
    }
    try {
      const expoPushToken = await fetchExpoPushTokenAndCache();
      if (!useAuthStore.getState().isAuthenticated) {
        return;
      }
      await notificationsApi.registerPushToken({
        expoPushToken,
        platform: Platform.OS,
      });
    } catch {
      // ignore
    }
  });

  return () => subscription.remove();
}
