import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import LoginRoute from '../login';

import { useAuthStore } from '@/stores/auth-store';

jest.mock('@/stores/auth-store');

const mockLogin = jest.fn();
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

describe('LoginRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { login: mockLogin };
      return selector(state);
    });
  });

  it('renders the hero copy and login fields', () => {
    const { getByText, getByPlaceholderText } = render(<LoginRoute />);

    expect(getByText('Hello!')).toBeTruthy();
    expect(getByText('Chào mừng đến với UIT Campus')).toBeTruthy();
    expect(getByPlaceholderText('student@gm.uit.edu.vn')).toBeTruthy();
    expect(getByPlaceholderText('Nhập mật khẩu')).toBeTruthy();
  });

  it('shows nearby navigation links', () => {
    const { getByText } = render(<LoginRoute />);

    expect(getByText('Mình quên mật khẩu rồi!')).toBeTruthy();
    expect(getByText('Đăng ký tại đây')).toBeTruthy();
  });

  it('keeps submit disabled until both fields are entered', () => {
    const screen = render(<LoginRoute />);
    const submitButton = screen.getByRole('button', { name: 'Đăng nhập' });

    expect(submitButton).toBeDisabled();

    fireEvent.changeText(
      screen.getByPlaceholderText('student@gm.uit.edu.vn'),
      'student@gm.uit.edu.vn',
    );
    expect(submitButton).toBeDisabled();

    fireEvent.changeText(screen.getByPlaceholderText('Nhập mật khẩu'), 'Password123');
    expect(submitButton).not.toBeDisabled();
  });

  it('calls login with email and password', async () => {
    mockLogin.mockResolvedValue(undefined);

    const screen = render(<LoginRoute />);

    fireEvent.changeText(screen.getByPlaceholderText('student@gm.uit.edu.vn'), 'test@uit.edu.vn');
    fireEvent.changeText(screen.getByPlaceholderText('Nhập mật khẩu'), 'Password123');
    fireEvent.press(screen.getByRole('button', { name: 'Đăng nhập' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@uit.edu.vn', 'Password123');
    });
  });

  it('shows an error message when login fails', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    const screen = render(<LoginRoute />);

    fireEvent.changeText(screen.getByPlaceholderText('student@gm.uit.edu.vn'), 'test@uit.edu.vn');
    fireEvent.changeText(screen.getByPlaceholderText('Nhập mật khẩu'), 'wrong');
    fireEvent.press(screen.getByRole('button', { name: 'Đăng nhập' }));

    await waitFor(() => {
      expect(screen.getByText('Email hoặc mật khẩu chưa đúng.')).toBeTruthy();
    });
  });
});
