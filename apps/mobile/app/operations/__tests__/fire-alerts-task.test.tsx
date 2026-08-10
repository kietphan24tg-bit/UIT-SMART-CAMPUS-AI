import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import OperationsTaskScreen from '../[task]';

import { useOperationsScreenData } from '@/hooks/use-schedule-screen';
import { useAuthStore } from '@/stores/auth-store';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

const mockUseLocalSearchParams = jest.fn();
const mockDeleteFireAlert = jest.fn();
const mockDeleteFireAlerts = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));
jest.mock('@/hooks/use-schedule-screen');
jest.mock('@/stores/auth-store');

const mockUseOperationsScreenData = useOperationsScreenData as unknown as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

describe('OperationsTaskScreen fire alerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockUseLocalSearchParams.mockReturnValue({ task: 'fire-alerts' });
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { role: 'admin' } };
      return selector(state);
    });
    mockDeleteFireAlert.mockResolvedValue({ deleted: true });
    mockDeleteFireAlerts.mockResolvedValue({ count: 2 });
    mockUseOperationsScreenData.mockReturnValue({
      data: {
        fireAlerts: {
          items: [
            {
              id: 'fire-1',
              gateId: 'uit-gate-a',
              message: 'Cảm biến lửa đã kích hoạt tại bãi xe UIT Campus.',
              isResolved: false,
              reportedAt: '2026-08-10T16:00:00.000Z',
              resolvedAt: null,
              telemetrySnapshot: {
                id: 'snapshot-1',
                gateId: 'uit-gate-a',
                deviceIp: '192.168.1.10',
                slotBitmap: null,
                slots: [],
                temperature: 29,
                humidity: 65,
                rainDetected: false,
                fireDetected: true,
                reportedAt: '2026-08-10T16:00:00.000Z',
              },
            },
          ],
          meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
        },
      },
      isRefetching: false,
      refetch: jest.fn(),
      deleteFireAlert: mockDeleteFireAlert,
      deleteFireAlerts: mockDeleteFireAlerts,
      isMutatingFireAlerts: false,
    });
  });

  it('renders fire alert actions for admins inside the operations task route', () => {
    const { getByText, getByTestId } = render(<OperationsTaskScreen />);

    expect(getByText('Fire alert vận hành')).toBeTruthy();
    expect(getByText('Mục gần đây')).toBeTruthy();
    expect(getByTestId('operations-task-delete-fire-alert-fire-1')).toBeTruthy();
    expect(getByTestId('operations-task-delete-all-fire-alerts')).toBeTruthy();
  });

  it('confirms delete and delete-all actions from the fire alert task screen', () => {
    const { getByTestId } = render(<OperationsTaskScreen />);

    fireEvent.press(getByTestId('operations-task-delete-fire-alert-fire-1'));
    let alertCall = (Alert.alert as jest.Mock).mock.calls.at(-1);
    expect(alertCall?.[0]).toBe('Xóa cảnh báo');
    let buttons = alertCall?.[2] as Array<{ text?: string; onPress?: () => void }> | undefined;
    buttons?.find((button) => button.text === 'Xóa')?.onPress?.();
    expect(mockDeleteFireAlert).toHaveBeenCalledWith('fire-1');

    fireEvent.press(getByTestId('operations-task-delete-all-fire-alerts'));
    alertCall = (Alert.alert as jest.Mock).mock.calls.at(-1);
    expect(alertCall?.[0]).toBe('Xóa tất cả cảnh báo');
    buttons = alertCall?.[2] as Array<{ text?: string; onPress?: () => void }> | undefined;
    buttons?.find((button) => button.text === 'Xóa tất cả')?.onPress?.();
    expect(mockDeleteFireAlerts).toHaveBeenCalledTimes(1);
  });
});
