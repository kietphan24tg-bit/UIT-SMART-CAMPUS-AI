import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

export const AUTH_ACCESS_TOKEN_KEY = 'auth_access_token';
const ACCESS_TOKEN_KEY = AUTH_ACCESS_TOKEN_KEY;
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

type RetryableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

function getMetroHost() {
  type ConstantsLike = {
    expoConfig?: { hostUri?: string };
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
    manifest?: { debuggerHost?: string; hostUri?: string };
  };

  const constantsLike = Constants as unknown as ConstantsLike;
  const hostUri: string | undefined =
    constantsLike.expoConfig?.hostUri ??
    constantsLike.manifest2?.extra?.expoClient?.hostUri ??
    constantsLike.manifest?.debuggerHost ??
    constantsLike.manifest?.hostUri;

  if (!hostUri) {
    return null;
  }

  const cleaned = String(hostUri).replace(/^https?:\/\//, '');
  const host = cleaned.split(':')[0]?.trim();

  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return null;
  }

  return host;
}

const configuredBaseUrl =
  Constants.expoConfig?.extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL;
const metroHost = getMetroHost();
export const API_BASE_URL =
  configuredBaseUrl ??
  (metroHost ? `http://${metroHost}:3000/api/v1` : 'http://127.0.0.1:3000/api/v1');
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let refreshTokenRequest: Promise<string | null> | null = null;

async function clearStoredTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

async function refreshAccessToken() {
  if (refreshTokenRequest) {
    return refreshTokenRequest;
  }

  refreshTokenRequest = (async () => {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        },
      );
      const tokens = response.data?.data ?? response.data;
      const accessToken = tokens?.accessToken;
      const nextRefreshToken = tokens?.refreshToken;

      if (!accessToken || !nextRefreshToken) {
        return null;
      }

      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, nextRefreshToken);
      return accessToken as string;
    } catch {
      await clearStoredTokens();
      return null;
    }
  })();

  try {
    return await refreshTokenRequest;
  } finally {
    refreshTokenRequest = null;
  }
}

function shouldAttemptRefresh(config: RetryableRequestConfig) {
  const requestUrl = String(config.url ?? '');
  return !requestUrl.includes('/auth/login') &&
    !requestUrl.includes('/auth/register') &&
    !requestUrl.includes('/auth/refresh');
}

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data?.data ?? response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      shouldAttemptRefresh(originalRequest)
    ) {
      originalRequest._retry = true;
      const accessToken = await refreshAccessToken();

      if (accessToken) {
        originalRequest.headers = {
          ...(originalRequest.headers ?? {}),
          Authorization: `Bearer ${accessToken}`,
        };
        return apiClient.request(originalRequest);
      }

      await clearStoredTokens();
    }
    return Promise.reject(error.response?.data ?? error);
  },
);
