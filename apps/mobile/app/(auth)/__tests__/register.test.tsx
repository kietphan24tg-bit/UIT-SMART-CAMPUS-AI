import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import RegisterRoute from '../register';

import { useAuthStore } from '@/stores/auth-store';

jest.mock('@/stores/auth-store');

const mockRegister = jest.fn();
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

describe('RegisterRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: (state: unknown) => unknown) => {
      const state = { register: mockRegister };
      return selector(state);
    });
  });

  it('renders the hero copy and registration form', () => {
    const { getByText, getByPlaceholderText } = render(<RegisterRoute />);

    expect(getByText('Bắt Đầu')).toBeTruthy();
    expect(getByText('Gia nhập UIT Campus theo cách thật dễ dàng')).toBeTruthy();
    expect(
      getByText(
        'Hoàn tất vài thông tin cơ bản để mở khóa lịch học, dịch vụ campus và các tiện ích sinh viên.',
      ),
    ).toBeTruthy();
    expect(getByPlaceholderText('Nguyễn')).toBeTruthy();
    expect(getByPlaceholderText('Văn A')).toBeTruthy();
    expect(getByPlaceholderText('22520001')).toBeTruthy();
  });

  it('validates password confirmation before submitting', async () => {
    const screen = render(<RegisterRoute />);

    fireEvent.changeText(screen.getByPlaceholderText('Nguyễn'), 'Nguyễn');
    fireEvent.changeText(screen.getByPlaceholderText('Văn A'), 'Văn A');
    fireEvent.changeText(screen.getByPlaceholderText('22520001'), '22520001');
    fireEvent.changeText(
      screen.getByPlaceholderText('student@gm.uit.edu.vn'),
      'student@gm.uit.edu.vn',
    );
    fireEvent.changeText(screen.getByPlaceholderText('Ít nhất 8 ký tự'), 'Password123');
    fireEvent.changeText(screen.getByPlaceholderText('Nhập lại mật khẩu'), 'Password999');
    fireEvent.press(screen.getByRole('button', { name: 'Tạo tài khoản' }));

    await waitFor(() => {
      expect(screen.getByText('Mật khẩu xác nhận chưa khớp.')).toBeTruthy();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });
});
