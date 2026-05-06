import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import ServiceDetailScreen from '../[service]';

import { useAuthStore } from '@/stores/auth-store';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

let mockServiceParam = 'campus-map';

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ service: mockServiceParam }),
}));
jest.mock('@/stores/auth-store');

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

describe('ServiceDetailScreen - campus map', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockServiceParam = 'campus-map';
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { role: 'student' } };
      return selector(state);
    });
  });

  it('renders intro content and opens viewer route', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: Infinity,
        },
      },
    });

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <ServiceDetailScreen />
      </QueryClientProvider>,
    );

    expect(getByText('Tổng quan dịch vụ')).toBeTruthy();
    expect(getByText('Mở tour 3D UIT')).toBeTruthy();

    fireEvent.press(getByText('Mở tour 3D UIT'));

    expect(mockRouter.push).toHaveBeenCalledWith('/services/campus-map/view');
  });
});

describe('ServiceDetailScreen - admin tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockServiceParam = 'admin-tools';
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { role: 'admin' } };
      return selector(state);
    });
  });

  it('renders canteen and library actions', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: Infinity,
        },
      },
    });

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <ServiceDetailScreen />
      </QueryClientProvider>,
    );

    expect(getByText('Canteen')).toBeTruthy();
    expect(getByText('Thư viện')).toBeTruthy();

    fireEvent.press(getByText('Mở quản trị canteen'));
    expect(mockRouter.push).toHaveBeenCalledWith('/services/canteen/admin');

    fireEvent.press(getByText('Mở thư viện'));
    expect(mockRouter.push).toHaveBeenCalledWith('/services/library');
  });
});
