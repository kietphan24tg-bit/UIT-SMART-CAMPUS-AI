import { render } from '@testing-library/react-native';
import React from 'react';

import ScheduleScreen from '../index';

import { useScheduleScreenData, useOperationsScreenData } from '@/hooks/use-schedule-screen';
import { useAuthStore } from '@/stores/auth-store';

jest.mock('@/hooks/use-schedule-screen');
jest.mock('@/stores/auth-store');

const mockUseScheduleScreenData = useScheduleScreenData as unknown as jest.Mock;
const mockUseOperationsScreenData = useOperationsScreenData as unknown as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

describe('ScheduleScreen', () => {
  beforeEach(() => {
    mockUseOperationsScreenData.mockReturnValue({
      data: {
        parking: {
          availableSlots: 2,
          totalSlots: 4,
          activeSessions: 1,
          occupiedSlots: 2,
          lastUpdated: '2026-04-07T05:00:00.000Z',
          sensors: {
            temperature: 29,
            humidity: 65,
            rainDetected: false,
            fireDetected: false,
            deviceIp: '192.168.1.10',
            reportedAt: '2026-04-07T05:00:00.000Z',
          },
        },
        telemetry: {
          gateId: 'uit-gate-a',
          fireDetected: false,
          rainDetected: false,
          temperature: 29,
          humidity: 65,
          deviceIp: '192.168.1.10',
          reportedAt: '2026-04-07T05:00:00.000Z',
        },
        fireAlerts: {
          items: [{ id: 'fire-1', gateId: 'uit-gate-a', message: 'Phát hiện khói', isResolved: false, reportedAt: '2026-04-07T05:00:00.000Z' }],
        },
        unreadCount: 3,
      },
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });
  });

  it('should render academic schedule for student', () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { role: 'student' } };
      return selector(state);
    });
    mockUseScheduleScreenData.mockReturnValue({
      semesters: [{ id: 'sem-1', name: 'HK2 2024-2025', isCurrent: true }],
      resolvedSemesterId: 'sem-1',
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      schedule: [
        {
          id: 'schedule-1',
          dayOfWeek: 2,
          startTime: '09:00',
          endTime: '11:00',
          room: 'E3.1',
          instructor: 'Cô Lan',
          course: { name: 'SE346', code: 'SE346' },
        },
      ],
    });

    const { getByText, getAllByText } = render(<ScheduleScreen />);

    expect(getByText('Lịch học trong học kỳ')).toBeTruthy();
    expect(getAllByText('HK2 2024-2025').length).toBeGreaterThan(0);
    expect(getAllByText('SE346').length).toBeGreaterThan(0);
  });

  it('should render lecturer support entries', () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { role: 'lecturer' } };
      return selector(state);
    });
    mockUseScheduleScreenData.mockReturnValue({
      semesters: [{ id: 'sem-1', name: 'HK2 2024-2025', isCurrent: true }],
      resolvedSemesterId: 'sem-1',
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      schedule: [
        {
          id: 'schedule-1',
          dayOfWeek: 2,
          startTime: '09:00',
          endTime: '11:00',
          room: 'E3.1',
          instructor: 'Cô Lan',
          semester: { name: 'HK2 2024-2025' },
          course: { name: 'SE346', code: 'SE346' },
        },
      ],
    });

    const { getByText } = render(<ScheduleScreen />);

    expect(getByText('Lịch dạy trong học kỳ')).toBeTruthy();
    expect(getByText('Công cụ giảng dạy')).toBeTruthy();
    expect(getByText('Điểm danh QR')).toBeTruthy();
  });

  it('should render operations variant for admin', () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { role: 'admin' } };
      return selector(state);
    });
    mockUseScheduleScreenData.mockReturnValue({
      semesters: [],
      resolvedSemesterId: undefined,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      schedule: [],
    });

    const { getByText } = render(<ScheduleScreen />);

    expect(getByText('Điều phối campus')).toBeTruthy();
    expect(getByText('Lối vào vận hành')).toBeTruthy();
    expect(getByText('Parking + IoT')).toBeTruthy();
  });
});
