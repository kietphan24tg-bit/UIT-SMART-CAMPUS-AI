import '@testing-library/jest-native/extend-expect';

jest.mock('axios', () => {
  const mockAxios: {
    create: jest.Mock;
    interceptors: {
      request: { use: jest.Mock };
      response: { use: jest.Mock };
    };
    get: jest.Mock;
    post: jest.Mock;
    patch: jest.Mock;
    put: jest.Mock;
    delete: jest.Mock;
  } = {
    create: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
  mockAxios.create.mockImplementation(() => mockAxios);

  return {
    __esModule: true,
    default: mockAxios,
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');
  const createIcon = ({ name, ...rest }: { name: string }) => React.createElement(Text, rest, name);

  return {
    Ionicons: createIcon,
    Feather: createIcon,
  };
});

jest.mock('expo-image', () => {
  const React = jest.requireActual('react');
  const { Image } = jest.requireActual('react-native');

  return {
    Image: React.forwardRef((props: Record<string, unknown>, ref: unknown) =>
      React.createElement(Image, { ...props, ref }),
    ),
  };
});

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
}));

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: {
    JPEG: 'jpeg',
  },
  manipulateAsync: jest.fn().mockImplementation(async (uri: string) => ({ uri })),
}));

jest.mock('react-native-webview', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');

  return {
    WebView: React.forwardRef((props: Record<string, unknown>, ref: unknown) =>
      React.createElement(View, { ...props, ref }),
    ),
  };
});

jest.mock('react-native-render-html', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');

  const stripTags = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  return {
    __esModule: true,
    default: ({ source }: { source: { html: string } }) =>
      React.createElement(Text, null, stripTags(source.html)),
    defaultSystemFonts: [],
  };
});

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-notifications', () => ({
  AndroidImportance: {
    HIGH: 'high',
  },
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addPushTokenListener: jest.fn(() => ({ remove: jest.fn() })),
  clearLastNotificationResponseAsync: jest.fn().mockResolvedValue(undefined),
  getLastNotificationResponse: jest.fn(() => null),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[test]' }),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-router', () => ({
  ...(() => {
    const React = jest.requireActual('react');
    const Stack = ({ children }: { children?: React.ReactNode }) => children;
    Stack.Screen = () => null;
    const Tabs = ({ children }: { children?: React.ReactNode }) => children;
    Tabs.Screen = () => null;

    return { React, Stack, Tabs };
  })(),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useRootNavigationState: () => ({ key: 'root' }),
  useSegments: () => [],
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { apiUrl: 'http://localhost:3000/api/v1' } },
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('socket.io-client', () => {
  const socket = {
    connected: false,
    on: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    removeAllListeners: jest.fn(),
  };

  return {
    io: jest.fn(() => socket),
  };
});
