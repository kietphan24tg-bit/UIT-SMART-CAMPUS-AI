import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Linking } from 'react-native';

import ParkingTaskScreen from '../[task]';

import { useParkingOverview } from '@/hooks/use-parking-overview';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));
jest.mock('@/hooks/use-parking-overview');
jest.mock('@/hooks/use-responsive-layout');

const mockUseParkingOverview = useParkingOverview as unknown as jest.Mock;
const mockUseResponsiveLayout = useResponsiveLayout as unknown as jest.Mock;
const mockUseRouter = useRouter as unknown as jest.Mock;
const mockUseLocalSearchParams = useLocalSearchParams as unknown as jest.Mock;

describe('ParkingTaskScreen payment status', () => {
  const openUrlSpy = jest.spyOn(Linking, 'openURL');
  const alertSpy = jest.spyOn(Alert, 'alert');

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    });
    mockUseLocalSearchParams.mockReturnValue({ task: 'payment-status' });
    mockUseResponsiveLayout.mockReturnValue({
      isTablet: false,
      isCompact: false,
      availableWidth: 360,
      getGridColumns: jest.fn(() => 1),
      getGridItemWidth: jest.fn(() => 320),
    });
    openUrlSpy.mockResolvedValue(undefined);
    alertSpy.mockImplementation(() => undefined as never);
  });

  afterAll(() => {
    openUrlSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('opens the checkout URL for a vehicle subscription', async () => {
    const createPayment = jest.fn().mockResolvedValue({
      checkoutUrl: 'https://momo.test/checkout',
    });

    mockUseParkingOverview.mockReturnValue({
      data: {
        status: null,
        vehicles: [
          {
            id: 'vehicle-1',
            plateNumber: '51F-123.45',
            rfidTag: 'RFID-1',
            label: 'Xe cá nhân',
            subscription: {
              status: 'active',
              monthlyFee: 40000,
              startDate: null,
              endDate: null,
              lastPaymentAt: null,
            },
          },
        ],
      },
      isRefetching: false,
      isSubmittingVehicle: false,
      isSubmittingPayment: false,
      refetch: jest.fn(),
      createVehicle: jest.fn(),
      createPayment,
    });

    const screen = render(<ParkingTaskScreen />);
    fireEvent.press(screen.getByText('Gia hạn qua MoMo'));

    await waitFor(() => {
      expect(createPayment).toHaveBeenCalledWith('vehicle-1');
      expect(openUrlSpy).toHaveBeenCalledWith('https://momo.test/checkout');
    });
  });

  it('shows a clear message when MoMo config is missing', async () => {
    const createPayment = jest.fn().mockRejectedValue(
      new Error('Cấu hình MoMo chưa đầy đủ. Hãy kiểm tra các biến MOMO_* ở máy chủ.'),
    );

    mockUseParkingOverview.mockReturnValue({
      data: {
        status: null,
        vehicles: [
          {
            id: 'vehicle-1',
            plateNumber: '51F-123.45',
            rfidTag: 'RFID-1',
            label: 'Xe cá nhân',
            subscription: {
              status: 'active',
              monthlyFee: 40000,
              startDate: null,
              endDate: null,
              lastPaymentAt: null,
            },
          },
        ],
      },
      isRefetching: false,
      isSubmittingVehicle: false,
      isSubmittingPayment: false,
      refetch: jest.fn(),
      createVehicle: jest.fn(),
      createPayment,
    });

    const screen = render(<ParkingTaskScreen />);
    fireEvent.press(screen.getByText('Gia hạn qua MoMo'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Thanh toán gửi xe',
        'Thanh toán MoMo chưa sẵn sàng trên môi trường hiện tại. Hãy kiểm tra các biến MOMO_* ở máy chủ.',
      );
    });
  });
});
