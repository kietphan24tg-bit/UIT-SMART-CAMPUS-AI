import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { tryRefreshAccessToken } from './client';

const mockedAxios = axios as unknown as {
  post: jest.Mock;
};

describe('tryRefreshAccessToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns unavailable without clearing tokens when refresh fails due to network error', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('refresh-token');
    mockedAxios.post.mockRejectedValue(
      Object.assign(new Error('Network Error'), {
        code: 'ERR_NETWORK',
      }),
    );

    const result = await tryRefreshAccessToken();

    expect(result).toEqual({
      status: 'unavailable',
      accessToken: null,
    });
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });

  it('returns invalid and clears stored tokens when refresh is rejected by the backend', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('refresh-token');
    mockedAxios.post.mockRejectedValue({
      response: {
        status: 401,
        data: { message: 'Invalid refresh token' },
      },
    });

    const result = await tryRefreshAccessToken();

    expect(result).toEqual({
      status: 'invalid',
      accessToken: null,
    });
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_access_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_refresh_token');
  });
});
