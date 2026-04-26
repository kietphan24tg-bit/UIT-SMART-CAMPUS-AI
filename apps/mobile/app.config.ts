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
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    'expo-notifications',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Ứng dụng cần quyền vị trí để gửi SOS snapshot và mở lộ trình hỗ trợ khẩn cấp.',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission:
          'Ứng dụng cần quyền camera để quét mã QR điểm danh trên màn hình lớp học.',
        barcodeScannerEnabled: true,
        recordAudioAndroid: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

const apiUrl = process.env.EXPO_PUBLIC_API_URL;
const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
const trackAsiaMapKey = process.env.EXPO_PUBLIC_TRACK_ASIA_MAP_KEY;
const trackAsiaStyleUrl = process.env.EXPO_PUBLIC_TRACK_ASIA_STYLE_URL;

export default (): ExpoConfig => ({
  ...config,
  extra: {
    ...config.extra,
    ...(apiUrl ? { apiUrl } : {}),
    ...(trackAsiaMapKey ? { trackAsiaMapKey } : {}),
    ...(trackAsiaStyleUrl ? { trackAsiaStyleUrl } : {}),
    ...(easProjectId ? { eas: { projectId: easProjectId } } : {}),
  },
});
