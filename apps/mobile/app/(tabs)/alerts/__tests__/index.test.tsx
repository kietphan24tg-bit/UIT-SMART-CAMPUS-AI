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
          title: 'Cảnh báo cháy bãi xe',
          body: 'Phát hiện lửa tại gateway A.',
          timestamp: '2026-04-07T05:00:00.000Z',
          severity: 'critical',
          isRead: false,
        },
        {
          id: 'notification-1',
          kind: 'notification',
          title: 'Lịch học thay đổi',
          body: 'Phòng học đã được cập nhật.',
          timestamp: '2026-04-07T06:00:00.000Z',
          severity: 'warning',
          isRead: false,
        },
      ],
      isRefetching: false,
      refetch: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    });
  });

  it('should render emergency and normal groups', () => {
    const { getByText, getAllByText } = render(<AlertsScreen />);

    expect(getAllByText('Khẩn cấp').length).toBeGreaterThan(0);
    expect(getByText('Thông báo gần đây')).toBeTruthy();
    expect(getByText('Cảnh báo cháy bãi xe')).toBeTruthy();
    expect(getByText('Lịch học thay đổi')).toBeTruthy();
    expect(getByText('Bộ lọc nhanh')).toBeTruthy();
  });
});
