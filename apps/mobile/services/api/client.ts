import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

import { notifyAccessTokenUpdated, notifySessionInvalidated } from './auth-session';

import { createLocalizedError } from '@/utils/error-message';

export const AUTH_ACCESS_TOKEN_KEY = 'auth_access_token';
const ACCESS_TOKEN_KEY = AUTH_ACCESS_TOKEN_KEY;
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

type RetryableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

export type ApiClientErrorCode = 'NETWORK_UNAVAILABLE' | 'SESSION_INVALIDATED' | 'RATE_LIMITED';

export type RefreshAccessTokenResult =
  | {
      status: 'success';
      accessToken: string;
    }
  | {
      status: 'invalid' | 'missing' | 'unavailable';
      accessToken: null;
    };

type ApiClientError = Error & {
  appCode?: ApiClientErrorCode;
  retryAfterSeconds?: number;
};

export function isRateLimitError(error: unknown): error is ApiClientError {
  return hasApiClientErrorCode(error, 'RATE_LIMITED');
}

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

const configuredBaseUrl = Constants.expoConfig?.extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL;
const metroHost = getMetroHost();
const fallbackDevBaseUrl = metroHost
  ? `http://${metroHost}:3000/api/v1`
  : 'http://127.0.0.1:3000/api/v1';
export const API_BASE_URL = configuredBaseUrl ?? (__DEV__ ? fallbackDevBaseUrl : null);
export const API_ORIGIN = API_BASE_URL?.replace(/\/api\/v1\/?$/, '') ?? null;

export const apiClient = axios.create({
  baseURL: API_BASE_URL ?? undefined,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

type MultipartRequestOptions = {
  fieldName: string;
  uri: string;
  fileName: string;
  mimeType: string;
};

type MultipartFormRequestOptions = {
  method?: 'POST' | 'PATCH';
  fields?: Record<string, string | null | undefined>;
  file?:
    | {
        fieldName: string;
        uri: string;
        fileName: string;
        mimeType: string;
      }
    | undefined;
};

function createApiConfigurationError() {
  return new Error(
    'EXPO_PUBLIC_API_URL chưa được cấu hình cho bản build này. APK release đang không biết phải gọi backend nào.',
  );
}

function withApiClientErrorCode(error: Error, appCode: ApiClientErrorCode) {
  const taggedError = error as ApiClientError;
  taggedError.appCode = appCode;
  return taggedError;
}

export function hasApiClientErrorCode(error: unknown, appCode: ApiClientErrorCode) {
  return (
    typeof error === 'object' &&
    error != null &&
    'appCode' in error &&
    (error as ApiClientError).appCode === appCode
  );
}

export function isSessionInvalidatedError(error: unknown) {
  return hasApiClientErrorCode(error, 'SESSION_INVALIDATED');
}

function assertApiBaseUrlConfigured() {
  if (!API_BASE_URL) {
    throw createApiConfigurationError();
  }
}

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

function isExpectedClientError(error: AxiosError) {
  const status = error.response?.status;
  return status != null && status >= 400 && status < 500;
}

function isUnavailableError(error: AxiosError) {
  const errorCode = String(error.code ?? '');
  return (
    error.response == null ||
    errorCode === 'ERR_NETWORK' ||
    errorCode === 'ECONNABORTED' ||
    errorCode === 'ETIMEDOUT'
  );
}

function isRejectedRefreshError(error: AxiosError) {
  return error.response?.status === 401;
}

function createUnavailableClientError(error: unknown, fallback: string) {
  return withApiClientErrorCode(createLocalizedError(error, fallback), 'NETWORK_UNAVAILABLE');
}

function createSessionInvalidatedClientError(error?: unknown) {
  return withApiClientErrorCode(
    createLocalizedError(
      error ?? { message: 'Invalid refresh token' },
      'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
    ),
    'SESSION_INVALIDATED',
  );
}

function createRateLimitClientError(error: AxiosError) {
  const localized = createLocalizedError(
    error.response?.data ?? error,
    'Bạn thao tác quá nhanh. Vui lòng thử lại sau.',
  ) as ApiClientError;
  const data = error.response?.data;
  const retryAfterSeconds =
    data && typeof data === 'object' && 'retryAfterSeconds' in data
      ? Number(data.retryAfterSeconds)
      : Number(error.response?.headers?.['retry-after']);
  localized.appCode = 'RATE_LIMITED';
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    localized.retryAfterSeconds = retryAfterSeconds;
  }
  return localized;
}

async function buildStoredAuthDebugPayload() {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);

  return {
    hasAccessToken: Boolean(accessToken),
    hasRefreshToken: Boolean(refreshToken),
  };
}

function hasStoredSessionTokens(authDebugPayload: {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
}) {
  return authDebugPayload.hasAccessToken || authDebugPayload.hasRefreshToken;
}

function isCanteenDebugRequest(config: AxiosRequestConfig | undefined) {
  const requestUrl = String(config?.url ?? '');
  return requestUrl.includes('/canteen/catalog');
}

function isRefreshableUnauthorizedError(
  error: AxiosError,
  config: RetryableRequestConfig | undefined,
) {
  return (
    error.response?.status === 401 &&
    config != null &&
    !config._retry &&
    shouldAttemptRefresh(config)
  );
}

let refreshTokenRequest: Promise<RefreshAccessTokenResult> | null = null;

async function clearStoredTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  notifySessionInvalidated();
}

async function refreshAccessToken(): Promise<RefreshAccessTokenResult> {
  if (refreshTokenRequest) {
    return refreshTokenRequest;
  }

  refreshTokenRequest = (async () => {
    assertApiBaseUrlConfigured();
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return { status: 'missing', accessToken: null };
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
        await clearStoredTokens();
        return { status: 'invalid', accessToken: null };
      }

      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, nextRefreshToken);
      notifyAccessTokenUpdated(accessToken);
      return { status: 'success', accessToken: accessToken as string };
    } catch (error) {
      const axiosError = error as AxiosError;
      if (isRejectedRefreshError(axiosError)) {
        await clearStoredTokens();
        return { status: 'invalid', accessToken: null };
      }

      return { status: 'unavailable', accessToken: null };
    }
  })();

  try {
    return await refreshTokenRequest;
  } finally {
    refreshTokenRequest = null;
  }
}

export async function tryRefreshAccessToken() {
  return refreshAccessToken();
}

function shouldAttemptRefresh(config: RetryableRequestConfig) {
  const requestUrl = String(config.url ?? '');
  return (
    !requestUrl.includes('/auth/login') &&
    !requestUrl.includes('/auth/register') &&
    !requestUrl.includes('/auth/refresh')
  );
}

apiClient.interceptors.request.use(async (config) => {
  assertApiBaseUrlConfigured();
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (isCanteenDebugRequest(config)) {
    console.warn('[apiClient] canteen request auth debug', {
      method: config.method?.toUpperCase() ?? 'GET',
      url: config.url,
      hasToken: Boolean(token),
      tokenLength: token?.length ?? 0,
      hasAuthorizationHeader: Boolean(config.headers?.Authorization),
    });
  }

  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data?.data ?? response.data,
  async (error: AxiosError) => {
    const authDebugPayload = await buildStoredAuthDebugPayload();
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const isRecoverable401 = isRefreshableUnauthorizedError(error, originalRequest);

    if (!isRecoverable401) {
      if (!isExpectedClientError(error)) {
        console.warn('[apiClient] request failed', {
          ...buildAxiosDebugPayload(error),
          ...authDebugPayload,
          hasAuthorizationHeader: Boolean(error.config?.headers?.Authorization),
        });
      }
      if (isCanteenDebugRequest(error.config)) {
        console.warn('[apiClient] canteen response auth debug', {
          method: error.config?.method?.toUpperCase() ?? 'GET',
          url: error.config?.url,
          status: error.response?.status,
          hasResponse: error.response != null,
          responseData: error.response?.data,
          ...authDebugPayload,
          hasAuthorizationHeader: Boolean(error.config?.headers?.Authorization),
        });
      }
    }

    if (isRecoverable401 && originalRequest) {
      originalRequest._retry = true;
      const refreshResult = await refreshAccessToken();

      if (refreshResult.status === 'success') {
        originalRequest.headers = {
          ...(originalRequest.headers ?? {}),
          Authorization: `Bearer ${refreshResult.accessToken}`,
        };
        return apiClient.request(originalRequest);
      }

      if (hasStoredSessionTokens(authDebugPayload)) {
        console.warn('[apiClient] session refresh failed after 401', {
          ...buildAxiosDebugPayload(error),
          ...authDebugPayload,
          hasAuthorizationHeader: Boolean(error.config?.headers?.Authorization),
        });
      }

      if (refreshResult.status === 'missing') {
        await clearStoredTokens();
      }

      if (refreshResult.status === 'invalid' || refreshResult.status === 'missing') {
        return Promise.reject(createSessionInvalidatedClientError(error.response?.data ?? error));
      }

      if (refreshResult.status === 'unavailable') {
        return Promise.reject(
          createUnavailableClientError(
            { message: 'Network Error' },
            'Không thể kết nối tới máy chủ. Vui lòng thử lại.',
          ),
        );
      }
    }

    if (error.response?.status === 429) {
      return Promise.reject(createRateLimitClientError(error));
    }

    if (isUnavailableError(error)) {
      return Promise.reject(
        createUnavailableClientError(
          error.response?.data ?? error,
          'Không thể kết nối tới máy chủ. Vui lòng thử lại.',
        ),
      );
    }

    return Promise.reject(
      createLocalizedError(
        error.response?.data ?? error,
        'Không thể kết nối tới máy chủ. Vui lòng thử lại.',
      ),
    );
  },
);

export async function postMultipart<T>(
  path: string,
  { fieldName, uri, fileName, mimeType }: MultipartRequestOptions,
): Promise<T> {
  return requestMultipart<T>(path, {
    method: 'POST',
    file: {
      fieldName,
      uri,
      fileName,
      mimeType,
    },
  });
}

export async function requestMultipart<T>(
  path: string,
  { method = 'POST', fields, file }: MultipartFormRequestOptions,
): Promise<T> {
  assertApiBaseUrlConfigured();
  const formData = new FormData();
  Object.entries(fields ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  if (file) {
    formData.append(file.fieldName, {
      uri: file.uri,
      name: file.fileName,
      type: file.mimeType,
    } as unknown as Blob);
  }

  const send = async (token: string | null) => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const requestUrl = path.startsWith('http')
      ? path
      : `${String(API_BASE_URL).replace(/\/+$/g, '')}/${String(path).replace(/^\/+/g, '')}`;

    const response = await fetch(requestUrl, {
      method,
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
    const refreshResult = await refreshAccessToken();
    if (refreshResult.status === 'success') {
      const retryResponse = await send(refreshResult.accessToken);
      if (retryResponse.ok) {
        return (retryResponse.body?.data ?? retryResponse.body) as T;
      }
      throw createLocalizedError(
        retryResponse.body ?? new Error(`Request failed with status ${retryResponse.status}`),
        'Không thể tải tệp lên lúc này.',
      );
    }

    if (refreshResult.status === 'missing') {
      await clearStoredTokens();
    }

    if (refreshResult.status === 'invalid' || refreshResult.status === 'missing') {
      throw createSessionInvalidatedClientError(firstResponse.body);
    }

    if (refreshResult.status === 'unavailable') {
      throw createUnavailableClientError(
        { message: 'Network Error' },
        'Không thể tải tệp lên lúc này.',
      );
    }
  }

  throw createLocalizedError(
    firstResponse.body ?? new Error(`Request failed with status ${firstResponse.status}`),
    'Không thể tải tệp lên lúc này.',
  );
}
