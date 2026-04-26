import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import ServicesScreen from '../index';

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

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;


describe('ServicesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: { role: 'student' } };
      return selector(state);
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

  it('renders live and upcoming service groups', () => {
    const { getByText } = render(<ServicesScreen />);

    expect(getByText('Nổi bật')).toBeTruthy();
    expect(getByText('Đang hỗ trợ')).toBeTruthy();
    expect(getByText('Sắp tới')).toBeTruthy();
  });
});
