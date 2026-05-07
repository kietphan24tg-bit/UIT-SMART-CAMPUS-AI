import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import GpsSosScreen from '../index';
import SosFullMapScreen from '../map';

import { sosApi } from '@/services/api/sos';
import { useAuthStore } from '@/stores/auth-store';
import { useSosRealtimeStore } from '@/stores/sos-realtime-store';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

let mockParams: { sosId?: string } = {};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));

jest.mock('@/stores/auth-store');
jest.mock('@/services/api/sos', () => ({
  sosApi: {
    listActive: jest.fn(),
    listMine: jest.fn(),
    create: jest.fn(),
    cancel: jest.fn(),
    resolve: jest.fn(),
    getRoute: jest.fn(),
  },
}));

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockSosApi = sosApi as unknown as {
  listActive: jest.Mock;
  listMine: jest.Mock;
  create: jest.Mock;
  cancel: jest.Mock;
  resolve: jest.Mock;
  getRoute: jest.Mock;
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

const sosRecord = {
  id: 'sos-1',
  requesterId: 'student-2',
  resolverId: null,
  status: 'active' as const,
  lat: 10.87,
  lng: 106.8,
  accuracyMeters: 5,
  addressSnapshot: 'Khu phố 6, Linh Trung, Thủ Đức',
  contactSnapshot: null,
  note: 'Cần hỗ trợ gấp',
  createdAt: '2026-05-08T00:00:00.000Z',
  updatedAt: '2026-05-08T00:00:00.000Z',
  resolvedAt: null,
  expiresAt: '2026-05-08T06:00:00.000Z',
  requester: {
    id: 'student-2',
    fullName: 'Nguyễn Văn A',
    email: 'student@example.com',
    phone: null,
  },
};

describe('GPS SOS screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    useSosRealtimeStore.getState().reset();
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: { id: 'student-1', role: 'student' },
      }),
    );
    mockSosApi.listActive.mockResolvedValue([sosRecord]);
    mockSosApi.listMine.mockResolvedValue([]);
    mockSosApi.getRoute.mockResolvedValue({
      sosId: 'sos-1',
      route: {
        routes: [
          {
            overview_polyline: { points: 'encoded-polyline' },
            legs: [
              {
                distance: { value: 1500 },
                duration: { value: 420 },
              },
            ],
          },
        ],
      },
    });
  });

  it('opens the full-screen route map from the SOS feed', async () => {
    const screen = renderWithClient(<GpsSosScreen />);

    await waitFor(() => expect(screen.getByText('Nguyễn Văn A')).toBeTruthy());

    fireEvent.press(screen.getByText('Mở lộ trình'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/services/gps-sos/map',
      params: { sosId: 'sos-1' },
    });
  });

  it('renders the full-screen SOS map and allows exiting', async () => {
    mockParams = { sosId: 'sos-1' };
    const screen = renderWithClient(<SosFullMapScreen />);

    await waitFor(() =>
      expect(screen.getByText('Realtime SOS: đang dự phòng')).toBeTruthy(),
    );

    fireEvent.press(screen.getByLabelText('Thoát bản đồ toàn màn hình'));

    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('accepts TrackAsia geometry routes instead of only Google-style overview polyline', async () => {
    mockParams = { sosId: 'sos-1' };
    mockSosApi.getRoute.mockResolvedValue({
      sosId: 'sos-1',
      route: {
        routes: [
          {
            geometry: {
              coordinates: [
                [106.8, 10.87],
                [106.801, 10.871],
              ],
            },
            distance: 1500,
            duration: 420,
          },
        ],
      },
    });

    const screen = renderWithClient(<SosFullMapScreen />);

    await waitFor(() =>
      expect(screen.getByText('Lộ trình realtime: 1.50 km · 7 phút')).toBeTruthy(),
    );
  });

  it('shows cancellation status immediately from realtime event', async () => {
    mockParams = { sosId: 'sos-1' };
    useSosRealtimeStore.getState().registerEvent({
      sosId: 'sos-1',
      request: {
        ...sosRecord,
        status: 'cancelled',
      },
    });

    const screen = renderWithClient(<SosFullMapScreen />);

    await waitFor(() =>
      expect(
        screen.getByText('SOS này đã được hủy. Bạn không cần tiếp tục đến điểm này.'),
      ).toBeTruthy(),
    );
  });
});
