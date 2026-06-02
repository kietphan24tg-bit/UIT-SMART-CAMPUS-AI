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

  it('renders clickable support rows and opens the admin tool destinations', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: Infinity,
        },
      },
    });

    const { getByLabelText, getByText, queryByText } = render(
      <QueryClientProvider client={queryClient}>
        <ServiceDetailScreen />
      </QueryClientProvider>,
    );

    expect(
      getByText(
        'Ứng dụng đang tập trung vào các luồng quản trị có dữ liệu thật: vận hành campus, phê duyệt đặt phòng, canteen, thư viện và tài liệu.',
      ),
    ).toBeTruthy();
    expect(getByText('Canteen')).toBeTruthy();
    expect(getByText('Thư viện')).toBeTruthy();
    expect(getByText('Tài liệu')).toBeTruthy();
    expect(getByText('Vận hành campus')).toBeTruthy();
    expect(getByText('Đặt phòng')).toBeTruthy();

    fireEvent.press(getByLabelText('Canteen'));
    expect(mockRouter.push).toHaveBeenCalledWith('/services/canteen/admin');

    fireEvent.press(getByLabelText('Tài liệu'));
    expect(mockRouter.push).toHaveBeenCalledWith('/services/study-materials/admin');

    fireEvent.press(getByLabelText('Thư viện'));
    expect(mockRouter.push).toHaveBeenCalledWith('/services/library/admin');

    fireEvent.press(getByLabelText('Vận hành campus'));
    expect(mockRouter.push).toHaveBeenCalledWith('/services/admin-tools/campus-operations');

    fireEvent.press(getByLabelText('Đặt phòng'));
    expect(mockRouter.push).toHaveBeenCalledWith('/services/room-booking/approvals');

    expect(queryByText('Mở quản trị canteen')).toBeNull();
    expect(queryByText('Mở queue phê duyệt đặt phòng')).toBeNull();
    expect(queryByText('Mở quản trị tài liệu')).toBeNull();
    expect(queryByText('Mở thư viện')).toBeNull();
    expect(queryByText('Mở vận hành campus')).toBeNull();
    expect(queryByText('Parking, telemetry, fire alert')).toBeNull();
  });
});
