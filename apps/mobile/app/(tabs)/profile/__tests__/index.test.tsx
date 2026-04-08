import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import ProfileScreen from '../index';

import { useAuthStore } from '@/stores/auth-store';

jest.mock('@/stores/auth-store');

const mockLogout = jest.fn();
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

describe('ProfileScreen', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@uit.edu.vn',
    firstName: 'An',
    lastName: 'Nguyen',
    studentId: '22520001',
    role: 'student',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: mockUser, logout: mockLogout };
      return selector(state);
    });
  });

  it('should display user full name', () => {
    const { getAllByText } = render(<ProfileScreen />);

    expect(getAllByText('Nguyen An').length).toBeGreaterThan(0);
  });

  it('should display account summary', () => {
    const { getByText } = render(<ProfileScreen />);

    expect(getByText(/22520001/)).toBeTruthy();
    expect(getByText(/test@uit.edu.vn/)).toBeTruthy();
  });

  it('should display avatar initial from lastName', () => {
    const { getByText } = render(<ProfileScreen />);

    expect(getByText('N')).toBeTruthy();
  });

  it('should call logout when pressing logout button', () => {
    const { getByText } = render(<ProfileScreen />);

    fireEvent.press(getByText('Đăng xuất'));

    expect(mockLogout).toHaveBeenCalled();
  });

  it('should show fallback text when user is null', () => {
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { user: null, logout: mockLogout };
      return selector(state);
    });

    const { getAllByText } = render(<ProfileScreen />);

    expect(getAllByText('UITer').length).toBeGreaterThan(0);
  });
});
