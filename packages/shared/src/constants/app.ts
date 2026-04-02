export const APP_NAME = 'Smart Campus';
export const APP_VERSION = '0.1.0';

export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: '15m',
  REFRESH_TOKEN: '7d',
} as const;
