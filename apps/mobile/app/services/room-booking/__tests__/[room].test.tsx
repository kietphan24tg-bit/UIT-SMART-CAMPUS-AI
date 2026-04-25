import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { TextInput } from 'react-native';

import RoomDetailScreen from '../[building]/[room]';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

const mockInvalidateQueries = jest.fn().mockResolvedValue(undefined);
const mockCreateRoomBooking = jest.fn().mockResolvedValue({
  id: 'booking-1',
  roomCode: 'C101',
  roomName: null,
  buildingCode: 'C',
  buildingName: 'Tòa C',
  bookingDate: '2026-04-20',
  timeSlotIds: ['mon-1', 'mon-2'],
  slotCount: 2,
  startTime: '07:30',
  endTime: '09:00',
  timeSlots: [],
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
});

const roomScheduleData = {
  roomCode: 'C101',
  roomName: null,
  buildingCode: 'C',
  buildingName: 'Tòa C',
  capacity: 50,
  days: [
    {
      dayKey: 'mon',
      dateKey: '2026-04-20',
      label: 'Th2',
      slots: [
        {
          id: 'mon-1',
          slotNumber: 1,
          startTime: '07:30',
          endTime: '08:15',
          status: 'free',
          label: 'Tiết 1',
          statusLabel: 'Trống',
        },
        {
          id: 'mon-2',
          slotNumber: 2,
          startTime: '08:15',
          endTime: '09:00',
          status: 'free',
          label: 'Tiết 2',
          statusLabel: 'Trống',
        },
        {
          id: 'mon-3',
          slotNumber: 3,
          startTime: '09:00',
          endTime: '09:45',
          status: 'occupied',
          label: 'Tiết 3',
          statusLabel: 'CE124.Q21',
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
          slotNumber: 1,
          startTime: '07:30',
          endTime: '08:15',
          status: 'free',
          label: 'Tiết 1',
          statusLabel: 'Trống',
        },
      ],
    },
  ],
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ building: 'C', room: 'C101' }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: roomScheduleData,
    isError: false,
    refetch: jest.fn(),
  })),
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
  useMutation: jest.fn(
    ({
      mutationFn,
      onSuccess,
      onError,
    }: {
      mutationFn: (payload: unknown) => Promise<unknown>;
      onSuccess?: (result: unknown) => void;
      onError?: (error: unknown) => void;
    }) => ({
      isPending: false,
      mutate: async (payload: unknown) => {
        try {
          const result = await mutationFn(payload);
          await onSuccess?.(result);
        } catch (error) {
          onError?.(error);
        }
      },
    }),
  ),
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
    getRoomSchedule: jest.fn().mockResolvedValue(roomScheduleData),
    createRoomBooking: (...args: unknown[]) => mockCreateRoomBooking(...args),
  },
}));

describe('RoomDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders room schedule, keeps day tabs balanced, and submits a multi-slot booking', async () => {
    const { getByText, getByDisplayValue, getAllByText, getByTestId, UNSAFE_getAllByType } =
      render(<RoomDetailScreen />);

    expect(getByText('Th2')).toBeTruthy();
    expect(getByText('C101')).toBeTruthy();
    expect(getByText('Th7')).toBeTruthy();
    expect(getByText('Thứ 2:')).toBeTruthy();
    expect(getByText('07:30 - 08:15')).toBeTruthy();
    expect(getAllByText('CE124.Q21').length).toBe(1);
    expect(getByTestId('room-day-tab-sat')).toBeTruthy();

    fireEvent.press(getByText('08:15 - 09:00'));
    fireEvent.press(getByText('Đặt phòng'));

    await waitFor(() => {
      expect(getByText('Phòng:')).toBeTruthy();
    });

    expect(getByText('Ngày:')).toBeTruthy();
    expect(getByText('Giờ:')).toBeTruthy();
    expect(getByText('07:30 - 09:00 · 2 tiết')).toBeTruthy();
    expect(getByDisplayValue('5')).toBeTruthy();
    expect(getByDisplayValue('0901234567')).toBeTruthy();
    expect(getByText('Máy chiếu')).toBeTruthy();
    expect(getByText('Micro')).toBeTruthy();

    const inputs = UNSAFE_getAllByType(TextInput);
    fireEvent.changeText(inputs[0], 'SE346 Team Meeting');
    fireEvent.changeText(inputs[3], '0912345678');

    fireEvent.press(getByText('Gửi yêu cầu'));

    await waitFor(() => {
      expect(mockCreateRoomBooking).toHaveBeenCalledWith({
        roomCode: 'C101',
        bookingDate: '2026-04-20',
        timeSlotIds: ['mon-1', 'mon-2'],
        purpose: 'Học nhóm - Thiết bị cần: Máy chiếu',
        contactName: 'Nguyen Van A',
        contactPhone: '0912345678',
        attendeeCount: 5,
        title: 'SE346 Team Meeting',
      });
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['room-bookings', 'room-schedule', 'C101'],
    });
    expect(getByText('Yêu cầu đặt phòng đã được gửi.')).toBeTruthy();
  });
});
