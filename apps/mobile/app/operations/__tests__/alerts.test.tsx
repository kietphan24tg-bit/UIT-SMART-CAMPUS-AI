import { render } from '@testing-library/react-native';
import React from 'react';

import OperationsAlertsScreen from '../alerts';

import { useAlertFeed } from '@/hooks/use-alert-feed';
import { useAuthStore } from '@/stores/auth-store';

jest.mock('@/hooks/use-alert-feed');
jest.mock('@/stores/auth-store');

const mockUseAlertFeed = useAlertFeed as unknown as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

describe('OperationsAlertsScreen', () => {
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

  it('renders the shared alert center from the operations wrapper route', () => {
    const { getByText, getByTestId } = render(<OperationsAlertsScreen />);

    expect(getByText('Canh bao chay bai xe')).toBeTruthy();
    expect(getByText('Lich hoc thay doi')).toBeTruthy();
    expect(getByTestId('alert-row-fire-1')).toBeTruthy();
  });
});
