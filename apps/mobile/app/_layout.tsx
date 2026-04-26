import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ParkingRealtimeProvider } from '@/components/system/parking-realtime-provider';
import { subscribeExpoPushTokenChanges } from '@/services/notifications/push-token-listener';
import { useAuthStore } from '@/stores/auth-store';
import { ThemePreferenceProvider, useResolvedThemeMode } from '@/theme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (fontsLoaded && isHydrated) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isHydrated]);

  useEffect(() => {
    const unsubscribe = subscribeExpoPushTokenChanges();
    return unsubscribe;
  }, []);

  useEffect(() => {
    void useAuthStore.getState().hydrate();
  }, []);

  if (!fontsLoaded || !isHydrated) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemePreferenceProvider>
        <ParkingRealtimeProvider>
          <RootNavigator />
        </ParkingRealtimeProvider>
      </ThemePreferenceProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const colorScheme = useResolvedThemeMode();

  return (
    <>
      <AuthNavigationGate />
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="schedule/semester/[id]" />
        <Stack.Screen name="schedule/[task]" />
        <Stack.Screen name="operations/[task]" />
        <Stack.Screen name="parking/index" />
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
        <Stack.Screen name="services/attendance/class/[scheduleId]" />
        <Stack.Screen name="services/attendance/scan" />
        <Stack.Screen name="services/attendance/result" />
        <Stack.Screen name="services/attendance/history" />
        <Stack.Screen name="services/campus-map/view" />
        <Stack.Screen name="services/library/index" />
        <Stack.Screen name="services/canteen/index" />
        <Stack.Screen name="services/canteen/admin" />
        <Stack.Screen name="services/gps-sos/index" />
        <Stack.Screen name="services/chatbot/index" />
        <Stack.Screen name="services/events/index" />
        <Stack.Screen name="services/events/[slug]" />
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

    // Bypass login gate for local demo/testing. Uncomment this block to require login again.
    // if (!isAuthenticated && !inAuthGroup) {
    //   router.replace('/login');
    //   return;
    // }

    if (isAuthenticated && inAuthGroup) {
      router.replace('/home');
    }
  }, [isAuthenticated, isHydrated, navigationState?.key, router, segments]);

  return null;
}
