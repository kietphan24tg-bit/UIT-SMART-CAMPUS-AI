import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { useAuthStore } from '@/stores/auth-store';

import LoginScreen from '../login';

jest.mock('@/stores/auth-store');

const mockLogin = jest.fn();
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { login: mockLogin };
      return selector(state);
    });
  });

  it('should render email and password inputs', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);

    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Mat khau')).toBeTruthy();
  });

  it('should render login button and register link', () => {
    const { getByText } = render(<LoginScreen />);

    expect(getByText('Dang nhap')).toBeTruthy();
    expect(getByText('Chua co tai khoan? Dang ky')).toBeTruthy();
  });

  it('should show error when submitting with empty fields', async () => {
    const { getByText } = render(<LoginScreen />);

    fireEvent.press(getByText('Dang nhap'));

    await waitFor(() => {
      expect(getByText('Vui long nhap day du thong tin')).toBeTruthy();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should call login with email and password', async () => {
    mockLogin.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@uit.edu.vn');
    fireEvent.changeText(getByPlaceholderText('Mat khau'), 'Password123');
    fireEvent.press(getByText('Dang nhap'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@uit.edu.vn', 'Password123');
    });
  });

  it('should show error message when login fails', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@uit.edu.vn');
    fireEvent.changeText(getByPlaceholderText('Mat khau'), 'wrong');
    fireEvent.press(getByText('Dang nhap'));

    await waitFor(() => {
      expect(getByText('Email hoac mat khau khong dung')).toBeTruthy();
    });
  });
});
