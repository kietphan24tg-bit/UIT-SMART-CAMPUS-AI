import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'UIT Smart Campus',
  slug: 'smart-campus',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/brand/icon.png',
  scheme: 'smartcampus',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/brand/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'vn.edu.uit.smartcampus',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/brand/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    package: 'vn.edu.uit.smartcampus',
    softwareKeyboardLayoutMode: 'resize',
  },
  plugins: ['expo-router', 'expo-secure-store', 'expo-font'],
  experiments: {
    typedRoutes: true,
  },
};

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export default (): ExpoConfig => ({
  ...config,
  extra: {
    ...config.extra,
    ...(apiUrl ? { apiUrl } : {}),
  },
});
