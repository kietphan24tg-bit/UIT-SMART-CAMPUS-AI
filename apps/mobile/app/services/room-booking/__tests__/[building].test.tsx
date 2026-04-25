import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
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
    listBuildings: jest.fn().mockResolvedValue([
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
    listAllBuildingRooms: jest.fn().mockResolvedValue({}),
    listBuildingRooms: jest.fn().mockResolvedValue([
      {
        id: 'C101',
        buildingId: 'C',
        code: 'C101',
        floor: 1,
        capacity: 50,
        status: 'free',
        statusLabel: 'Đang trống',
        equipment: [],
      },
      {
        id: 'C102',
        buildingId: 'C',
        code: 'C102',
        floor: 1,
        capacity: 80,
        status: 'occupied',
        statusLabel: 'Bận đến 11:30',
        equipment: [],
      },
      {
        id: 'C201',
        buildingId: 'C',
        code: 'C201',
        floor: 2,
        capacity: 50,
        status: 'available_later',
        statusLabel: 'Trống 14:00',
        equipment: [],
      },
    ]),
  },
}));

describe('RoomsInBuildingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders room cards, filters by floor, and opens room detail', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: Infinity,
        },
      },
    });

    const { getAllByText, getByText, queryByText } = render(
      <QueryClientProvider client={queryClient}>
        <RoomsInBuildingScreen />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(getByText('[C101]')).toBeTruthy());
    expect(getByText('Tòa C')).toBeTruthy();
    expect(getByText('Filter')).toBeTruthy();
    expect(getByText('Tầng')).toBeTruthy();
    expect(getByText('Sức chứa')).toBeTruthy();
    expect(getAllByText('Tất cả')).toHaveLength(2);
    expect(getAllByText('50 chỗ').length).toBeGreaterThan(0);
    expect(getByText('Đang trống')).toBeTruthy();
    expect(getByText('Bận đến 11:30')).toBeTruthy();
    expect(getByText('Lab máy tính')).toBeTruthy();
    expect(getByText('Trống 14:00')).toBeTruthy();

    fireEvent.press(getByText('Tầng'));
    fireEvent.press(getByText('2'));

    await waitFor(() => expect(queryByText('[C101]')).toBeNull());
    expect(getByText('[C201]')).toBeTruthy();

    fireEvent.press(getByText('[C201]'));
    expect(mockRouter.push).toHaveBeenCalledWith('/services/room-booking/C/C201');
  });
});
