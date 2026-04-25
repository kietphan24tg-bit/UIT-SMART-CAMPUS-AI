import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import RoomBookingHomeScreen from '../index';

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
    listBuildings: jest.fn().mockResolvedValue([
      {
        id: 'A',
        code: 'A',
        name: 'Tòa A',
        searchText: 'A',
        availableRooms: 12,
        totalRooms: 18,
        subtitle: '12 phòng trống',
      },
      {
        id: 'C',
        code: 'C',
        name: 'Tòa C',
        searchText: 'C',
        availableRooms: 8,
        totalRooms: 15,
        subtitle: '8 phòng trống',
      },
    ]),
    listAllBuildingRooms: jest.fn().mockResolvedValue({
      A: [],
      C: [],
    }),
    listBuildingRooms: jest.fn().mockResolvedValue([]),
  },
}));

describe('RoomBookingHomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders buildings from API and navigates to selected building', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const { getByText, queryByPlaceholderText } = render(
      <QueryClientProvider client={queryClient}>
        <RoomBookingHomeScreen />
      </QueryClientProvider>,
    );

    expect(getByText('Đặt phòng học')).toBeTruthy();
    expect(queryByPlaceholderText('Tìm phòng trống...')).toBeNull();

    await waitFor(() => expect(getByText('Tòa A')).toBeTruthy());
    expect(getByText('Tòa C')).toBeTruthy();

    fireEvent.press(getByText('Tòa C'));
    expect(mockRouter.push).toHaveBeenCalledWith('/services/room-booking/C');
  });
});
