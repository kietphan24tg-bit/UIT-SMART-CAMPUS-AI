import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import RegisterOtpRoute from '../register-otp';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAuthStore } from '@/stores/auth-store';
import { createRegistrationSessionSetupError } from '@/utils/auth-errors';

jest.mock('@/hooks/use-responsive-layout');
jest.mock('@/stores/auth-store');
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: jest.fn(),
}));

const mockVerifyRegistrationOtp = jest.fn();
const mockResendRegistrationOtp = jest.fn();
const mockClearPendingRegistration = jest.fn();
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockUseResponsiveLayout = useResponsiveLayout as jest.Mock;
const mockUseSafeAreaInsets = useSafeAreaInsets as jest.Mock;
const mockRouter = router as unknown as {
  back: jest.Mock;
  replace: jest.Mock;
};

const challenge = {
  challengeId: 'registration-challenge-1',
  maskedEmail: '24***@gm.uit.edu.vn',
  expiresInSeconds: 600,
  resendAvailableInSeconds: 30,
  delivery: 'preview' as const,
  previewCode: '123456',
};

function createResponsiveLayout(width: number, height: number) {
  const isCompact = width < 360;
  const isTablet = width >= 600;
  const horizontalPadding = isCompact ? 14 : isTablet ? 24 : 18;
  return {
    viewportWidth: width,
    viewportHeight: height,
    isCompact,
    isRegularPhone: width >= 360 && width < 393,
    isWidePhone: width >= 393 && width < 412,
    isLargePhone: width >= 412 && width < 480,
    isExtraLargePhone: width >= 480 && width < 600,
    isTablet,
    isLargeScreen: width >= 960,
    horizontalPadding,
    heroPadding: horizontalPadding,
    contentMaxWidth: isTablet ? 880 : width,
    narrowMaxWidth: isTablet ? 720 : width,
    sectionGap: isCompact ? 14 : 18,
    availableWidth: width - horizontalPadding * 2,
    getGridColumns: () => 1,
    getGridItemWidth: () => width - horizontalPadding * 2,
  };
}

function createStoreState(overrides: Record<string, unknown> = {}) {
  return {
    pendingRegistration: {
      challenge,
      expiresAtMs: Date.now() + 600_000,
      resendAvailableAtMs: Date.now() + 30_000,
    },
    isAuthenticated: false,
    verifyRegistrationOtp: mockVerifyRegistrationOtp,
    resendRegistrationOtp: mockResendRegistrationOtp,
    clearPendingRegistration: mockClearPendingRegistration,
    ...overrides,
  };
}

describe('RegisterOtpRoute', () => {
  let storeState: ReturnType<typeof createStoreState>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSafeAreaInsets.mockReturnValue({ top: 0, right: 0, bottom: 0, left: 0 });
    mockUseResponsiveLayout.mockReturnValue(createResponsiveLayout(393, 852));
    storeState = createStoreState();
    mockUseAuthStore.mockImplementation(
      (selector: (state: ReturnType<typeof createStoreState>) => unknown) => selector(storeState),
    );
  });

  it('renders a centered six-cell OTP form with challenge metadata', () => {
    const screen = render(<RegisterOtpRoute />);

    expect(screen.getByText('Xác thực email')).toBeTruthy();
    expect(screen.getByText('24***@gm.uit.edu.vn')).toBeTruthy();
    expect(screen.getByLabelText('Mã OTP gồm 6 chữ số')).toBeTruthy();
    expect(screen.getByText('Mã thử nghiệm: 123456')).toBeTruthy();
    for (let index = 0; index < 6; index += 1) {
      expect(screen.getByTestId(`registration-otp-digit-${index}`)).toBeTruthy();
    }
  });

  it.each([
    [320, 568, 38, 520],
    [768, 1024, 52, 952],
  ])(
    'keeps the centered OTP layout usable at %ipx width',
    (width, height, expectedCellWidth, expectedStageMinHeight) => {
      mockUseResponsiveLayout.mockReturnValue(createResponsiveLayout(width, height));

      const screen = render(<RegisterOtpRoute />);

      expect(screen.getByTestId('registration-otp-card')).toBeTruthy();
      expect(screen.getByTestId('registration-otp-center-stage')).toHaveStyle({
        minHeight: expectedStageMinHeight,
      });
      expect(screen.getByTestId('registration-otp-digit-0')).toHaveStyle({
        width: expectedCellWidth,
      });
      expect(screen.getByTestId('registration-otp-digit-5')).toHaveStyle({
        width: expectedCellWidth,
      });
    },
  );

  it('accepts only six digits, verifies the challenge, and navigates home', async () => {
    mockVerifyRegistrationOtp.mockResolvedValue(undefined);
    const screen = render(<RegisterOtpRoute />);

    fireEvent.changeText(screen.getByTestId('registration-otp-input'), '12a34567');
    fireEvent.press(screen.getByRole('button', { name: 'Xác thực và vào UIT Campus' }));

    await waitFor(() => {
      expect(mockVerifyRegistrationOtp).toHaveBeenCalledWith('123456');
      expect(mockRouter.replace).toHaveBeenCalledWith('/home');
    });
  });

  it('shows a localized verification error and stays on the OTP screen', async () => {
    mockVerifyRegistrationOtp.mockRejectedValue(new Error('Invalid or expired OTP'));
    const screen = render(<RegisterOtpRoute />);

    fireEvent.changeText(screen.getByTestId('registration-otp-input'), '000000');
    fireEvent.press(screen.getByRole('button', { name: 'Xác thực và vào UIT Campus' }));

    await waitFor(() => {
      expect(screen.getByText('OTP không hợp lệ hoặc đã hết hạn.')).toBeTruthy();
    });
    expect(mockRouter.replace).not.toHaveBeenCalledWith('/home');
  });

  it('redirects to login when the account exists but session setup fails', async () => {
    mockVerifyRegistrationOtp.mockRejectedValue(createRegistrationSessionSetupError());
    const screen = render(<RegisterOtpRoute />);

    fireEvent.changeText(screen.getByTestId('registration-otp-input'), '123456');
    fireEvent.press(screen.getByRole('button', { name: 'Xác thực và vào UIT Campus' }));

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    });
    expect(mockRouter.replace).not.toHaveBeenCalledWith('/home');
  });

  it('resends only when the cooldown has finished', async () => {
    storeState = createStoreState({
      pendingRegistration: {
        challenge,
        expiresAtMs: Date.now() + 600_000,
        resendAvailableAtMs: Date.now() - 1_000,
      },
    });
    mockResendRegistrationOtp.mockResolvedValue({ ...challenge, challengeId: 'challenge-2' });
    const screen = render(<RegisterOtpRoute />);

    fireEvent.press(screen.getByRole('button', { name: 'Gửi lại mã OTP' }));

    await waitFor(() => {
      expect(mockResendRegistrationOtp).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Mã OTP mới đã được gửi. Vui lòng kiểm tra email UIT.')).toBeTruthy();
    });
  });

  it('clears the in-memory challenge and goes back to edit registration details', () => {
    const screen = render(<RegisterOtpRoute />);

    fireEvent.press(screen.getByRole('button', { name: 'Quay lại sửa thông tin đăng ký' }));

    expect(mockClearPendingRegistration).toHaveBeenCalledTimes(1);
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('sends an expired challenge back through registration instead of calling resend', () => {
    storeState = createStoreState({
      pendingRegistration: {
        challenge,
        expiresAtMs: Date.now() - 1_000,
        resendAvailableAtMs: Date.now() - 1_000,
      },
    });
    const screen = render(<RegisterOtpRoute />);

    fireEvent.press(screen.getByRole('button', { name: 'Đăng ký lại để nhận mã mới' }));

    expect(mockClearPendingRegistration).toHaveBeenCalledTimes(1);
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockResendRegistrationOtp).not.toHaveBeenCalled();
  });

  it('redirects a direct route visit without a pending challenge back to register', async () => {
    storeState = createStoreState({ pendingRegistration: null });

    render(<RegisterOtpRoute />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/register');
    });
  });
});
