import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import AuthIndexScreen from '../index';

import { useAuthStore } from '@/stores/auth-store';

jest.mock('@/stores/auth-store');

const mockLogin = jest.fn();
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

describe('AuthIndexScreen', () => {
  const pressPrimaryLogin = (nodes: ReturnType<typeof render>['getAllByText']) => {
    const matches = nodes('Đăng nhập');
    fireEvent.press(matches[matches.length - 1]);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { login: mockLogin };
      return selector(state);
    });
  });

  it('should render email and password inputs', () => {
    const { getByPlaceholderText } = render(<AuthIndexScreen />);

    expect(getByPlaceholderText('student@gm.uit.edu.vn')).toBeTruthy();
    expect(getByPlaceholderText('Nhập mật khẩu')).toBeTruthy();
  });

  it('should render login controls', () => {
    const { getAllByText, getByText } = render(<AuthIndexScreen />);

    expect(getAllByText('Đăng nhập').length).toBeGreaterThan(0);
    expect(getByText('Đăng ký')).toBeTruthy();
    expect(getByText('Quên mật khẩu?')).toBeTruthy();
  });

  it('should show error when submitting with empty fields', async () => {
    const screen = render(<AuthIndexScreen />);

    pressPrimaryLogin(screen.getAllByText);

    await waitFor(() => {
      expect(screen.getByText('Nhập đủ email và mật khẩu.')).toBeTruthy();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should call login with email and password', async () => {
    mockLogin.mockResolvedValue(undefined);

    const screen = render(<AuthIndexScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('student@gm.uit.edu.vn'), 'test@uit.edu.vn');
    fireEvent.changeText(screen.getByPlaceholderText('Nhập mật khẩu'), 'Password123');
    pressPrimaryLogin(screen.getAllByText);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@uit.edu.vn', 'Password123');
    });
  });

  it('should show error message when login fails', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    const screen = render(<AuthIndexScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('student@gm.uit.edu.vn'), 'test@uit.edu.vn');
    fireEvent.changeText(screen.getByPlaceholderText('Nhập mật khẩu'), 'wrong');
    pressPrimaryLogin(screen.getAllByText);

    await waitFor(() => {
      expect(screen.getByText('Email hoặc mật khẩu chưa đúng.')).toBeTruthy();
    });
  });
});
