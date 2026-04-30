import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react-native';

import AlertDetailScreen from '../[id]';

import { useAlertFeed } from '@/hooks/use-alert-feed';
import { notificationsApi } from '@/services/api/notifications';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'notif-1', kind: 'notification' }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/hooks/use-alert-feed', () => ({
  useAlertFeed: jest.fn(),
}));

jest.mock('@/services/api/notifications', () => ({
  notificationsApi: {
    getNotification: jest.fn(),
  },
}));

describe('AlertDetailScreen', () => {
  it('fetches notification detail when the item is not in the feed', async () => {
    (useAlertFeed as jest.Mock).mockReturnValue({ data: [] });
    (notificationsApi.getNotification as jest.Mock).mockResolvedValue({
      id: 'notif-1',
      title: 'Thông báo lớp',
      body: 'Ngày mai học tại B201',
      type: 'academic',
      isRead: false,
      data: null,
      createdAt: '2026-04-30T10:00:00.000Z',
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const screen = render(
      <QueryClientProvider client={queryClient}>
        <AlertDetailScreen />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Thông báo lớp')).toBeTruthy();
      expect(screen.getByText('Ngày mai học tại B201')).toBeTruthy();
    });
    expect(notificationsApi.getNotification).toHaveBeenCalledWith('notif-1');
  });
});
