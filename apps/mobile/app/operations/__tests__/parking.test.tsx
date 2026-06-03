import { render } from '@testing-library/react-native';
import React from 'react';

import OperationsParkingScreen from '../parking';

import { useParkingOverview } from '@/hooks/use-parking-overview';

jest.mock('@/hooks/use-parking-overview');

const mockUseParkingOverview = useParkingOverview as unknown as jest.Mock;

describe('OperationsParkingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the shared parking dashboard from the operations wrapper route', () => {
    mockUseParkingOverview.mockReturnValue({
      data: {
        telemetryHealth: 'online',
        status: {
          gateId: 'uit-gate-a',
          availableSlots: 1,
          totalSlots: 2,
          occupiedSlots: 1,
          activeSessions: 1,
          lastUpdated: '2026-04-07T05:00:00.000Z',
          sensors: {
            temperature: 29,
            humidity: 65,
            rainDetected: false,
            fireDetected: false,
            deviceIp: '192.168.1.10',
            reportedAt: '2026-04-07T05:00:00.000Z',
          },
          slots: [
            {
              slotNumber: 'A1',
              isOccupied: false,
              zone: 'A',
              lastUpdated: '2026-04-07T05:00:00.000Z',
            },
            {
              slotNumber: 'A2',
              isOccupied: true,
              zone: 'A',
              lastUpdated: '2026-04-07T05:00:00.000Z',
            },
          ],
        },
        vehicles: [],
      },
      isRefetching: false,
      isSubmittingVehicle: false,
      isSubmittingPayment: false,
      refetch: jest.fn(),
      createVehicle: jest.fn(),
      createPayment: jest.fn(),
    });

    const { getByText } = render(<OperationsParkingScreen />);

    expect(getByText('1/2')).toBeTruthy();
    expect(getByText('IR A1-A2')).toBeTruthy();
    expect(getByText('A1')).toBeTruthy();
  });
});
