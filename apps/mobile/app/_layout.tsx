import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

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

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemePreferenceProvider>
        <RootNavigator />
      </ThemePreferenceProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const colorScheme = useResolvedThemeMode();

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="schedule/semester/[id]" />
        <Stack.Screen name="schedule/[task]" />
        <Stack.Screen name="operations/[task]" />
        <Stack.Screen name="parking/[task]" />
        <Stack.Screen name="services/[service]" />
        <Stack.Screen name="services/campus-map/view" />
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
