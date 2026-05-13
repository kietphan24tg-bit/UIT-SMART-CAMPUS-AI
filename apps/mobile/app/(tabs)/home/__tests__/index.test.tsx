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
      instructor: 'Cô Lan',
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
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-13T00:00:00+07:00'));
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { firstName: 'An', lastName: 'Nguyen', role: 'student' } };
      return selector(state);
    });
    mockUseDashboardSnapshot.mockReturnValue(baseDashboard);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the student dashboard in a compact layout', () => {
    render(<HomeScreen />);

    expect(screen.getByText('Xin chào, Nguyen An')).toBeTruthy();
    expect(screen.getByText('Đếm ngược tới 20 năm UIT')).toBeTruthy();
    expect(screen.getByText('Buổi tiếp theo')).toBeTruthy();
    expect(screen.getByText('Kết quả')).toBeTruthy();
    expect(screen.getByText('Lối tắt')).toBeTruthy();
    expect(screen.getByText('09:00 - 11:00')).toBeTruthy();
    expect(screen.getAllByText('Parking').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bản đồ').length).toBeGreaterThan(0);
  });

  it('opens the UIT memory game from the anniversary banner', () => {
    render(<HomeScreen />);

    fireEvent.press(screen.getByText('Chơi ghép ảnh UIT'));

    expect(mockRouter.push).toHaveBeenCalledWith('/services/uit-memory');
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

    expect(screen.getByText('Tổng quan vận hành')).toBeTruthy();
    expect(screen.getByText('Lối tắt')).toBeTruthy();
    expect(screen.getAllByText('Parking').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bản đồ')).toHaveLength(1);
    expect(screen.getByText('GPS/SOS')).toBeTruthy();
    expect(screen.getAllByText('Cảnh báo').length).toBeGreaterThan(0);
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

    expect(screen.queryByText('Kết quả')).toBeNull();
    expect(screen.queryByText('Xem GPA')).toBeNull();
  });

  it('shows a fallback name when user is missing', () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: null };
      return selector(state);
    });

    render(<HomeScreen />);

    expect(screen.getByText('Xin chào, UITer')).toBeTruthy();
  });
});
