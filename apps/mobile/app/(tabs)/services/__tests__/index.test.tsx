import { Alert } from 'react-native';
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

function mockRole(role: string) {
  mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
    const state = { user: { role } };
    return selector(state);
  });
}

describe('ServicesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    mockRole('student');
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

  it('opens parking inside the services route tree', () => {
    const { getByText } = render(<ServicesScreen />);

    fireEvent.press(getByText('Parking + IoT'));

    expect(mockRouter.push).toHaveBeenCalledWith('/services/parking');
  });

  it('opens GPS/SOS from the services grid with the services source param', () => {
    const { getByText } = render(<ServicesScreen />);

    fireEvent.press(getByText('GPS/SOS'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/services/gps-sos',
      params: { from: 'services' },
    });
  });

  it('renders live and unavailable service groups', () => {
    const { getByText } = render(<ServicesScreen />);

    expect(getByText('Nổi bật')).toBeTruthy();
    expect(getByText('Đang hỗ trợ')).toBeTruthy();
    expect(getByText('Chưa khả dụng')).toBeTruthy();
  });

  it('shows an unavailable message when admin presses a blocked service', () => {
    mockRole('admin');

    const { getByText } = render(<ServicesScreen />);

    fireEvent.press(getByText('Nhập điểm'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Không khả dụng',
      'Chỉ có giảng viên mới có quyền nhập điểm',
    );
    expect(mockRouter.push).not.toHaveBeenCalledWith('/services/grades');
  });
});
