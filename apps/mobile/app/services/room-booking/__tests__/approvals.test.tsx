import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
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
    listAdminRequestRooms: jest.fn(),
    listAdminRoomRequestSlots: jest.fn(),
    getAdminSlotRequests: jest.fn(),
    approveOneSlotRequest: jest.fn(),
    rejectAllSlotRequests: jest.fn(),
  },
}));

jest.mock('@/stores/auth-store');

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockRoomBookingsApi = roomBookingsApi as unknown as {
  listAdminRequestRooms: jest.Mock;
  listAdminRoomRequestSlots: jest.Mock;
  getAdminSlotRequests: jest.Mock;
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
    mockRoomBookingsApi.listAdminRequestRooms.mockResolvedValue([
      {
        roomCode: 'C101',
        buildingName: 'Tòa C',
        pendingRequestCount: 2,
        pendingSlotCount: 1,
      },
    ]);
    mockRoomBookingsApi.listAdminRoomRequestSlots.mockResolvedValue({
      roomCode: 'C101',
      slots: [
        {
          bookingDate: '2026-05-04',
          startTime: '07:30',
          endTime: '08:15',
          timeSlotIds: ['slot-1'],
          requestCount: 2,
        },
      ],
    });
    mockRoomBookingsApi.getAdminSlotRequests.mockResolvedValue({
      roomCode: 'C101',
      bookingDate: '2026-05-04',
      timeSlot: {
        id: 'slot-1',
        startTime: '07:30',
        endTime: '08:15',
      },
      requests: [
        {
          id: 'booking-1',
          roomCode: 'C101',
          roomName: null,
          buildingCode: 'C',
          buildingName: 'Tòa C',
          bookingDate: '2026-05-04',
          timeSlotIds: ['slot-1'],
          timeSlots: [],
          slotCount: 1,
          startTime: '07:30',
          endTime: '08:15',
          title: 'Hop nhom',
          purpose: 'Thao luan do an',
          attendeeCount: 4,
          contactName: 'Nguyen Van A',
          contactPhone: '0901234567',
          departmentName: null,
          notes: null,
          status: 'pending',
          approvedAt: null,
          createdAt: '2026-04-28T00:00:00.000Z',
          requester: {
            id: 'user-1',
            fullName: 'Nguyen Van A',
            email: 'student@uit.edu.vn',
          },
        },
      ],
    });
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
    expect(mockRoomBookingsApi.listAdminRequestRooms).not.toHaveBeenCalled();
  });

  it('renders room-grouped request flow for admin role', async () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: {
          role: 'admin',
        },
      }),
    );

    const { getByText } = renderWithClient(<RoomBookingApprovalsScreen />);

    await waitFor(() => {
      expect(getByText('C101')).toBeTruthy();
    });
    expect(getByText('2 yêu cầu chờ duyệt')).toBeTruthy();

    fireEvent.press(getByText('C101'));
    await waitFor(() => {
      expect(getByText('07:30 - 08:15')).toBeTruthy();
    });

    fireEvent.press(getByText('07:30 - 08:15'));
    await waitFor(() => {
      expect(getByText('Hop nhom')).toBeTruthy();
    });
    expect(mockRoomBookingsApi.listAdminRequestRooms).toHaveBeenCalledTimes(1);
  });
});
