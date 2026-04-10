import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import ServicesScreen from '../index';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAuthStore } from '@/stores/auth-store';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));
jest.mock('@/stores/auth-store');
jest.mock('@/hooks/use-responsive-layout');

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockUseResponsiveLayout = useResponsiveLayout as unknown as jest.Mock;

describe('ServicesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { role: 'student' } };
      return selector(state);
    });
    mockUseResponsiveLayout.mockReturnValue({
      isTablet: false,
      getGridColumns: () => 1,
      getGridItemWidth: () => 320,
    });
  });

  it('renders campus map service as interactive and navigates to detail', () => {
    const { getByText } = render(<ServicesScreen />);

    expect(getByText('Bản đồ khuôn viên')).toBeTruthy();
    expect(getByText('Mở tour 3D UIT')).toBeTruthy();

    fireEvent.press(getByText('Bản đồ khuôn viên'));

    expect(mockRouter.push).toHaveBeenCalledWith('/services/campus-map');
  });
});
