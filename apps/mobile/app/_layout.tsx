import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { useAuthStore } from '@/stores/auth-store';

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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const colorScheme = useColorScheme();

  useEffect(() => {
    hydrate().finally(() => {
      SplashScreen.hideAsync();
    });
  }, [hydrate]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <Stack.Screen name="(auth)" />
        )}
        <Stack.Screen name="schedule/[task]" />
        <Stack.Screen name="operations/[task]" />
        <Stack.Screen name="parking/[task]" />
        <Stack.Screen name="services/[service]" />
        <Stack.Screen name="alerts/[id]" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/[task]" />
        <Stack.Screen name="legal/index" />
        <Stack.Screen name="account/delete" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </QueryClientProvider>
  );
}
