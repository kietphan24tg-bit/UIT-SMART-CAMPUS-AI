import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { notificationsApi } from '@/services/api/notifications';

/** App-level: OS permission prompt is once per app install, not per user. */
export const NOTIFICATION_PROMPTED_KEY = 'notif_prompted';

const EXPO_PUSH_TOKEN_CACHE_KEY = 'expo_push_token_cache';
let pushNotificationsUnsupportedReason: string | null = null;

function isFirebaseInitializationError(error: unknown) {
  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : String(error ?? '');

  return message.includes('FirebaseApp.initializeApp') ||
    message.includes('Default FirebaseApp is not initialized');
}

function markPushNotificationsUnsupported(error: unknown) {
  if (Platform.OS !== 'android' || !isFirebaseInitializationError(error)) {
    return false;
  }

  pushNotificationsUnsupportedReason =
    'Push notifications are unavailable on this Android build because Firebase is not configured yet.';
  return true;
}

export function canUseRemotePushNotifications() {
  return !(Platform.OS === 'android' && Constants.appOwnership === 'expo') &&
    !pushNotificationsUnsupportedReason;
}

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
  try {
    const projectId = resolveProjectId();
    const tokenResponse = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    return tokenResponse.data;
  } catch (error) {
    if (markPushNotificationsUnsupported(error)) {
      throw new Error(pushNotificationsUnsupportedReason ?? 'Push notifications are unavailable.');
    }
    throw error;
  }
}

/** Fetches token from Expo, updates local cache. */
export async function fetchExpoPushTokenAndCache(): Promise<string> {
  if (!canUseRemotePushNotifications()) {
    throw new Error(
      pushNotificationsUnsupportedReason ??
        'Remote push notifications are disabled in Expo Go on Android.',
    );
  }

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

  if (!canUseRemotePushNotifications()) {
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
    throw new Error('Notification permission was not granted on this device.');
  }

  try {
    const expoPushToken = await fetchExpoPushTokenAndCache();
    await notificationsApi.registerPushToken({
      expoPushToken,
      platform: Platform.OS,
    });
  } catch (error) {
    if (markPushNotificationsUnsupported(error)) {
      return;
    }
    throw error;
  }
}

/** Best-effort: remove this device's token for the current user (call before clearing JWT). */
export async function unregisterPushTokenFromBackend() {
  if (!canUseRemotePushNotifications()) {
    return;
  }

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
