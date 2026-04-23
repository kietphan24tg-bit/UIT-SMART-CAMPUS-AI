import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render } from '@testing-library/react-native';
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
    listBuildings: jest.fn().mockResolvedValue([]),
    listAllBuildingRooms: jest.fn().mockResolvedValue({}),
    listBuildingRooms: jest.fn().mockResolvedValue([]),
  },
}));

describe('RoomBookingHomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders buildings and navigates to the selected building', () => {
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
    expect(getByText('Tòa A')).toBeTruthy();
    expect(getByText('Tòa C')).toBeTruthy();

    fireEvent.press(getByText('Tòa C'));

    expect(mockRouter.push).toHaveBeenCalledWith('/services/room-booking/C');
  });
});
