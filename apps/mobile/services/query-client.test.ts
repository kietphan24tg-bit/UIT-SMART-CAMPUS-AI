import AsyncStorage from '@react-native-async-storage/async-storage';
import { dehydrate, hydrate } from '@tanstack/react-query';

import {
  appQueryPersistOptions,
  appQueryPersister,
  clearPersistedQueryCache,
  createAppQueryClient,
  QUERY_CACHE_MAX_AGE_MS,
} from './query-client';

import { QUERY_CACHE_STORAGE_KEY } from '@/services/storage/local-storage';

describe('query client persistence', () => {
  const clients: ReturnType<typeof createAppQueryClient>[] = [];

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    clients.forEach((client) => client.clear());
    clients.length = 0;
    await clearPersistedQueryCache();
  });

  it('restores persisted query cache after app restart', async () => {
    const queryClient = createAppQueryClient();
    clients.push(queryClient);
    queryClient.setQueryData(['dashboard', 'student'], {
      unreadCount: 3,
      telemetryHealth: 'offline',
    });

    await appQueryPersister.persistClient({
      timestamp: Date.now(),
      buster: '',
      clientState: dehydrate(queryClient, appQueryPersistOptions.dehydrateOptions),
    });

    const restoredClient = createAppQueryClient();
    clients.push(restoredClient);
    const restoredState = await appQueryPersister.restoreClient();
    expect(restoredState).not.toBeNull();

    const isFresh =
      restoredState != null && Date.now() - restoredState.timestamp <= QUERY_CACHE_MAX_AGE_MS;
    expect(isFresh).toBe(true);
    hydrate(restoredClient, restoredState?.clientState);

    expect(restoredClient.getQueryData(['dashboard', 'student'])).toEqual({
      unreadCount: 3,
      telemetryHealth: 'offline',
    });
  });

  it('removes the persisted cache when clearing query storage', async () => {
    await AsyncStorage.setItem(QUERY_CACHE_STORAGE_KEY, '{"clientState":{}}');

    await clearPersistedQueryCache();

    await expect(AsyncStorage.getItem(QUERY_CACHE_STORAGE_KEY)).resolves.toBeNull();
  });
});
