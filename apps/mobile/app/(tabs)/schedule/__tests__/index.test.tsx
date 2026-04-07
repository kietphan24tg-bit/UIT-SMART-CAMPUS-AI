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
        },
        telemetry: {
          fireDetected: false,
          deviceIp: '192.168.1.10',
          reportedAt: '2026-04-07T05:00:00.000Z',
        },
        fireAlerts: [{ id: 'fire-1', isResolved: false }],
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
          instructor: 'Co Lan',
          course: { name: 'SE346', code: 'SE346' },
        },
      ],
    });

    const { getByText, getAllByText } = render(<ScheduleScreen />);

    expect(getByText('Lich hoc tuan nay')).toBeTruthy();
    expect(getByText('HK2 2024-2025')).toBeTruthy();
    expect(getAllByText('SE346').length).toBeGreaterThan(0);
  });

  it('should render lecturer task sections', () => {
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
          instructor: 'Co Lan',
          semester: { name: 'HK2 2024-2025' },
          course: { name: 'SE346', code: 'SE346' },
        },
      ],
    });

    const { getByText } = render(<ScheduleScreen />);

    expect(getByText('Lich day & tac vu lop')).toBeTruthy();
    expect(getByText('Tac vu giang day')).toBeTruthy();
    expect(getByText('Action screens')).toBeTruthy();
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

    expect(getByText('Bang dieu phoi van hanh')).toBeTruthy();
    expect(getByText('Tac vu van hanh')).toBeTruthy();
    expect(getByText('Parking zone A')).toBeTruthy();
  });
});
