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

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-router', () => ({
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
  useSegments: () => [],
  Link: ({ children }: { children: React.ReactNode }) => children,
  Stack: {
    Screen: () => null,
  },
  Tabs: {
    Screen: () => null,
  },
}));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { apiUrl: 'http://localhost:3000/api/v1' } },
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));
