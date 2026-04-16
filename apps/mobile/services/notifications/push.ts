import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { notificationsApi } from '@/services/api/notifications';

/** App-level: OS permission prompt is once per app install, not per user. */
export const NOTIFICATION_PROMPTED_KEY = 'notif_prompted';

const EXPO_PUSH_TOKEN_CACHE_KEY = 'expo_push_token_cache';

export async function readCachedExpoPushToken(): Promise<string | null> {
  return SecureStore.getItemAsync(EXPO_PUSH_TOKEN_CACHE_KEY);
}

async function writeCachedExpoPushToken(token: string) {
  await SecureStore.setItemAsync(EXPO_PUSH_TOKEN_CACHE_KEY, token);
}

export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

function resolveProjectId() {
  const easProjectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined;
  return easProjectId;
}

async function getExpoPushTokenFromDevice(): Promise<string> {
  const projectId = resolveProjectId();
  const tokenResponse = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  return tokenResponse.data;
}

/** Fetches token from Expo, updates local cache. */
export async function fetchExpoPushTokenAndCache(): Promise<string> {
  await ensureAndroidChannel();
  const token = await getExpoPushTokenFromDevice();
  await writeCachedExpoPushToken(token);
  return token;
}

/**
 * Permission (app-level) + always registers current Expo token with backend when granted.
 * Call after login while JWT is present so upsert maps token to the current user.
 */
export async function syncPushToken() {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return;
  }

  await ensureAndroidChannel();

  const prompted = await SecureStore.getItemAsync(NOTIFICATION_PROMPTED_KEY);

  let permissionStatus = await Notifications.getPermissionsAsync();
  if (!prompted) {
    if (permissionStatus.status !== 'granted') {
      permissionStatus = await Notifications.requestPermissionsAsync();
    }
    await SecureStore.setItemAsync(NOTIFICATION_PROMPTED_KEY, '1');
  }

  if (permissionStatus.status !== 'granted') {
    return;
  }

  const expoPushToken = await fetchExpoPushTokenAndCache();
  await notificationsApi.registerPushToken({
    expoPushToken,
    platform: Platform.OS,
  });
}

/** Best-effort: remove this device's token for the current user (call before clearing JWT). */
export async function unregisterPushTokenFromBackend() {
  try {
    let token = await readCachedExpoPushToken();
    if (!token) {
      const perm = await Notifications.getPermissionsAsync();
      if (perm.status === 'granted') {
        token = await fetchExpoPushTokenAndCache();
      }
    }
    if (token) {
      await notificationsApi.removePushToken({ expoPushToken: token });
    }
  } catch {
    // best-effort
  }
}
