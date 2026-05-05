import { render } from '@testing-library/react-native';
import React from 'react';

import ParkingScreen from '../index';

import { useParkingOverview } from '@/hooks/use-parking-overview';

jest.mock('@/hooks/use-parking-overview');

const mockUseParkingOverview = useParkingOverview as unknown as jest.Mock;

describe('ParkingScreen', () => {
  it('renders the dashboard with real parking data', () => {
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
            { slotNumber: 'A1', isOccupied: false, zone: 'A', lastUpdated: '2026-04-07T05:00:00.000Z' },
            { slotNumber: 'A2', isOccupied: true, zone: 'A', lastUpdated: '2026-04-07T05:00:00.000Z' },
          ],
        },
        vehicles: [
          {
            id: 'vehicle-1',
            plateNumber: '51F44614',
            rfidTag: 'RFID-1',
            label: 'Xe máy cá nhân',
            updatedAt: '2026-04-07T05:00:00.000Z',
            isActive: true,
            createdAt: '2026-04-01T00:00:00.000Z',
            subscription: {
              status: 'active',
              monthlyFee: 40000,
              startDate: '2026-04-01T00:00:00.000Z',
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

    const { getByText, getAllByText, queryByText } = render(<ParkingScreen />);

    expect(getByText('Bãi xe UIT')).toBeTruthy();
    expect(getByText('Chỗ trống')).toBeTruthy();
    expect(getByText('1/2')).toBeTruthy();
    expect(getByText('IR A1-A2')).toBeTruthy();
    expect(getByText('Mưa')).toBeTruthy();
    expect(getByText('Không mưa')).toBeTruthy();
    expect(getByText('Nhiệt ẩm')).toBeTruthy();
    expect(getByText('29°C · 65%')).toBeTruthy();
    expect(getByText('Nhiệt độ · Độ ẩm')).toBeTruthy();
    expect(getByText('Cháy')).toBeTruthy();
    expect(getByText('Không cháy')).toBeTruthy();
    expect(queryByText('Sức khỏe')).toBeNull();
    expect(queryByText('Dữ liệu hệ thống')).toBeNull();
    expect(queryByText('Xe đã đăng ký')).toBeNull();
    expect(queryByText('Gói gửi xe')).toBeNull();
    expect(queryByText('Hành động')).toBeNull();
  });

  it('renders an empty state when parking data is unavailable', () => {
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

    const { getByText, queryByText } = render(<ParkingScreen />);

    expect(getByText('Chưa có telemetry')).toBeTruthy();
    expect(queryByText('Dữ liệu hệ thống')).toBeNull();
    expect(queryByText('Chưa có xe đăng ký')).toBeNull();
  });

  it('shows rain particles when the rain sensor is active', () => {
    mockUseParkingOverview.mockReturnValue({
      data: {
        telemetryHealth: 'online',
        status: {
          gateId: 'uit-gate-a',
          availableSlots: 0,
          totalSlots: 2,
          occupiedSlots: 2,
          activeSessions: 2,
          lastUpdated: '2026-04-07T05:00:00.000Z',
          sensors: {
            temperature: 25,
            humidity: 88,
            rainDetected: true,
            fireDetected: false,
            deviceIp: '192.168.1.10',
            reportedAt: '2026-04-07T05:00:00.000Z',
          },
          slots: [
            { slotNumber: 'A1', isOccupied: true, zone: 'A', lastUpdated: '2026-04-07T05:00:00.000Z' },
            { slotNumber: 'A2', isOccupied: true, zone: 'A', lastUpdated: '2026-04-07T05:00:00.000Z' },
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

    const { getByText, getByTestId } = render(<ParkingScreen />);

    expect(getByText('Có mưa')).toBeTruthy();
    expect(getByTestId('rain-particles')).toBeTruthy();
  });
});
