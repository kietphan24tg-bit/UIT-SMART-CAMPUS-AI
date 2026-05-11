import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import ForgotPasswordRoute from '../forgot-password';

import { authApi } from '@/services/api/auth';

jest.mock('@/services/api/auth', () => ({
  authApi: {
    requestPasswordReset: jest.fn(),
    verifyPasswordResetOtp: jest.fn(),
    resetPassword: jest.fn(),
  },
}));

const mockedAuthApi = authApi as unknown as {
  requestPasswordReset: jest.Mock;
  verifyPasswordResetOtp: jest.Mock;
  resetPassword: jest.Mock;
};

describe('ForgotPasswordRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the request step with student email field', () => {
    const { getByText, getByPlaceholderText } = render(<ForgotPasswordRoute />);

    expect(getByText('Khôi Phục')).toBeTruthy();
    expect(getByText('Lấy lại quyền truy cập UIT Campus chỉ với 3 bước')).toBeTruthy();
    expect(getByText('Quên mật khẩu')).toBeTruthy();
    expect(getByPlaceholderText('student@gm.uit.edu.vn')).toBeTruthy();
  });

  it('shows a validation message for invalid email', async () => {
    const screen = render(<ForgotPasswordRoute />);

    fireEvent.changeText(
      screen.getByPlaceholderText('student@gm.uit.edu.vn'),
      'not-uit@example.com',
    );
    fireEvent.press(screen.getByText('Gửi OTP'));

    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập email sinh viên hợp lệ.')).toBeTruthy();
    });
    expect(mockedAuthApi.requestPasswordReset).not.toHaveBeenCalled();
  });

  it('moves to the OTP step after requesting reset successfully', async () => {
    mockedAuthApi.requestPasswordReset.mockResolvedValue({
      maskedEmail: 'st***@gm.uit.edu.vn',
      expiresInSeconds: 600,
      previewCode: '123456',
    });

    const screen = render(<ForgotPasswordRoute />);

    fireEvent.changeText(
      screen.getByPlaceholderText('student@gm.uit.edu.vn'),
      'student@gm.uit.edu.vn',
    );
    fireEvent.press(screen.getByText('Gửi OTP'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Xác thực OTP' })).toBeTruthy();
      expect(screen.getByPlaceholderText('123456')).toBeTruthy();
    });
  });

  it('shows an API error and stays on the email step when account does not exist', async () => {
    mockedAuthApi.requestPasswordReset.mockRejectedValue(
      new Error('Email chưa được đăng ký tài khoản.'),
    );

    const screen = render(<ForgotPasswordRoute />);

    fireEvent.changeText(
      screen.getByPlaceholderText('student@gm.uit.edu.vn'),
      '24521189@gm.uit.edu.vn',
    );
    fireEvent.press(screen.getByText('Gửi OTP'));

    await waitFor(() => {
      expect(screen.getByText('Email chưa được đăng ký tài khoản.')).toBeTruthy();
    });

    expect(screen.queryByText('Xác thực OTP')).toBeNull();
    expect(screen.queryByPlaceholderText('123456')).toBeNull();
  });

  it('shows a localized OTP error in the verify step', async () => {
    mockedAuthApi.requestPasswordReset.mockResolvedValue({
      maskedEmail: 'st***@gm.uit.edu.vn',
      expiresInSeconds: 600,
      previewCode: '123456',
    });
    mockedAuthApi.verifyPasswordResetOtp.mockRejectedValue(new Error('Invalid or expired OTP'));

    const screen = render(<ForgotPasswordRoute />);

    fireEvent.changeText(
      screen.getByPlaceholderText('student@gm.uit.edu.vn'),
      'student@gm.uit.edu.vn',
    );
    fireEvent.press(screen.getByText('Gửi OTP'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Xác thực OTP' })).toBeTruthy();
    });

    fireEvent.changeText(screen.getByPlaceholderText('123456'), '000000');
    fireEvent.press(screen.getByRole('button', { name: 'Xác thực OTP' }));

    await waitFor(() => {
      expect(screen.getByText('OTP không hợp lệ hoặc đã hết hạn.')).toBeTruthy();
    });
  });

  it('shows two password visibility toggles in the reset step', async () => {
    mockedAuthApi.requestPasswordReset.mockResolvedValue({
      maskedEmail: 'st***@gm.uit.edu.vn',
      expiresInSeconds: 600,
      previewCode: '123456',
    });
    mockedAuthApi.verifyPasswordResetOtp.mockResolvedValue({ verified: true });

    const screen = render(<ForgotPasswordRoute />);

    fireEvent.changeText(
      screen.getByPlaceholderText('student@gm.uit.edu.vn'),
      'student@gm.uit.edu.vn',
    );
    fireEvent.press(screen.getByText('Gửi OTP'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Xác thực OTP' })).toBeTruthy();
    });

    fireEvent.changeText(screen.getByPlaceholderText('123456'), '123456');
    fireEvent.press(screen.getByRole('button', { name: 'Xác thực OTP' }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ít nhất 8 ký tự')).toBeTruthy();
      expect(screen.getAllByLabelText('Hiện mật khẩu')).toHaveLength(2);
    });
  });
});
