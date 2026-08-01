import { authApi } from './auth';
import { apiClient } from './client';

jest.mock('./client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

const mockedApiClient = apiClient as unknown as {
  post: jest.Mock;
};

describe('authApi registration OTP flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests a registration challenge', async () => {
    const payload = {
      email: 'student@gm.uit.edu.vn',
      password: 'Password123',
      studentId: '22520001',
      firstName: 'Văn A',
      lastName: 'Nguyễn',
    };
    mockedApiClient.post.mockResolvedValue({ challengeId: 'challenge-1' });

    await authApi.register(payload);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/register', payload, {
      timeout: 30_000,
    });
  });

  it('verifies the registration OTP and returns auth tokens', async () => {
    const payload = { challengeId: 'challenge-1', otp: '123456' };
    mockedApiClient.post.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });

    await authApi.verifyRegistrationOtp(payload);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/register/verify', payload);
  });

  it('resends the registration OTP for the current challenge', async () => {
    const payload = { challengeId: 'challenge-1' };
    mockedApiClient.post.mockResolvedValue({ challengeId: 'challenge-2' });

    await authApi.resendRegistrationOtp(payload);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/register/resend', payload, {
      timeout: 30_000,
    });
  });

  it('allows enough time for password-reset OTP email delivery', async () => {
    const payload = { email: 'student@uit.edu.vn' };
    mockedApiClient.post.mockResolvedValue({ maskedEmail: 'st***@uit.edu.vn' });

    await authApi.requestPasswordReset(payload);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/password-reset/request', payload, {
      timeout: 30_000,
    });
  });
});
