import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import ChangePasswordScreen from '../change-password';

import { authApi } from '@/services/api/auth';

jest.mock('@/services/api/auth', () => ({
  authApi: {
    changePassword: jest.fn(),
  },
}));

const mockedAuthApi = authApi as unknown as {
  changePassword: jest.Mock;
};

describe('ChangePasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all password fields', () => {
    const screen = render(<ChangePasswordScreen />);

    expect(screen.getByText('Đổi mật khẩu')).toBeTruthy();
    expect(screen.getByPlaceholderText('Nhập mật khẩu hiện tại')).toBeTruthy();
    expect(screen.getByPlaceholderText('Ít nhất 8 ký tự')).toBeTruthy();
    expect(screen.getByPlaceholderText('Nhập lại mật khẩu mới')).toBeTruthy();
  });

  it('shows error when current password is empty', async () => {
    const screen = render(<ChangePasswordScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập mật khẩu hiện tại.')).toBeTruthy();
    });
    expect(mockedAuthApi.changePassword).not.toHaveBeenCalled();
  });

  it('shows error when new password is too weak', async () => {
    const screen = render(<ChangePasswordScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Nhập mật khẩu hiện tại'), 'OldPass123');
    fireEvent.changeText(screen.getByPlaceholderText('Ít nhất 8 ký tự'), 'weak');
    fireEvent.changeText(screen.getByPlaceholderText('Nhập lại mật khẩu mới'), 'weak');
    fireEvent.press(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    await waitFor(() => {
      expect(
        screen.getByText('Mật khẩu mới tối thiểu 8 ký tự, có 1 chữ hoa và 1 số.'),
      ).toBeTruthy();
    });
    expect(mockedAuthApi.changePassword).not.toHaveBeenCalled();
  });

  it('shows error when new password matches current password', async () => {
    const screen = render(<ChangePasswordScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Nhập mật khẩu hiện tại'), 'Password123');
    fireEvent.changeText(screen.getByPlaceholderText('Ít nhất 8 ký tự'), 'Password123');
    fireEvent.changeText(screen.getByPlaceholderText('Nhập lại mật khẩu mới'), 'Password123');
    fireEvent.press(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    await waitFor(() => {
      expect(screen.getByText('Mật khẩu mới phải khác mật khẩu hiện tại.')).toBeTruthy();
    });
    expect(mockedAuthApi.changePassword).not.toHaveBeenCalled();
  });

  it('shows error when confirmation does not match', async () => {
    const screen = render(<ChangePasswordScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Nhập mật khẩu hiện tại'), 'OldPass123');
    fireEvent.changeText(screen.getByPlaceholderText('Ít nhất 8 ký tự'), 'NewPassword1');
    fireEvent.changeText(screen.getByPlaceholderText('Nhập lại mật khẩu mới'), 'Mismatch1');
    fireEvent.press(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    await waitFor(() => {
      expect(screen.getByText('Mật khẩu xác nhận chưa khớp.')).toBeTruthy();
    });
    expect(mockedAuthApi.changePassword).not.toHaveBeenCalled();
  });

  it('calls API and shows success when all fields are valid', async () => {
    mockedAuthApi.changePassword.mockResolvedValue({ success: true });

    const screen = render(<ChangePasswordScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Nhập mật khẩu hiện tại'), 'OldPass123');
    fireEvent.changeText(screen.getByPlaceholderText('Ít nhất 8 ký tự'), 'NewPassword1');
    fireEvent.changeText(screen.getByPlaceholderText('Nhập lại mật khẩu mới'), 'NewPassword1');
    fireEvent.press(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    await waitFor(() => {
      expect(screen.getByText('Đổi mật khẩu thành công')).toBeTruthy();
      expect(screen.getByText('Mật khẩu đã được đổi thành công.')).toBeTruthy();
    });
    expect(mockedAuthApi.changePassword).toHaveBeenCalledWith({
      currentPassword: 'OldPass123',
      newPassword: 'NewPassword1',
    });
  });

  it('shows API error message on failure', async () => {
    mockedAuthApi.changePassword.mockRejectedValue(new Error('Current password is incorrect'));

    const screen = render(<ChangePasswordScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Nhập mật khẩu hiện tại'), 'WrongPass1');
    fireEvent.changeText(screen.getByPlaceholderText('Ít nhất 8 ký tự'), 'NewPassword1');
    fireEvent.changeText(screen.getByPlaceholderText('Nhập lại mật khẩu mới'), 'NewPassword1');
    fireEvent.press(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    await waitFor(() => {
      expect(screen.getByText('Current password is incorrect')).toBeTruthy();
    });
  });
});
