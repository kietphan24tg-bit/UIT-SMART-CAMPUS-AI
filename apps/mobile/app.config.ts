import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'UIT Smart Campus',
  slug: 'smart-campus',
  owner: 'uit-smart-campus',
  version: '2.0.1',
  orientation: 'portrait',
  icon: './assets/brand/icon.png',
  scheme: 'smartcampus',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/brand/splash-blank.png',
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'vn.edu.uit.smartcampus',
    buildNumber: '201',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/brand/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    package: 'vn.edu.uit.smartcampus.app',
    versionCode: 201,
    softwareKeyboardLayoutMode: 'resize',
    usesCleartextTraffic: true,
  },
  plugins: [
    './plugins/with-android-release-network',
    'expo-router',
    'expo-secure-store',
    'expo-font',
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

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const raw = readFileSync(filePath, 'utf8');

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function loadMobileEnv() {
  const projectRoot = __dirname;
  const workspaceRoot = path.resolve(projectRoot, '..', '..');
  const envFiles = [
    path.join(projectRoot, '.env.local'),
    path.join(projectRoot, '.env'),
    path.join(workspaceRoot, '.env.local'),
    path.join(workspaceRoot, '.env'),
  ];

  for (const envFile of envFiles) {
    loadEnvFile(envFile);
  }
}

loadMobileEnv();

const apiUrl = process.env.EXPO_PUBLIC_API_URL;
const easProjectId =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? 'b2923cbc-a879-4209-98cd-f0b14ad11c80';
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
