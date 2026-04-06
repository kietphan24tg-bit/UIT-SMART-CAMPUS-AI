import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api/client';

export function useApiQuery<T>(key: string[], url: string, enabled = true) {
  return useQuery<T>({
    queryKey: key,
    queryFn: () => apiClient.get(url) as Promise<T>,
    enabled,
  });
}

export function useApiMutation<TData, TVariables>(
  url: string,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post',
  invalidateKeys?: string[][],
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: (variables) =>
      apiClient.request({
        url,
        method,
        data: variables,
      }) as Promise<TData>,
    onSuccess: () => {
      invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
}
