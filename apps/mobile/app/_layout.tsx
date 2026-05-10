import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { SosRealtimeProvider } from '@/components/system/sos-realtime-provider';
import { ParkingRealtimeProvider } from '@/components/system/parking-realtime-provider';
import { StartupLoadingScreen } from '@/components/system/startup-loading-screen';
import {
  configureForegroundNotificationHandler,
  flushPendingNotificationNavigation,
  subscribePushNotificationEvents,
} from '@/services/notifications/push-receiver';
import { subscribeExpoPushTokenChanges } from '@/services/notifications/push-token-listener';
import { syncPushToken } from '@/services/notifications/push';
import { appQueryClient } from '@/services/query-client';
import { useAuthStore } from '@/stores/auth-store';
import { ThemePreferenceProvider, useResolvedThemeMode } from '@/theme';

SplashScreen.preventAutoHideAsync();

const STARTUP_MINIMUM_MS = 1500;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isStartupScreenVisible, setIsStartupScreenVisible] = useState(true);
  const hasHiddenNativeSplashRef = useRef(false);
  const minimumVisibleUntilRef = useRef(Date.now() + STARTUP_MINIMUM_MS);
  const isAppReady = fontsLoaded && isHydrated;

  useEffect(() => {
    if (!isStartupScreenVisible || !isAppReady) {
      return;
    }

    const remaining = minimumVisibleUntilRef.current - Date.now();
    if (remaining <= 0) {
      setIsStartupScreenVisible(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsStartupScreenVisible(false);
    }, remaining);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isAppReady, isStartupScreenVisible]);

  useEffect(() => {
    void useAuthStore.getState().hydrate();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        return;
      }

      const { isAuthenticated, accessToken } = useAuthStore.getState();
      if (!isAuthenticated && !accessToken) {
        return;
      }

      void useAuthStore.getState().hydrate();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    configureForegroundNotificationHandler();

    const unsubscribePushEvents = subscribePushNotificationEvents(appQueryClient);
    const unsubscribeTokenChanges = subscribeExpoPushTokenChanges();

    return () => {
      unsubscribePushEvents();
      unsubscribeTokenChanges();
    };
  }, []);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) {
      return;
    }

    flushPendingNotificationNavigation();
    void syncPushToken().catch(() => undefined);
  }, [isAuthenticated, isHydrated]);

  useEffect(() => {
    if (isStartupScreenVisible || hasHiddenNativeSplashRef.current) {
      return;
    }

    hasHiddenNativeSplashRef.current = true;
    void SplashScreen.hideAsync();
  }, [isStartupScreenVisible]);

  const handleStartupScreenReady = () => {
    if (hasHiddenNativeSplashRef.current) {
      return;
    }

    hasHiddenNativeSplashRef.current = true;
    void SplashScreen.hideAsync();
  };

  return (
    <QueryClientProvider client={appQueryClient}>
      <ThemePreferenceProvider>
        <ParkingRealtimeProvider>
          <SosRealtimeProvider>
            <>
              <RootNavigator isStartupScreenVisible={isStartupScreenVisible} />
              {isStartupScreenVisible ? (
                <StartupLoadingScreen onReadyToDisplay={handleStartupScreenReady} />
              ) : null}
            </>
          </SosRealtimeProvider>
        </ParkingRealtimeProvider>
      </ThemePreferenceProvider>
    </QueryClientProvider>
  );
}

function RootNavigator({ isStartupScreenVisible }: { isStartupScreenVisible: boolean }) {
  const colorScheme = useResolvedThemeMode();
  const statusBarStyle = isStartupScreenVisible
    ? 'dark'
    : colorScheme === 'dark'
      ? 'light'
      : 'dark';

  return (
    <>
      <AuthNavigationGate />
      <StatusBar style={statusBarStyle} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="schedule/semester/[id]" />
        <Stack.Screen name="schedule/[task]" />
        <Stack.Screen name="operations/[task]" />
        <Stack.Screen name="parking/[task]" />
        <Stack.Screen name="services/room-booking/index" />
        <Stack.Screen name="services/room-booking/my" />
        <Stack.Screen name="services/room-booking/approvals" />
        <Stack.Screen name="services/room-booking/[building]" />
        <Stack.Screen name="services/room-booking/[building]/[room]" />
        <Stack.Screen name="services/[service]" />
        <Stack.Screen name="services/course-registration/index" />
        <Stack.Screen name="services/admin-catalog/index" />
        <Stack.Screen name="services/attendance/index" />
        <Stack.Screen name="services/attendance/lecturer" />
        <Stack.Screen name="services/attendance/scan" />
        <Stack.Screen name="services/attendance/result" />
        <Stack.Screen name="services/attendance/history" />
        <Stack.Screen name="services/campus-map/view" />
        <Stack.Screen name="services/library/index" />
        <Stack.Screen name="services/library/admin" />
        <Stack.Screen name="services/canteen/index" />
        <Stack.Screen name="services/canteen/admin" />
        <Stack.Screen name="services/gps-sos/index" />
        <Stack.Screen name="services/gps-sos/map" />
        <Stack.Screen name="services/chatbot/index" />
        <Stack.Screen name="services/events/index" />
        <Stack.Screen name="services/events/[slug]" />
        <Stack.Screen name="services/parking/index" />
        <Stack.Screen name="alerts/[id]" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/[task]" />
        <Stack.Screen name="legal/index" />
        <Stack.Screen name="account/delete" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

function AuthNavigationGate() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (!navigationState?.key || !isHydrated) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && inAuthGroup) {
      router.replace('/home');
    }
  }, [isAuthenticated, isHydrated, navigationState?.key, router, segments]);

  return null;
}
