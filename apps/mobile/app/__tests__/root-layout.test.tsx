import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import RootLayout from '../_layout';

import { useAuthStore } from '@/stores/auth-store';

jest.mock('@expo-google-fonts/inter', () => ({
  Inter_400Regular: 'Inter_400Regular',
  Inter_500Medium: 'Inter_500Medium',
  Inter_600SemiBold: 'Inter_600SemiBold',
  useFonts: jest.fn(),
}));

jest.mock('@tanstack/react-query-persist-client', () => ({
  PersistQueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/components/system/parking-realtime-provider', () => ({
  ParkingRealtimeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/components/system/sos-realtime-provider', () => ({
  SosRealtimeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/components/system/service-warmup-provider', () => ({
  ServiceWarmupProvider: () => null,
}));

jest.mock('@/theme', () => ({
  ThemePreferenceProvider: ({ children }: { children: React.ReactNode }) => children,
  useResolvedThemeMode: () => 'light',
}));

jest.mock('@/stores/auth-store');

const splashScreen = jest.requireMock('expo-splash-screen') as {
  hideAsync: jest.Mock;
};
const fontModule = jest.requireMock('@expo-google-fonts/inter') as {
  useFonts: jest.Mock;
};
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

describe('RootLayout startup loading screen', () => {
  const mockHydrate = jest.fn().mockResolvedValue(undefined);
  const storeState = {
    isAuthenticated: false,
    isHydrated: false,
    hydrate: mockHydrate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    fontModule.useFonts.mockReturnValue([true]);
    mockUseAuthStore.mockImplementation((selector: (state: typeof storeState) => unknown) =>
      selector(storeState),
    );
    (
      mockUseAuthStore as typeof mockUseAuthStore & {
        getState: () => typeof storeState;
      }
    ).getState = () => storeState;
    storeState.isAuthenticated = false;
    storeState.isHydrated = false;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the startup loading screen before hydration finishes', () => {
    const screen = render(<RootLayout />);

    expect(screen.getByTestId('startup-loading-screen')).toBeTruthy();
    expect(mockHydrate).toHaveBeenCalledTimes(1);
  });

  it('keeps the startup loading screen visible for at least 1.5 seconds after the app is ready', async () => {
    storeState.isHydrated = true;

    const screen = render(<RootLayout />);

    expect(screen.getByTestId('startup-loading-screen')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(1499);
    });

    expect(screen.getByTestId('startup-loading-screen')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('startup-loading-screen')).toBeNull();
    });
  });

  it('keeps the startup loading screen visible when hydration is still pending after 1.5 seconds', async () => {
    const screen = render(<RootLayout />);

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId('startup-loading-screen')).toBeTruthy();
  });

  it('hides the native splash once the startup loading screen is laid out', async () => {
    const screen = render(<RootLayout />);

    expect(splashScreen.hideAsync).not.toHaveBeenCalled();

    fireEvent(screen.getByTestId('startup-loading-screen'), 'layout', {
      nativeEvent: { layout: { height: 812, width: 375, x: 0, y: 0 } },
    });

    await waitFor(() => {
      expect(splashScreen.hideAsync).toHaveBeenCalledTimes(1);
    });
  });
});
