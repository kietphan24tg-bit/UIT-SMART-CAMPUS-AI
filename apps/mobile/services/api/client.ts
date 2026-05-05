import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

import { notifyAccessTokenUpdated, notifySessionInvalidated } from './auth-session';

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

type MultipartRequestOptions = {
  fieldName: string;
  uri: string;
  fileName: string;
  mimeType: string;
};

function buildAxiosDebugPayload(error: AxiosError) {
  const method = error.config?.method?.toUpperCase() ?? 'GET';
  const baseURL = error.config?.baseURL ?? API_BASE_URL;
  const requestPath = error.config?.url ?? '';
  const requestUrl = requestPath.startsWith('http')
    ? requestPath
    : `${String(baseURL).replace(/\/+$/g, '')}/${String(requestPath).replace(/^\/+/g, '')}`;

  return {
    message: error.message,
    code: error.code,
    method,
    requestUrl,
    timeout: error.config?.timeout,
    hasResponse: error.response != null,
    status: error.response?.status,
    responseData: error.response?.data,
  };
}

let refreshTokenRequest: Promise<string | null> | null = null;

async function clearStoredTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  notifySessionInvalidated();
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
      notifyAccessTokenUpdated(accessToken);
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
    console.error('[apiClient] request failed', buildAxiosDebugPayload(error));
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

export async function postMultipart<T>(
  path: string,
  { fieldName, uri, fileName, mimeType }: MultipartRequestOptions,
): Promise<T> {
  const formData = new FormData();
  formData.append(fieldName, {
    uri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  const send = async (token: string | null) => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const requestUrl = path.startsWith('http')
      ? path
      : `${String(API_BASE_URL).replace(/\/+$/g, '')}/${String(path).replace(/^\/+/g, '')}`;

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: formData,
    });

    const raw = await response.text();
    let parsed: { data?: T; message?: string; statusCode?: number } | null = null;

    if (raw) {
      try {
        parsed = JSON.parse(raw) as { data?: T; message?: string; statusCode?: number };
      } catch {
        parsed = { message: raw };
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      body: parsed,
    };
  };

  const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  const firstResponse = await send(accessToken);

  if (firstResponse.ok) {
    return (firstResponse.body?.data ?? firstResponse.body) as T;
  }

  if (firstResponse.status === 401 && shouldAttemptRefresh({ url: path })) {
    const nextAccessToken = await refreshAccessToken();
    if (nextAccessToken) {
      const retryResponse = await send(nextAccessToken);
      if (retryResponse.ok) {
        return (retryResponse.body?.data ?? retryResponse.body) as T;
      }
      throw retryResponse.body ?? new Error(`Request failed with status ${retryResponse.status}`);
    }
    await clearStoredTokens();
  }

  throw firstResponse.body ?? new Error(`Request failed with status ${firstResponse.status}`);
}
