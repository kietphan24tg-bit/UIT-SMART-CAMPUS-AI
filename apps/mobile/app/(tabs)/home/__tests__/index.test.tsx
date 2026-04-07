import { render } from '@testing-library/react-native';
import React from 'react';

import HomeScreen from '../index';

import { useDashboardSnapshot } from '@/hooks/use-dashboard-snapshot';
import { useAuthStore } from '@/stores/auth-store';

jest.mock('@/hooks/use-dashboard-snapshot');
jest.mock('@/stores/auth-store');

const mockUseDashboardSnapshot = useDashboardSnapshot as unknown as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

describe('HomeScreen', () => {
  beforeEach(() => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { firstName: 'An', lastName: 'Nguyen', role: 'student' } };
      return selector(state);
    });

    mockUseDashboardSnapshot.mockReturnValue({
      data: {
        role: 'student',
        todayClasses: [{ id: '1', course: { name: 'SE346', code: 'SE346' } }],
        nextClass: {
          id: '1',
          course: { name: 'SE346', code: 'SE346' },
          instructor: 'Co Lan',
          room: 'E3.1',
          startTime: '09:00',
          endTime: '11:00',
        },
        gpa: { gpa: 3.71, totalCredits: 12, totalCourses: 4 },
        unreadCount: 5,
        parking: {
          availableSlots: 3,
          totalSlots: 4,
          activeSessions: 1,
          occupiedSlots: 1,
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
        telemetryHealth: 'online',
      },
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });
  });

  it('should render greeting with user name', () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText('Xin chao, Nguyen An!')).toBeTruthy();
  });

  it('should render dashboard summary cards', () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText('Lich hom nay')).toBeTruthy();
    expect(getByText('Canh bao moi')).toBeTruthy();
    expect(getByText('3/4')).toBeTruthy();
  });

  it('should render role quick actions and student tasks', () => {
    const { getByText, getAllByText } = render(<HomeScreen />);

    expect(getByText('Lich hoc')).toBeTruthy();
    expect(getByText('Diem & GPA')).toBeTruthy();
    expect(getAllByText('Parking + IoT').length).toBeGreaterThan(0);
    expect(getByText('Tac vu hoc vu')).toBeTruthy();
  });

  it('should render next class card', () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText('Buoi tiep theo')).toBeTruthy();
    expect(getByText('SE346')).toBeTruthy();
    expect(getByText('09:00 - 11:00')).toBeTruthy();
  });

  it('should show fallback name when user is null', () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: null };
      return selector(state);
    });

    const { getByText } = render(<HomeScreen />);

    expect(getByText('Xin chao, UITer!')).toBeTruthy();
  });
});
