import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';

import RegisterRoute from '../register';

import { useAuthStore } from '@/stores/auth-store';

jest.mock('@/stores/auth-store');

const mockRegister = jest.fn();
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockRouter = router as unknown as {
  push: jest.Mock;
};

const registrationChallenge = {
  challengeId: 'registration-challenge-1',
  maskedEmail: '24***@gm.uit.edu.vn',
  expiresInSeconds: 600,
  resendAvailableInSeconds: 30,
  delivery: 'preview',
  previewCode: '123456',
};

function fillValidRegistrationForm(
  screen: ReturnType<typeof render>,
  email = 'student@gm.uit.edu.vn',
) {
  fireEvent.changeText(screen.getByPlaceholderText('Nguyễn'), 'Nguyễn');
  fireEvent.changeText(screen.getByPlaceholderText('Văn A'), 'Văn A');
  fireEvent.changeText(screen.getByPlaceholderText('22520001'), '22520001');
  fireEvent.changeText(screen.getByPlaceholderText('student@gm.uit.edu.vn'), email);
  fireEvent.changeText(screen.getByPlaceholderText('Ít nhất 8 ký tự'), 'Password123');
  fireEvent.changeText(screen.getByPlaceholderText('Nhập lại mật khẩu'), 'Password123');
}

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

    expect(getByText('B\u1eaft \u0110\u1ea7u')).toBeTruthy();
    expect(
      getByText('Gia nh\u1eadp UIT Campus theo c\u00e1ch th\u1eadt d\u1ec5 d\u00e0ng'),
    ).toBeTruthy();
    expect(
      getByText(
        'Ho\u00e0n t\u1ea5t v\u00e0i th\u00f4ng tin c\u01a1 b\u1ea3n \u0111\u1ec3 m\u1edf kh\u00f3a l\u1ecbch h\u1ecdc, d\u1ecbch v\u1ee5 campus v\u00e0 c\u00e1c ti\u1ec7n \u00edch sinh vi\u00ean.',
      ),
    ).toBeTruthy();
    expect(getByPlaceholderText('Nguy\u1ec5n')).toBeTruthy();
    expect(getByPlaceholderText('V\u0103n A')).toBeTruthy();
    expect(getByPlaceholderText('22520001')).toBeTruthy();
  });

  it('validates password confirmation before submitting', async () => {
    const screen = render(<RegisterRoute />);

    fireEvent.changeText(screen.getByPlaceholderText('Nguy\u1ec5n'), 'Nguy\u1ec5n');
    fireEvent.changeText(screen.getByPlaceholderText('V\u0103n A'), 'V\u0103n A');
    fireEvent.changeText(screen.getByPlaceholderText('22520001'), '22520001');
    fireEvent.changeText(
      screen.getByPlaceholderText('student@gm.uit.edu.vn'),
      'student@gm.uit.edu.vn',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('\u00cdt nh\u1ea5t 8 k\u00fd t\u1ef1'),
      'Password123',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Nh\u1eadp l\u1ea1i m\u1eadt kh\u1ea9u'),
      'Password999',
    );
    fireEvent.press(screen.getByRole('button', { name: 'T\u1ea1o t\u00e0i kho\u1ea3n' }));

    await waitFor(() => {
      expect(
        screen.getByText('M\u1eadt kh\u1ea9u x\u00e1c nh\u1eadn ch\u01b0a kh\u1edbp.'),
      ).toBeTruthy();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('starts the OTP challenge and navigates without authenticating locally', async () => {
    mockRegister.mockResolvedValue(registrationChallenge);
    const screen = render(<RegisterRoute />);
    fillValidRegistrationForm(screen, '  STUDENT@GM.UIT.EDU.VN  ');

    fireEvent.press(screen.getByRole('button', { name: 'Tạo tài khoản' }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'student@gm.uit.edu.vn',
        password: 'Password123',
        studentId: '22520001',
        firstName: 'Văn A',
        lastName: 'Nguyễn',
      });
      expect(mockRouter.push).toHaveBeenCalledWith('/register-otp');
    });
  });

  it('rejects email outside UIT domains before calling the API', async () => {
    const screen = render(<RegisterRoute />);
    fillValidRegistrationForm(screen, 'student@gmail.com');

    fireEvent.press(screen.getByRole('button', { name: 'Tạo tài khoản' }));

    await waitFor(() => {
      expect(screen.getByText('Email cần thuộc miền UIT.')).toBeTruthy();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('surfaces backend register validation errors in Vietnamese', async () => {
    mockRegister.mockRejectedValue(new Error('Student ID must be 8 digits'));

    const screen = render(<RegisterRoute />);

    fireEvent.changeText(screen.getByPlaceholderText('Nguy\u1ec5n'), 'Nguy\u1ec5n');
    fireEvent.changeText(screen.getByPlaceholderText('V\u0103n A'), 'V\u0103n A');
    fireEvent.changeText(screen.getByPlaceholderText('22520001'), '22520001');
    fireEvent.changeText(
      screen.getByPlaceholderText('student@gm.uit.edu.vn'),
      'student@gm.uit.edu.vn',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('\u00cdt nh\u1ea5t 8 k\u00fd t\u1ef1'),
      'Password123',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Nh\u1eadp l\u1ea1i m\u1eadt kh\u1ea9u'),
      'Password123',
    );
    fireEvent.press(screen.getByRole('button', { name: 'T\u1ea1o t\u00e0i kho\u1ea3n' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'M\u00e3 s\u1ed1 sinh vi\u00ean ph\u1ea3i g\u1ed3m \u0111\u00fang 8 ch\u1eef s\u1ed1.',
        ),
      ).toBeTruthy();
    });
  });

  it('localizes duplicate email errors from the API', async () => {
    mockRegister.mockRejectedValue(new Error('Email already exists'));

    const screen = render(<RegisterRoute />);

    fireEvent.changeText(screen.getByPlaceholderText('Nguy\u1ec5n'), 'Ph\u1ea1m');
    fireEvent.changeText(screen.getByPlaceholderText('V\u0103n A'), 'Minh Qu\u00e2n');
    fireEvent.changeText(screen.getByPlaceholderText('22520001'), '24521449');
    fireEvent.changeText(
      screen.getByPlaceholderText('student@gm.uit.edu.vn'),
      '24521449@gm.uit.edu.vn',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('\u00cdt nh\u1ea5t 8 k\u00fd t\u1ef1'),
      'Password123',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Nh\u1eadp l\u1ea1i m\u1eadt kh\u1ea9u'),
      'Password123',
    );
    fireEvent.press(screen.getByRole('button', { name: 'T\u1ea1o t\u00e0i kho\u1ea3n' }));

    await waitFor(() => {
      expect(
        screen.getByText('Email \u0111\u00e3 \u0111\u01b0\u1ee3c \u0111\u0103ng k\u00fd.'),
      ).toBeTruthy();
    });
  });

  it('localizes 500 register fallbacks in Vietnamese', async () => {
    mockRegister.mockRejectedValue(new Error('Internal server error'));

    const screen = render(<RegisterRoute />);

    fireEvent.changeText(screen.getByPlaceholderText('Nguy\u1ec5n'), 'Ph\u1ea1m');
    fireEvent.changeText(screen.getByPlaceholderText('V\u0103n A'), 'Minh Qu\u00e2n');
    fireEvent.changeText(screen.getByPlaceholderText('22520001'), '24521449');
    fireEvent.changeText(
      screen.getByPlaceholderText('student@gm.uit.edu.vn'),
      '24521449@gm.uit.edu.vn',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('\u00cdt nh\u1ea5t 8 k\u00fd t\u1ef1'),
      'Password123',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Nh\u1eadp l\u1ea1i m\u1eadt kh\u1ea9u'),
      'Password123',
    );
    fireEvent.press(screen.getByRole('button', { name: 'T\u1ea1o t\u00e0i kho\u1ea3n' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'H\u1ec7 th\u1ed1ng \u0111ang b\u1eadn. Vui l\u00f2ng th\u1eed l\u1ea1i sau.',
        ),
      ).toBeTruthy();
    });
  });
});
