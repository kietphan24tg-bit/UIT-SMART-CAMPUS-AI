import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import LoginScreen from '../login';

import { useAuthStore } from '@/stores/auth-store';

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

    expect(getByPlaceholderText('student@gm.uit.edu.vn')).toBeTruthy();
    expect(getByPlaceholderText('Nhập mật khẩu')).toBeTruthy();
  });

  it('should render login controls', () => {
    const { getAllByText, getByText } = render(<LoginScreen />);

    expect(getAllByText('Đăng nhập').length).toBeGreaterThan(0);
    expect(getByText('Đăng ký')).toBeTruthy();
    expect(getByText('Quên mật khẩu?')).toBeTruthy();
  });

  it('should show error when submitting with empty fields', async () => {
    const { getAllByText, getByText } = render(<LoginScreen />);

    fireEvent.press(getAllByText('Đăng nhập')[1]);

    await waitFor(() => {
      expect(getByText('Vui lòng nhập đầy đủ email và mật khẩu.')).toBeTruthy();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should call login with email and password', async () => {
    mockLogin.mockResolvedValue(undefined);

    const { getByPlaceholderText, getAllByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('student@gm.uit.edu.vn'), 'test@uit.edu.vn');
    fireEvent.changeText(getByPlaceholderText('Nhập mật khẩu'), 'Password123');
    fireEvent.press(getAllByText('Đăng nhập')[1]);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@uit.edu.vn', 'Password123');
    });
  });

  it('should show error message when login fails', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    const { getByPlaceholderText, getAllByText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('student@gm.uit.edu.vn'), 'test@uit.edu.vn');
    fireEvent.changeText(getByPlaceholderText('Nhập mật khẩu'), 'wrong');
    fireEvent.press(getAllByText('Đăng nhập')[1]);

    await waitFor(() => {
      expect(getByText('Email hoặc mật khẩu chưa chính xác.')).toBeTruthy();
    });
  });
});
