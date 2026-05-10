import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import GpsSosScreen from '../index';
import SosFullMapScreen from '../map';

import { sosApi } from '@/services/api/sos';
import { useAuthStore } from '@/stores/auth-store';
import { useSosRealtimeStore } from '@/stores/sos-realtime-store';
import { openGoogleMapsDirections } from '@/utils/google-maps';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

let mockParams: { sosId?: string; from?: string } = {};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
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
jest.mock('@/utils/google-maps', () => ({
  openGoogleMapsDirections: jest.fn(),
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
const mockOpenGoogleMapsDirections =
  openGoogleMapsDirections as unknown as jest.MockedFunction<
    typeof openGoogleMapsDirections
  >;

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

const supporterSosRecord = {
  id: 'sos-1',
  requesterId: 'student-2',
  resolverId: null,
  status: 'active' as const,
  lat: 10.87,
  lng: 106.8,
  accuracyMeters: 5,
  addressSnapshot: 'Khu pho 6, Linh Trung, Thu Duc',
  contactSnapshot: null,
  note: 'Can ho tro gap',
  createdAt: '2026-05-08T00:00:00.000Z',
  updatedAt: '2026-05-08T00:00:00.000Z',
  resolvedAt: null,
  expiresAt: '2026-05-08T06:00:00.000Z',
  requester: {
    id: 'student-2',
    fullName: 'Nguyen Van A',
    email: 'student@example.com',
    phone: null,
  },
};

const ownerSosRecord = {
  ...supporterSosRecord,
  id: 'sos-owner',
  requesterId: 'student-1',
  addressSnapshot: 'Ky tuc xa khu B, Di An',
  requester: {
    id: 'student-1',
    fullName: 'Nguoi Gui SOS',
    email: 'owner@example.com',
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
    mockSosApi.listActive.mockResolvedValue([supporterSosRecord]);
    mockSosApi.listMine.mockResolvedValue([]);
    mockSosApi.getRoute.mockResolvedValue({
      sosId: 'sos-1',
      route: {
        routes: [],
      },
    });
    mockOpenGoogleMapsDirections.mockResolvedValue(undefined);
  });

  it('shows the Google Maps support metric and opens Google Maps for supporter SOS', async () => {
    const screen = renderWithClient(<GpsSosScreen />);

    await waitFor(() => expect(screen.getByText('Nguyen Van A')).toBeTruthy());

    expect(screen.getByText('Google Maps')).toBeTruthy();
    expect(screen.getByText('H\u1ed7 tr\u1ee3')).toBeTruthy();
    expect(screen.getByText('T\u00ecm ch\u00ednh x\u00e1c')).toBeTruthy();

    fireEvent.press(screen.getByText('M\u1edf Google Maps'));

    expect(mockOpenGoogleMapsDirections).toHaveBeenCalledWith(10.87, 106.8);
  });

  it('returns to home when GPS/SOS is opened from the home shortcut', async () => {
    mockParams = { from: 'home' };
    const screen = renderWithClient(<GpsSosScreen />);

    await waitFor(() => expect(screen.getByText('Nguyen Van A')).toBeTruthy());

    fireEvent.press(screen.getByText('Quay l\u1ea1i trang ch\u1ee7'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/home');
  });

  it('returns to services when GPS/SOS is opened from the services list', async () => {
    mockParams = { from: 'services' };
    const screen = renderWithClient(<GpsSosScreen />);

    await waitFor(() => expect(screen.getByText('Nguyen Van A')).toBeTruthy());

    fireEvent.press(screen.getByText('Quay l\u1ea1i d\u1ecbch v\u1ee5'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/services');
  });

  it('defaults the return CTA to services for legacy GPS/SOS entry points', async () => {
    const screen = renderWithClient(<GpsSosScreen />);

    await waitFor(() => expect(screen.getByText('Nguyen Van A')).toBeTruthy());

    fireEvent.press(screen.getByText('Quay l\u1ea1i d\u1ecbch v\u1ee5'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/services');
  });

  it('hides the Google Maps action on SOS owned by the current user', async () => {
    mockSosApi.listActive.mockResolvedValue([supporterSosRecord, ownerSosRecord]);
    mockSosApi.listMine.mockResolvedValue([ownerSosRecord]);

    const screen = renderWithClient(<GpsSosScreen />);

    await waitFor(() => expect(screen.getByText('Nguoi Gui SOS')).toBeTruthy());

    expect(screen.getAllByText('M\u1edf Google Maps')).toHaveLength(1);
  });

  it('opens the owner snapshot from the preview map in full-screen mode', async () => {
    mockSosApi.listActive.mockResolvedValue([ownerSosRecord]);
    mockSosApi.listMine.mockResolvedValue([ownerSosRecord]);

    const screen = renderWithClient(<GpsSosScreen />);

    await waitFor(() => expect(screen.getByText('Nguoi Gui SOS')).toBeTruthy());

    fireEvent.press(screen.getByText('M\u1edf to\u00e0n m\u00e0n h\u00ecnh'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/services/gps-sos/map',
      params: { sosId: 'sos-owner' },
    });
  });

  it('renders the full-screen SOS map without realtime copy, location watch, or route fetch', async () => {
    mockParams = { sosId: 'sos-1' };
    const screen = renderWithClient(<SosFullMapScreen />);

    await waitFor(() => expect(screen.getByText('Nguyen Van A')).toBeTruthy());

    expect(screen.getByText('Khu pho 6, Linh Trung, Thu Duc')).toBeTruthy();
    expect(screen.queryByText(/Realtime SOS:/i)).toBeNull();
    expect(screen.queryByText(/L\u1ed9 tr\u00ecnh realtime/i)).toBeNull();
    expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    expect(Location.watchPositionAsync).not.toHaveBeenCalled();
    expect(mockSosApi.getRoute).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText('Tho\u00e1t b\u1ea3n \u0111\u1ed3 to\u00e0n m\u00e0n h\u00ecnh'));

    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('shows the saved snapshot context for the owner full-screen map', async () => {
    mockParams = { sosId: 'sos-owner' };
    mockSosApi.listActive.mockResolvedValue([ownerSosRecord]);
    mockSosApi.listMine.mockResolvedValue([ownerSosRecord]);

    const screen = renderWithClient(<SosFullMapScreen />);

    await waitFor(() => expect(screen.getByText('Nguoi Gui SOS')).toBeTruthy());

    expect(screen.getByText('Ky tuc xa khu B, Di An')).toBeTruthy();
    expect(screen.queryByText(/Realtime SOS:/i)).toBeNull();
  });

  it('shows cancellation status immediately from realtime event', async () => {
    mockParams = { sosId: 'sos-1' };
    useSosRealtimeStore.getState().registerEvent({
      sosId: 'sos-1',
      request: {
        ...supporterSosRecord,
        status: 'cancelled',
      },
    });

    const screen = renderWithClient(<SosFullMapScreen />);

    await waitFor(() =>
      expect(
        screen.getByText(
          'SOS n\u00e0y \u0111\u00e3 \u0111\u01b0\u1ee3c h\u1ee7y. B\u1ea1n kh\u00f4ng c\u1ea7n ti\u1ebfp t\u1ee5c \u0111\u1ebfn \u0111i\u1ec3m n\u00e0y.',
        ),
      ).toBeTruthy(),
    );
  });
});
