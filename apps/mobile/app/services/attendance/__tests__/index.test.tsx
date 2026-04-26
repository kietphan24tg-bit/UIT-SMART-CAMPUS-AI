import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AppState, Linking } from 'react-native';

import AttendanceHubScreen from '../index';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockGetCameraPermissionsAsync = jest.fn();
const mockRequestCameraPermissionsAsync = jest.fn();
const mockOpenSettings = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
  useFocusEffect: (effect: () => void) => effect(),
}));

jest.mock('expo-camera', () => ({
  Camera: {
    getCameraPermissionsAsync: (...args: unknown[]) => mockGetCameraPermissionsAsync(...args),
    requestCameraPermissionsAsync: (...args: unknown[]) => mockRequestCameraPermissionsAsync(...args),
  },
}));

describe('AttendanceHubScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() });
    jest.spyOn(Linking, 'openSettings').mockImplementation((...args: unknown[]) =>
      mockOpenSettings(...args),
    );
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

    fireEvent.press(getByText('Bật quyền camera để tiếp tục'));

    await waitFor(() => {
      expect(mockOpenSettings).toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
