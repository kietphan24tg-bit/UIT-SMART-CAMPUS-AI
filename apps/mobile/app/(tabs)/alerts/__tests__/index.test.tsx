import { render } from '@testing-library/react-native';
import React from 'react';

import AlertsScreen from '../index';

import { useAlertFeed } from '@/hooks/use-alert-feed';
import { useAuthStore } from '@/stores/auth-store';

jest.mock('@/hooks/use-alert-feed');
jest.mock('@/stores/auth-store');

const mockUseAlertFeed = useAlertFeed as unknown as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

describe('AlertsScreen', () => {
  beforeEach(() => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { role: 'admin' } };
      return selector(state);
    });
    mockUseAlertFeed.mockReturnValue({
      data: [
        {
          id: 'fire-1',
          kind: 'fire_alert',
          title: 'Canh bao chay bai xe',
          body: 'Phat hien lua tai gateway A.',
          timestamp: '2026-04-07T05:00:00.000Z',
          severity: 'critical',
          category: 'emergency',
          isRead: false,
        },
        {
          id: 'notification-1',
          kind: 'notification',
          title: 'Lich hoc thay doi',
          body: 'Phong hoc da duoc cap nhat.',
          timestamp: '2026-04-07T06:00:00.000Z',
          severity: 'warning',
          category: 'academic',
          isRead: false,
        },
      ],
      isRefetching: false,
      refetch: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      deleteNotifications: jest.fn(),
      isMutating: false,
    });
  });

  it('renders delete actions for personal notifications and keeps fire alerts read-only', () => {
    const { getByText, getAllByText, getByTestId, queryByTestId } = render(<AlertsScreen />);

    expect(getByText('Bộ lọc')).toBeTruthy();
    expect(getByText('Tất cả')).toBeTruthy();
    expect(getByText('Chung')).toBeTruthy();
    expect(getAllByText('Học vụ').length).toBeGreaterThan(1);
    expect(getByText('Thanh toán')).toBeTruthy();
    expect(getAllByText('Khẩn cấp').length).toBeGreaterThan(1);
    expect(getByText('Chưa đọc')).toBeTruthy();
    expect(getByText('Canh bao chay bai xe')).toBeTruthy();
    expect(getByText('Lich hoc thay doi')).toBeTruthy();
    expect(getByText('Đọc tất cả')).toBeTruthy();
    expect(getByText('Fire alert vận hành')).toBeTruthy();
    expect(getByTestId('alert-row-fire-1')).toHaveStyle({ width: '100%' });
    expect(getByTestId('alert-delete-notification-1')).toBeTruthy();
    expect(queryByTestId('alert-delete-fire-1')).toBeNull();
  });
});
