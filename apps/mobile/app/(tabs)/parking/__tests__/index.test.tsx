import { render } from '@testing-library/react-native';
import React from 'react';

import ParkingScreen from '../index';

import { useParkingOverview } from '@/hooks/use-parking-overview';

jest.mock('@/hooks/use-parking-overview');

const mockUseParkingOverview = useParkingOverview as unknown as jest.Mock;

describe('ParkingScreen', () => {
  it('should render slot and vehicle information', () => {
    mockUseParkingOverview.mockReturnValue({
      data: {
        telemetryHealth: 'online',
        status: {
          availableSlots: 3,
          totalSlots: 4,
          occupiedSlots: 1,
          activeSessions: 1,
          gateId: 'uit-gate-a',
          lastUpdated: '2026-04-07T05:00:00.000Z',
          sensors: {
            temperature: 29,
            humidity: 65,
            rainDetected: false,
            fireDetected: false,
            deviceIp: '192.168.1.10',
            reportedAt: '2026-04-07T05:00:00.000Z',
          },
          slots: [{ slotNumber: 'A1', isOccupied: false }],
        },
        vehicles: [
          {
            id: 'vehicle-1',
            plateNumber: '51F44614',
            rfidTag: 'RFID-1',
            label: 'Xe may ca nhan',
            updatedAt: '2026-04-07T05:00:00.000Z',
            subscription: {
              status: 'active',
              monthlyFee: 40000,
              endDate: '2026-05-01T00:00:00.000Z',
              lastPaymentAt: '2026-04-01T00:00:00.000Z',
            },
          },
        ],
      },
      isRefetching: false,
      isSubmittingVehicle: false,
      isSubmittingPayment: false,
      refetch: jest.fn(),
      createVehicle: jest.fn(),
      createPayment: jest.fn(),
    });

    const { getByText } = render(<ParkingScreen />);

    expect(getByText('Parking + IoT')).toBeTruthy();
    expect(getByText('A1')).toBeTruthy();
    expect(getByText('51F44614')).toBeTruthy();
  });

  it('should render empty state when no vehicle exists', () => {
    mockUseParkingOverview.mockReturnValue({
      data: {
        telemetryHealth: 'offline',
        status: null,
        vehicles: [],
      },
      isRefetching: false,
      isSubmittingVehicle: false,
      isSubmittingPayment: false,
      refetch: jest.fn(),
      createVehicle: jest.fn(),
      createPayment: jest.fn(),
    });

    const { getByText } = render(<ParkingScreen />);

    expect(getByText('Ban chua dang ky xe')).toBeTruthy();
  });
});
