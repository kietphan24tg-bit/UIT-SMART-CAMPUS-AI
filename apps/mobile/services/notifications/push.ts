import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { notificationsApi } from '@/services/api/notifications';

/** App-level: OS permission prompt is once per app install, not per user. */
export const NOTIFICATION_PROMPTED_KEY = 'notif_prompted';

const EXPO_PUSH_TOKEN_CACHE_KEY = 'expo_push_token_cache';
const PUSH_STATUS_STORAGE_KEY = 'smart-campus.push-status.v1';

let pushNotificationsUnsupportedReason: string | null = null;

export type PushSyncStatus =
  | 'enabled_synced'
  | 'enabled_sync_failed'
  | 'permission_denied'
  | 'unsupported_build';

export interface PushNotificationState {
  status: PushSyncStatus;
  lastSuccessfulPushSyncAt: string | null;
  lastUpdatedAt: string;
  errorMessage: string | null;
}

function isFirebaseInitializationError(error: unknown) {
  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : String(error ?? '');

  return (
    message.includes('FirebaseApp.initializeApp') ||
    message.includes('Default FirebaseApp is not initialized')
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }

  return 'Unable to register this device for push notifications.';
}

function isMobilePushPlatform() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

function getMobilePushPlatform(): 'ios' | 'android' | null {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return Platform.OS;
  }

  return null;
}

function markPushNotificationsUnsupported(error: unknown) {
  if (Platform.OS !== 'android' || !isFirebaseInitializationError(error)) {
    return false;
  }

  pushNotificationsUnsupportedReason =
    'Push notifications are unavailable on this Android build because Firebase is not configured yet.';
  return true;
}

function buildPushNotificationState(
  status: PushSyncStatus,
  previousState?: PushNotificationState | null,
  errorMessage?: string | null,
): PushNotificationState {
  return {
    status,
    lastSuccessfulPushSyncAt:
      status === 'enabled_synced'
        ? new Date().toISOString()
        : previousState?.lastSuccessfulPushSyncAt ?? null,
    lastUpdatedAt: new Date().toISOString(),
    errorMessage: status === 'enabled_synced' ? null : errorMessage ?? previousState?.errorMessage ?? null,
  };
}

async function writePushNotificationState(state: PushNotificationState) {
  try {
    await AsyncStorage.setItem(PUSH_STATUS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Local cache writes should never block the main flow.
  }

  return state;
}

async function readStoredPushNotificationState(): Promise<PushNotificationState | null> {
  try {
    const rawValue = await AsyncStorage.getItem(PUSH_STATUS_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<PushNotificationState>;
    if (
      typeof parsedValue.status !== 'string' ||
      typeof parsedValue.lastUpdatedAt !== 'string' ||
      !(
        parsedValue.status === 'enabled_synced' ||
        parsedValue.status === 'enabled_sync_failed' ||
        parsedValue.status === 'permission_denied' ||
        parsedValue.status === 'unsupported_build'
      )
    ) {
      return null;
    }

    return {
      status: parsedValue.status,
      lastSuccessfulPushSyncAt:
        typeof parsedValue.lastSuccessfulPushSyncAt === 'string'
          ? parsedValue.lastSuccessfulPushSyncAt
          : null,
      lastUpdatedAt: parsedValue.lastUpdatedAt,
      errorMessage: typeof parsedValue.errorMessage === 'string' ? parsedValue.errorMessage : null,
    };
  } catch {
    return null;
  }
}

async function persistPushNotificationState(
  status: PushSyncStatus,
  errorMessage?: string | null,
) {
  const previousState = await readStoredPushNotificationState();
  const nextState = buildPushNotificationState(status, previousState, errorMessage);
  return writePushNotificationState(nextState);
}

export function canUseRemotePushNotifications() {
  return !(
    (Platform.OS === 'android' && Constants.appOwnership === 'expo') ||
    pushNotificationsUnsupportedReason
  );
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

export async function readPushNotificationState(): Promise<PushNotificationState> {
  const previousState = await readStoredPushNotificationState();

  if (!isMobilePushPlatform() || !canUseRemotePushNotifications()) {
    return buildPushNotificationState(
      'unsupported_build',
      previousState,
      pushNotificationsUnsupportedReason,
    );
  }

  let permissionStatus;
  try {
    permissionStatus = await Notifications.getPermissionsAsync();
  } catch (error) {
    if (markPushNotificationsUnsupported(error)) {
      return buildPushNotificationState(
        'unsupported_build',
        previousState,
        pushNotificationsUnsupportedReason,
      );
    }

    return buildPushNotificationState(
      'enabled_sync_failed',
      previousState,
      getErrorMessage(error),
    );
  }

  if (permissionStatus.status !== 'granted') {
    return buildPushNotificationState('permission_denied', previousState);
  }

  if (previousState?.status === 'enabled_synced') {
    return {
      ...previousState,
      errorMessage: null,
    };
  }

  return buildPushNotificationState(
    'enabled_sync_failed',
    previousState,
    previousState?.errorMessage ?? 'Thiết bị chưa được đăng ký để nhận push từ hệ thống.',
  );
}

/**
 * Permission (app-level) + always registers current Expo token with backend when granted.
 * Call after login while JWT is present so upsert maps token to the current user.
 */
export async function syncPushToken(): Promise<PushNotificationState> {
  const mobilePlatform = getMobilePushPlatform();

  if (!mobilePlatform) {
    return persistPushNotificationState('unsupported_build');
  }

  if (!canUseRemotePushNotifications()) {
    return persistPushNotificationState(
      'unsupported_build',
      pushNotificationsUnsupportedReason ??
        'Remote push notifications are disabled in Expo Go on Android.',
    );
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
    return persistPushNotificationState('permission_denied');
  }

  try {
    const expoPushToken = await fetchExpoPushTokenAndCache();
    await notificationsApi.registerPushToken({
      expoPushToken,
      platform: mobilePlatform,
    });

    return persistPushNotificationState('enabled_synced');
  } catch (error) {
    if (markPushNotificationsUnsupported(error)) {
      return persistPushNotificationState(
        'unsupported_build',
        pushNotificationsUnsupportedReason,
      );
    }

    return persistPushNotificationState('enabled_sync_failed', getErrorMessage(error));
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

export async function clearCachedExpoPushToken() {
  await SecureStore.deleteItemAsync(EXPO_PUSH_TOKEN_CACHE_KEY);
}
