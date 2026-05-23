import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '@smart-campus/shared';

export const AUTH_USER_SNAPSHOT_STORAGE_KEY = 'smart-campus.auth.user.v1';
export const QUERY_CACHE_STORAGE_KEY = 'smart-campus.query-cache.v1';

export type StoredAuthUser = Pick<UserProfile, 'id' | 'email' | 'firstName' | 'lastName' | 'role'> &
  Partial<
    Pick<
      UserProfile,
      'studentId' | 'avatarUrl' | 'phone' | 'address' | 'faculty' | 'major' | 'yearOfAdmission'
    >
  >;

function isStoredAuthUser(value: unknown): value is StoredAuthUser {
  if (typeof value !== 'object' || value == null) {
    return false;
  }

  const candidate = value as Partial<StoredAuthUser>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.firstName === 'string' &&
    typeof candidate.lastName === 'string' &&
    typeof candidate.role === 'string'
  );
}

async function removeItemSilently(key: string) {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Ignore local cache cleanup failures to avoid blocking the main flow.
  }
}

async function readJsonStorage<T>(
  key: string,
  guard?: (value: unknown) => value is T,
): Promise<T | null> {
  try {
    const rawValue = await AsyncStorage.getItem(key);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (guard && !guard(parsedValue)) {
      await removeItemSilently(key);
      return null;
    }

    return parsedValue as T;
  } catch {
    await removeItemSilently(key);
    return null;
  }
}

async function writeJsonStorage(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore local cache write failures so the primary network flow can continue.
  }
}

export async function readStoredAuthUser() {
  return readJsonStorage<StoredAuthUser>(AUTH_USER_SNAPSHOT_STORAGE_KEY, isStoredAuthUser);
}

export async function writeStoredAuthUser(user: StoredAuthUser) {
  await writeJsonStorage(AUTH_USER_SNAPSHOT_STORAGE_KEY, user);
}

export async function clearStoredAuthUser() {
  await removeItemSilently(AUTH_USER_SNAPSHOT_STORAGE_KEY);
}
