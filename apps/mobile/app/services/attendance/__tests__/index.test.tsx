import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { USER_ROLES } from '@smart-campus/shared';
import React from 'react';
import { AppState, Linking } from 'react-native';

import AttendanceHubScreen from '../index';

import { useAuthStore } from '@/stores/auth-store';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockGetCameraPermissionsAsync = jest.fn();
const mockRequestCameraPermissionsAsync = jest.fn();
const mockOpenSettings = jest.fn();

jest.mock('expo-router', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    useRouter: () => ({
      push: mockPush,
      back: mockBack,
    }),
    useFocusEffect: (effect: () => void) => effect(),
    Redirect: ({ href }: { href: string }) => React.createElement(Text, null, `redirect:${href}`),
  };
});

jest.mock('expo-camera', () => ({
  Camera: {
    getCameraPermissionsAsync: (...args: unknown[]) => mockGetCameraPermissionsAsync(...args),
    requestCameraPermissionsAsync: (...args: unknown[]) =>
      mockRequestCameraPermissionsAsync(...args),
  },
}));

jest.mock('@/stores/auth-store');

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

function mockRole(role: string) {
  mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) =>
    selector({
      user: {
        id: 'user-1',
        role,
      },
    }),
  );
}

describe('AttendanceHubScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() });
    jest
      .spyOn(Linking, 'openSettings')
      .mockImplementation((...args: unknown[]) => mockOpenSettings(...args));
    mockRole(USER_ROLES.STUDENT);
    mockGetCameraPermissionsAsync.mockResolvedValue({
      status: 'undetermined',
      granted: false,
      expires: 'never',
      canAskAgain: true,
    });
    mockRequestCameraPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      expires: 'never',
      canAskAgain: true,
    });
  });

  it('requests camera permission before navigating to scan screen', async () => {
    const { getByText } = render(<AttendanceHubScreen />);
    await waitFor(() => expect(mockGetCameraPermissionsAsync).toHaveBeenCalled());

    fireEvent.press(getByText('Bật quyền camera để tiếp tục'));

    await waitFor(() => {
      expect(mockRequestCameraPermissionsAsync).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/services/attendance/scan');
    });
  });

  it('opens settings when camera permission is permanently denied', async () => {
    mockRequestCameraPermissionsAsync.mockResolvedValue({
      status: 'denied',
      granted: false,
      expires: 'never',
      canAskAgain: false,
    });

    const { getByText } = render(<AttendanceHubScreen />);
    await waitFor(() => expect(mockGetCameraPermissionsAsync).toHaveBeenCalled());

    fireEvent.press(getByText('Bật quyền camera để tiếp tục'));

    await waitFor(() => {
      expect(mockOpenSettings).toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it.each([USER_ROLES.LECTURER])(
    'redirects %s role to attendance management screen',
    async (role) => {
      mockRole(role);

      const { getByText } = render(<AttendanceHubScreen />);

      await waitFor(() => expect(mockGetCameraPermissionsAsync).toHaveBeenCalled());
      expect(getByText('redirect:/services/attendance/lecturer')).toBeTruthy();
    },
  );

  it('shows permission notice for unsupported role', async () => {
    mockRole(USER_ROLES.ADMIN);

    const { getByText } = render(<AttendanceHubScreen />);

    await waitFor(() => expect(mockGetCameraPermissionsAsync).toHaveBeenCalled());
    expect(getByText('Bạn không có quyền truy cập')).toBeTruthy();
    expect(getByText('Chỉ có giảng viên mới thực hiện điểm danh')).toBeTruthy();
  });
});
