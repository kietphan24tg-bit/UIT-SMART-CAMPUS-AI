import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

import { QUERY_CACHE_STORAGE_KEY } from '@/services/storage/local-storage';

function shouldRetry(failureCount: number, error: unknown): boolean {
  const apiLikeError = error as { code?: string; appCode?: string };
  if (apiLikeError?.code === 'ERR_NETWORK' || apiLikeError?.appCode === 'NETWORK_UNAVAILABLE') {
    return false;
  }
  return failureCount < 2;
}

export const QUERY_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
        staleTime: 5 * 60 * 1000,
        gcTime: QUERY_CACHE_MAX_AGE_MS,
      },
    },
  });
}

export const appQueryClient = createAppQueryClient();

export const appQueryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: QUERY_CACHE_STORAGE_KEY,
  throttleTime: 0,
});

export const appQueryPersistOptions = {
  persister: appQueryPersister,
  maxAge: QUERY_CACHE_MAX_AGE_MS,
  dehydrateOptions: {
    shouldDehydrateMutation: () => false,
  },
};

export async function clearPersistedQueryCache() {
  await appQueryPersister.removeClient();
}

export async function clearAppQueryState() {
  await appQueryClient.cancelQueries();
  appQueryClient.clear();
  await clearPersistedQueryCache();
}
