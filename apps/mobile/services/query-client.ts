import { QueryClient } from '@tanstack/react-query';

function shouldRetry(failureCount: number, error: unknown): boolean {
  const axiosLike = error as { code?: string };
  if (axiosLike?.code === 'ERR_NETWORK') return false;
  return failureCount < 2;
}

export const appQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
      staleTime: 5 * 60 * 1000,
    },
  },
});
