import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { USER_ROLES } from '@smart-campus/shared';

import AttendanceHubScreen from '../index';

import { useAuthStore } from '@/stores/auth-store';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

const mockGetCameraPermissionsAsync = jest.fn();

jest.mock('expo-router', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    useRouter: () => mockRouter,
    useFocusEffect: (callback: () => void) => callback(),
    Redirect: ({ href }: { href: string }) => React.createElement(Text, null, `redirect:${href}`),
  };
});

jest.mock('expo-camera', () => ({
  Camera: {
    getCameraPermissionsAsync: () => mockGetCameraPermissionsAsync(),
  },
}));

jest.mock('@/stores/auth-store');

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

describe('AttendanceHubScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCameraPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
      expires: 'never',
      status: 'granted',
    });
  });

  it('renders scan hub for student role', async () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: {
          role: USER_ROLES.STUDENT,
        },
      }),
    );

    const { getByText } = render(<AttendanceHubScreen />);

    await waitFor(() => {
      expect(getByText('Quét QR điểm danh')).toBeTruthy();
    });
    expect(getByText('Mở camera quét QR')).toBeTruthy();
  });

  it.each([USER_ROLES.LECTURER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])(
    'redirects %s role to attendance management screen',
    async (role) => {
      mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
        selector({
          user: {
            role,
          },
        }),
      );

      const { getByText } = render(<AttendanceHubScreen />);

      await waitFor(() => {
        expect(getByText('redirect:/services/attendance/lecturer')).toBeTruthy();
      });
    },
  );

  it('shows permission notice for unsupported role', async () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
      selector({
        user: {
          role: USER_ROLES.CANTEEN_ADMIN,
        },
      }),
    );

    const { getByText } = render(<AttendanceHubScreen />);

    await waitFor(() => {
      expect(getByText('Tính năng quét QR hiện chỉ dành cho tài khoản sinh viên.')).toBeTruthy();
    });
  });
});
