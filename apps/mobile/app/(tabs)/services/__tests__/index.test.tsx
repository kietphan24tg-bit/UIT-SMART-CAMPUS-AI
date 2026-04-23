import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import ServicesScreen, { getServiceGridWidth } from '../index';

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
      isCompact: false,
      isTablet: false,
      availableWidth: 320,
      getGridColumns: () => 1,
      getGridItemWidth: () => 320,
    });
  });

  it('renders the featured campus map card and navigates to detail', () => {
    const { getByText, getAllByText } = render(<ServicesScreen />);

    expect(getByText('Bản đồ khuôn viên')).toBeTruthy();
    expect(getAllByText('Mở ngay').length).toBeGreaterThan(0);
    expect(getAllByText('Khả dụng').length).toBeGreaterThan(0);

    fireEvent.press(getByText('Bản đồ khuôn viên'));

    expect(mockRouter.push).toHaveBeenCalledWith('/services/campus-map');
  });

  it('opens the live events service from the services grid', () => {
    const { getByText } = render(<ServicesScreen />);

    fireEvent.press(getByText('Sự kiện & cộng đồng'));

    expect(mockRouter.push).toHaveBeenCalledWith('/services/events');
  });

  it('opens the room booking service from the services grid', () => {
    const { getByText } = render(<ServicesScreen />);

    fireEvent.press(getByText('Đặt phòng'));

    expect(mockRouter.push).toHaveBeenCalledWith('/services/room-booking');
  });

  it('renders live and upcoming service groups on tablet widths', () => {
    mockUseResponsiveLayout.mockReturnValue({
      isCompact: false,
      isTablet: true,
      availableWidth: 600,
      getGridColumns: () => 2,
      getGridItemWidth: () => 280,
    });

    const { getByText } = render(<ServicesScreen />);

    expect(getByText('Nổi bật')).toBeTruthy();
    expect(getByText('Đang hỗ trợ')).toBeTruthy();
    expect(getByText('Sắp tới')).toBeTruthy();
  });

  it('keeps service cards inside the section content width', () => {
    expect(
      getServiceGridWidth({
        isCompact: false,
        isTablet: false,
        availableWidth: 320,
        getGridItemWidth: jest.fn(),
      } as never),
    ).toBe(284);
  });
});
