export type ApiMode = 'mock' | 'remote';

const RAW_API_MODE = process.env.EXPO_PUBLIC_API_MODE;
const RAW_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

function parseApiMode(value: string | undefined): ApiMode {
  if (value === 'remote' || value === 'mock') {
    return value;
  }
  return 'mock';
}

/** Default when EXPO_PUBLIC_API_BASE_URL is unset: local API during development. */
const DEV_API_BASE_FALLBACK = 'http://localhost:3000/api/v1';

export const API_MODE: ApiMode = parseApiMode(RAW_API_MODE);

export const API_BASE_URL: string =
  typeof RAW_API_BASE_URL === 'string' && RAW_API_BASE_URL.trim().length > 0
    ? RAW_API_BASE_URL.trim()
    : DEV_API_BASE_FALLBACK;
