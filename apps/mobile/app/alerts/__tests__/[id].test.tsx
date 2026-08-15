import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react-native';

import AlertDetailScreen from '../[id]';

import { useAlertFeed } from '@/hooks/use-alert-feed';
import { notificationsApi } from '@/services/api/notifications';

const mockUseLocalSearchParams = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/hooks/use-alert-feed', () => ({
  useAlertFeed: jest.fn(),
  toNotificationFeed: (item: {
    id: string;
    title: string;
    body: string;
    isRead: boolean;
    createdAt: string;
  }) => ({
    id: item.id,
    kind: 'notification',
    title: item.title,
    body: item.body,
    timestamp: item.createdAt,
    severity: 'warning',
    category: 'academic',
    isRead: item.isRead,
  }),
}));

jest.mock('@/services/api/notifications', () => ({
  notificationsApi: {
    getNotification: jest.fn(),
  },
}));

describe('AlertDetailScreen', () => {
  function createQueryClient() {
    return new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: Infinity,
        },
      },
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ id: 'notif-1', kind: 'notification' });
  });

  it('fetches notification detail when the item is not in the feed', async () => {
    const markAsRead = jest.fn().mockResolvedValue(undefined);
    (useAlertFeed as jest.Mock).mockReturnValue({
      data: [],
      isFetching: false,
      markAsRead,
      markFireAlertAsRead: jest.fn(),
    });
    (notificationsApi.getNotification as jest.Mock).mockResolvedValue({
      id: 'notif-1',
      title: 'Thông báo lớp',
      body: 'Ngày mai học tại B201',
      type: 'academic',
      isRead: false,
      data: null,
      createdAt: '2026-04-30T10:00:00.000Z',
    });

    const queryClient = createQueryClient();

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
    await waitFor(() => {
      expect(markAsRead).toHaveBeenCalledWith('notif-1');
    });
  });

  it('marks an unread notification from the feed as read on open', async () => {
    const markAsRead = jest.fn().mockResolvedValue(undefined);
    (useAlertFeed as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'notif-1',
          kind: 'notification',
          title: 'Thông báo lớp',
          body: 'Ngày mai học tại B201',
          timestamp: '2026-04-30T10:00:00.000Z',
          severity: 'warning',
          category: 'academic',
          isRead: false,
        },
      ],
      isFetching: false,
      markAsRead,
      markFireAlertAsRead: jest.fn(),
    });

    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AlertDetailScreen />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(markAsRead).toHaveBeenCalledWith('notif-1');
    });
  });

  it('marks an unread fire alert as read on open', async () => {
    const markFireAlertAsRead = jest.fn().mockResolvedValue(undefined);
    mockUseLocalSearchParams.mockReturnValue({ id: 'fire-1', kind: 'fire_alert' });
    (useAlertFeed as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'fire-1',
          kind: 'fire_alert',
          title: 'Cảnh báo cháy bãi xe',
          body: 'Phát hiện khói',
          timestamp: '2026-08-10T16:00:00.000Z',
          severity: 'critical',
          category: 'emergency',
          isRead: false,
          gateId: 'uit-gate-a',
          deviceIp: '192.168.1.10',
        },
      ],
      isFetching: false,
      markAsRead: jest.fn(),
      markFireAlertAsRead,
    });

    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AlertDetailScreen />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(markFireAlertAsRead).toHaveBeenCalledWith('fire-1');
    });
  });
});
