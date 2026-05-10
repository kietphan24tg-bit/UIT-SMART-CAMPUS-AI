import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import HomeScreen from '../index';

import { useDashboardSnapshot } from '@/hooks/use-dashboard-snapshot';
import { useAuthStore } from '@/stores/auth-store';

jest.mock('@/hooks/use-dashboard-snapshot');
jest.mock('@/stores/auth-store');

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

const mockUseDashboardSnapshot = useDashboardSnapshot as unknown as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

const baseDashboard = {
  data: {
    role: 'student',
    todayClasses: [{ id: '1', course: { name: 'SE346', code: 'SE346' } }],
    nextClass: {
      id: '1',
      course: { name: 'SE346', code: 'SE346' },
      instructor: 'C\u00f4 Lan',
      room: 'E3.1',
      startTime: '09:00',
      endTime: '11:00',
    },
    gpa: { gpa: 3.71, totalCredits: 12, totalCourses: 4 },
    unreadCount: 5,
    parking: {
      availableSlots: 1,
      totalSlots: 2,
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
};

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { firstName: 'An', lastName: 'Nguyen', role: 'student' } };
      return selector(state);
    });
    mockUseDashboardSnapshot.mockReturnValue(baseDashboard);
  });

  it('renders the student dashboard in a compact layout', () => {
    render(<HomeScreen />);

    expect(screen.getByText('Xin ch\u00e0o, Nguyen An')).toBeTruthy();
    expect(screen.getByText('Bu\u1ed5i ti\u1ebfp theo')).toBeTruthy();
    expect(screen.getByText('K\u1ebft qu\u1ea3')).toBeTruthy();
    expect(screen.getByText('L\u1ed1i t\u1eaft')).toBeTruthy();
    expect(screen.getByText('09:00 - 11:00')).toBeTruthy();
    expect(screen.getAllByText('Parking').length).toBeGreaterThan(0);
    expect(screen.getAllByText('B\u1ea3n \u0111\u1ed3').length).toBeGreaterThan(0);
  });

  it('renders the operations dashboard for admin users', () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { firstName: 'An', lastName: 'Nguyen', role: 'admin' } };
      return selector(state);
    });
    mockUseDashboardSnapshot.mockReturnValue({
      ...baseDashboard,
      data: {
        ...baseDashboard.data,
        role: 'admin',
        nextClass: null,
        gpa: null,
      },
    });

    render(<HomeScreen />);

    expect(screen.getByText('T\u1ed5ng quan v\u1eadn h\u00e0nh')).toBeTruthy();
    expect(screen.getByText('L\u1ed1i t\u1eaft')).toBeTruthy();
    expect(screen.getAllByText('Parking').length).toBeGreaterThan(0);
    expect(screen.getAllByText('B\u1ea3n \u0111\u1ed3')).toHaveLength(1);
    expect(screen.getByText('GPS/SOS')).toBeTruthy();
    expect(screen.getAllByText('C\u1ea3nh b\u00e1o').length).toBeGreaterThan(0);
  });

  it('opens GPS/SOS from the home shortcut with the home source param', () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { firstName: 'An', lastName: 'Nguyen', role: 'admin' } };
      return selector(state);
    });
    mockUseDashboardSnapshot.mockReturnValue({
      ...baseDashboard,
      data: {
        ...baseDashboard.data,
        role: 'admin',
        nextClass: null,
        gpa: null,
      },
    });

    render(<HomeScreen />);

    fireEvent.press(screen.getByText('GPS/SOS'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/services/gps-sos',
      params: { from: 'home' },
    });
  });

  it('hides the GPA section for lecturers', () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { firstName: 'An', lastName: 'Nguyen', role: 'lecturer' } };
      return selector(state);
    });

    render(<HomeScreen />);

    expect(screen.queryByText('K\u1ebft qu\u1ea3')).toBeNull();
    expect(screen.queryByText('Xem GPA')).toBeNull();
  });

  it('shows a fallback name when user is missing', () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: null };
      return selector(state);
    });

    render(<HomeScreen />);

    expect(screen.getByText('Xin ch\u00e0o, UITer')).toBeTruthy();
  });
});
