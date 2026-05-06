import React from 'react';
import { render } from '@testing-library/react-native';

import IndexScreen from '../index';

import { useAuthStore } from '@/stores/auth-store';

jest.mock('expo-router', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Redirect: ({ href }: { href: string }) => React.createElement(Text, null, `redirect:${href}`),
  };
});

jest.mock('@/stores/auth-store');

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

describe('IndexScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing while auth is not hydrated', () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        isHydrated: false,
        isAuthenticated: false,
      }),
    );

    const screen = render(<IndexScreen />);

    expect(screen.toJSON()).toBeNull();
  });

  it('redirects authenticated users to home', () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        isHydrated: true,
        isAuthenticated: true,
      }),
    );

    const { getByText } = render(<IndexScreen />);

    expect(getByText('redirect:/home')).toBeTruthy();
  });

  it('redirects unauthenticated users to login', () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        isHydrated: true,
        isAuthenticated: false,
      }),
    );

    const { getByText } = render(<IndexScreen />);

    expect(getByText('redirect:/login')).toBeTruthy();
  });
});
