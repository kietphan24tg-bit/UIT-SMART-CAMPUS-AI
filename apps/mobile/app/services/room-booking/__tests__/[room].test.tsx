import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { TextInput } from 'react-native';

import RoomDetailScreen from '../[building]/[room]';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ building: 'C', room: 'C101' }),
}));

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: {
        id: 'user-1',
        email: 'nguyenvana@uit.edu.vn',
        firstName: 'Van A',
        lastName: 'Nguyen',
        role: 'student',
        phone: '0901234567',
      },
    }),
}));

jest.mock('@/services/api/room-bookings', () => ({
  roomBookingsApi: {
    getRoomSchedule: jest.fn().mockResolvedValue([
      {
        dayKey: 'mon',
        dateKey: '2026-04-20',
        label: 'Th2',
        slots: [
          {
            id: 'mon-1',
            startTime: '07:30',
            endTime: '08:15',
            status: 'free',
            label: 'Tiết 1',
          },
          {
            id: 'mon-2',
            startTime: '08:15',
            endTime: '09:00',
            status: 'occupied',
            label: 'Tiết 2',
            courseCode: 'CE124.Q21',
          },
          {
            id: 'mon-3',
            startTime: '09:00',
            endTime: '09:45',
            status: 'occupied',
            label: 'Tiết 3',
            courseCode: 'CE124.Q21',
          },
        ],
      },
      {
        dayKey: 'sat',
        dateKey: '2026-04-25',
        label: 'Th7',
        slots: [
          {
            id: 'sat-1',
            startTime: '07:30',
            endTime: '09:00',
            status: 'available_later',
            label: 'Trống lúc 09:00',
          },
        ],
      },
    ]),
    createRoomBooking: jest.fn().mockResolvedValue({
      id: 'booking-1',
      roomCode: 'C101',
      roomName: null,
      buildingCode: 'C',
      buildingName: 'Tòa C',
      bookingDate: '2026-04-20',
      timeSlotId: 'mon-1',
      startTime: '07:30',
      endTime: '08:15',
      timeSlot: null,
      title: 'Học nhóm',
      purpose: 'Học nhóm',
      attendeeCount: 5,
      contactName: 'Nguyen Van A',
      contactPhone: '0901234567',
      departmentName: null,
      notes: null,
      status: 'pending',
      approvedAt: null,
      createdAt: '2026-04-23T00:00:00.000Z',
    }),
  },
}));

const { roomBookingsApi } = jest.requireMock('@/services/api/room-bookings') as {
  roomBookingsApi: {
    createRoomBooking: jest.Mock;
  };
};

describe('RoomDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders room schedule and submits booking form to API', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const { getByText, getAllByText, getByDisplayValue, UNSAFE_getAllByType } = render(
      <QueryClientProvider client={queryClient}>
        <RoomDetailScreen />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(getByText('Th2')).toBeTruthy());
    expect(getByText('C101')).toBeTruthy();
    expect(getByText('Th7')).toBeTruthy();
    expect(getByText('Thứ 2:')).toBeTruthy();
    expect(getByText('07:30 - 08:15')).toBeTruthy();
    expect(getAllByText('CE124.Q21').length).toBe(2);

    fireEvent.press(getByText('Đặt phòng'));

    expect(getByText('Đặt phòng')).toBeTruthy();
    expect(getByText('Phòng:')).toBeTruthy();
    expect(getByText('Ngày:')).toBeTruthy();
    expect(getByText('Giờ:')).toBeTruthy();
    expect(getByDisplayValue('5')).toBeTruthy();
    expect(getByDisplayValue('0901234567')).toBeTruthy();
    expect(getByText('Máy chiếu')).toBeTruthy();
    expect(getByText('Micro')).toBeTruthy();

    const inputs = UNSAFE_getAllByType(TextInput);
    fireEvent.changeText(inputs[0], 'SE346 Team Meeting');
    fireEvent.changeText(inputs[3], '0912345678');

    fireEvent.press(getByText('Submit'));

    await waitFor(() => {
      expect(roomBookingsApi.createRoomBooking).toHaveBeenCalledWith(
        {
          roomCode: 'C101',
          bookingDate: '2026-04-20',
          timeSlotId: 'mon-1',
          purpose: 'Học nhóm - Thiết bị cần: Máy chiếu',
          contactName: 'Nguyen Van A',
          contactPhone: '0912345678',
          attendeeCount: 5,
          title: 'SE346 Team Meeting',
        },
        expect.any(Object),
      );
    });
    expect(getByText('Yêu cầu đặt phòng đã được gửi.')).toBeTruthy();
  });
});
