import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import RoomsInBuildingScreen from '../[building]';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ building: 'C' }),
}));

jest.mock('@/services/api/room-bookings', () => ({
  roomBookingsApi: {
    listBuildings: jest.fn().mockResolvedValue([]),
    listAllBuildingRooms: jest.fn().mockResolvedValue({}),
    listBuildingRooms: jest.fn().mockResolvedValue([]),
  },
}));

describe('RoomsInBuildingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders wireframe-like room cards, filters by floor, and opens room detail', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const { getAllByText, getByText, queryByText } = render(
      <QueryClientProvider client={queryClient}>
        <RoomsInBuildingScreen />
      </QueryClientProvider>,
    );

    expect(getByText('Tòa C')).toBeTruthy();
    expect(getByText('Filter')).toBeTruthy();
    expect(getByText('Tầng')).toBeTruthy();
    expect(getByText('Sức chứa')).toBeTruthy();
    expect(getAllByText('Tất cả')).toHaveLength(2);
    expect(getByText('[C101]')).toBeTruthy();
    expect(getAllByText('50 chỗ').length).toBeGreaterThan(0);
    expect(getByText('Đang trống')).toBeTruthy();
    expect(getByText('Bận đến 11:30')).toBeTruthy();
    expect(getByText('Lab máy tính')).toBeTruthy();
    expect(getByText('Trống 14:00')).toBeTruthy();

    fireEvent.press(getByText('Tầng'));
    fireEvent.press(getByText('2'));

    expect(queryByText('[C101]')).toBeNull();
    expect(getByText('[C201]')).toBeTruthy();

    fireEvent.press(getByText('[C201]'));

    expect(mockRouter.push).toHaveBeenCalledWith('/services/room-booking/C/C201');
  });
});
