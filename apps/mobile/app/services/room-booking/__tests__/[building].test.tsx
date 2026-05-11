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
        name: 'T\u00f2a C',
        searchText: 'C',
        availableRooms: 8,
        totalRooms: 15,
        subtitle: '8 ph\u00f2ng tr\u1ed1ng',
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
        statusLabel: '\u0110ang tr\u1ed1ng',
        equipment: [],
      },
      {
        id: 'C102',
        buildingId: 'C',
        code: 'C102',
        floor: 1,
        capacity: 80,
        status: 'occupied',
        statusLabel: 'B\u1eadn \u0111\u1ebfn 11:30',
        equipment: [],
      },
      {
        id: 'C201',
        buildingId: 'C',
        code: 'C201',
        floor: 2,
        capacity: 50,
        status: 'available_later',
        statusLabel: 'Tr\u1ed1ng 14:00',
        equipment: [],
      },
    ]),
  },
}));

describe('RoomsInBuildingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders room cards and opens room detail', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: Infinity,
        },
      },
    });

    const { getAllByText, getByText } = render(
      <QueryClientProvider client={queryClient}>
        <RoomsInBuildingScreen />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(getByText('[C101]')).toBeTruthy());
    expect(getByText('T\u00f2a C')).toBeTruthy();
    expect(getByText('Filter')).toBeTruthy();
    expect(getByText('T\u1ea7ng')).toBeTruthy();
    expect(getByText('S\u1ee9c ch\u1ee9a')).toBeTruthy();
    expect(getAllByText('T\u1ea5t c\u1ea3')).toHaveLength(2);
    expect(getAllByText('50 ch\u1ed7').length).toBeGreaterThan(0);
    expect(getByText('Lab m\u00e1y t\u00ednh')).toBeTruthy();
    expect(getByText('[C201]')).toBeTruthy();

    fireEvent.press(getByText('[C201]'));
    expect(mockRouter.push).toHaveBeenCalledWith('/services/room-booking/C/C201');
  });
});
