import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';

import RoomBookingApprovalsScreen from '../approvals';

import { roomBookingsApi } from '@/services/api/room-bookings';
import { useAuthStore } from '@/stores/auth-store';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('@/services/api/room-bookings', () => ({
  roomBookingsApi: {
    listPendingBookings: jest.fn(),
    approveBooking: jest.fn(),
    rejectBooking: jest.fn(),
  },
}));

jest.mock('@/stores/auth-store');

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockRoomBookingsApi = roomBookingsApi as unknown as {
  listPendingBookings: jest.Mock;
};

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('RoomBookingApprovalsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRoomBookingsApi.listPendingBookings.mockResolvedValue([
      {
        id: 'booking-1',
        roomCode: 'C101',
        title: 'Họp nhóm',
        bookingDate: '2026-04-25',
        startTime: '07:30',
        endTime: '08:15',
        purpose: 'Thảo luận đồ án',
        requester: {
          fullName: 'Nguyen Van A',
          email: 'student@uit.edu.vn',
        },
      },
    ]);
  });

  it('shows access denied for non-admin role', async () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: {
          role: 'student',
        },
      }),
    );

    const { getByText } = renderWithClient(<RoomBookingApprovalsScreen />);

    await waitFor(() => {
      expect(getByText('Bạn không có quyền truy cập')).toBeTruthy();
    });
    expect(mockRoomBookingsApi.listPendingBookings).not.toHaveBeenCalled();
  });

  it('renders pending booking queue for admin role', async () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: {
          role: 'admin',
        },
      }),
    );

    const { getByText } = renderWithClient(<RoomBookingApprovalsScreen />);

    await waitFor(() => {
      expect(getByText('C101 · Họp nhóm')).toBeTruthy();
    });
    expect(getByText('Người yêu cầu: Nguyen Van A')).toBeTruthy();
    expect(mockRoomBookingsApi.listPendingBookings).toHaveBeenCalledTimes(1);
  });
});
