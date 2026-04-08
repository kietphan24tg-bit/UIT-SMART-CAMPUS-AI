import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

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
const BASE_URL =
  configuredBaseUrl ??
  (metroHost ? `http://${metroHost}:3000/api/v1` : 'http://127.0.0.1:3000/api/v1');

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data?.data ?? response.data,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_access_token');
      await SecureStore.deleteItemAsync('auth_refresh_token');
    }
    return Promise.reject(error.response?.data ?? error);
  },
);
