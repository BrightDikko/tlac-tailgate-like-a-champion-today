import { API_BASE_URL } from '@/src/services/config/env';

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

/**
 * Derives the API host root (scheme + host + port) from the app REST base URL,
 * which normally ends in `/api/v1`.
 */
export function getApiHostUrl(apiBaseUrl: string = API_BASE_URL): string {
  const trimmed = apiBaseUrl.trim();
  if (trimmed === '') {
    return '';
  }

  const noTrailing = stripTrailingSlashes(trimmed);
  const withoutApiV1 = noTrailing.replace(/\/api\/v1$/i, '');
  const normalized = stripTrailingSlashes(withoutApiV1);

  try {
    const u = new URL(normalized);
    return u.origin;
  } catch {
    return normalized;
  }
}

/** Host root for non-versioned routes (e.g. `GET /health`). */
export const API_HOST_URL = getApiHostUrl();
