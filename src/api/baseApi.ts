import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryApi, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

import { clearCredentials, hydrateTokens } from '@/src/features/auth/authSlice';
import type { AuthState } from '@/src/features/auth/authTypes';
import { API_BASE_URL, API_MODE } from '@/src/services/config/env';
import { tokenStorage } from '@/src/services/storage/tokenStorage';

import { mockBaseQuery } from './mockBaseQuery';

type AuthAwareRoot = { auth: AuthState };

function getRequestUrl(args: string | FetchArgs): string {
  return typeof args === 'string' ? args : args.url;
}

function shouldAttemptRefresh(args: string | FetchArgs): boolean {
  const url = getRequestUrl(args);
  return (
    !url.includes('/auth/login') &&
    !url.includes('/auth/register') &&
    !url.includes('/auth/refresh') &&
    !url.includes('/auth/logout')
  );
}

function isUnauthorized(error: FetchBaseQueryError | undefined): boolean {
  if (error === undefined) return false;
  return 'status' in error && error.status === 401;
}

function extractTokensFromRecord(obj: Record<string, unknown>): { accessToken: string; refreshToken?: string } | null {
  if (typeof obj.accessToken === 'string' && obj.accessToken.length > 0) {
    return {
      accessToken: obj.accessToken,
      refreshToken: typeof obj.refreshToken === 'string' && obj.refreshToken.length > 0 ? obj.refreshToken : undefined,
    };
  }
  const tokens = obj.tokens;
  if (tokens !== null && typeof tokens === 'object' && !Array.isArray(tokens)) {
    const t = tokens as Record<string, unknown>;
    if (typeof t.accessToken === 'string' && t.accessToken.length > 0) {
      return {
        accessToken: t.accessToken,
        refreshToken: typeof t.refreshToken === 'string' && t.refreshToken.length > 0 ? t.refreshToken : undefined,
      };
    }
  }
  return null;
}

function parseRefreshResponse(data: unknown): { accessToken: string; refreshToken?: string } | null {
  if (data === null || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;

  const direct = extractTokensFromRecord(d);
  if (direct !== null) return direct;

  const wrapped = d.data;
  if (wrapped !== null && typeof wrapped === 'object' && !Array.isArray(wrapped)) {
    const inner = extractTokensFromRecord(wrapped as Record<string, unknown>);
    if (inner !== null) return inner;
  }

  return null;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as unknown as AuthAwareRoot).auth.accessToken;
    if (typeof token === 'string' && token.length > 0) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

let refreshPromise: Promise<boolean> | null = null;

async function runRefresh(api: BaseQueryApi): Promise<boolean> {
  const state = api.getState() as unknown as AuthAwareRoot;
  let refresh = state.auth.refreshToken;
  if (refresh === null || refresh === '') {
    const stored = await tokenStorage.getRefreshToken();
    refresh = stored ?? null;
  }
  if (refresh === null || refresh === '') {
    return false;
  }

  const refreshResult = await rawBaseQuery(
    { url: '/auth/refresh', method: 'POST', body: { refreshToken: refresh } },
    api,
    {}
  );

  if ('error' in refreshResult && refreshResult.error !== undefined) {
    return false;
  }

  const parsed = parseRefreshResponse(refreshResult.data);
  if (parsed === null) {
    return false;
  }

  api.dispatch(
    hydrateTokens({
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
    })
  );
  await tokenStorage.setTokens({
    accessToken: parsed.accessToken,
    refreshToken: parsed.refreshToken,
  });
  return true;
}

function ensureRefresh(api: BaseQueryApi): Promise<boolean> {
  if (refreshPromise === null) {
    refreshPromise = runRefresh(api).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

type Extra = { retriedAfterRefresh?: boolean };

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  if (refreshPromise !== null) {
    await refreshPromise;
  }

  let result = await rawBaseQuery(args, api, extraOptions);

  if (API_MODE !== 'remote') {
    return result;
  }

  const extra = extraOptions as Extra | undefined;
  if (extra?.retriedAfterRefresh === true) {
    return result;
  }

  if (!isUnauthorized(result.error)) {
    return result;
  }
  if (!shouldAttemptRefresh(args)) {
    return result;
  }

  const refreshed = await ensureRefresh(api);
  if (!refreshed) {
    api.dispatch(clearCredentials());
    await tokenStorage.clearTokens();
    return result;
  }

  result = await rawBaseQuery(args, api, { ...(extraOptions as object), retriedAfterRefresh: true });
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: API_MODE === 'mock' ? mockBaseQuery() : baseQueryWithReauth,
  tagTypes: [
    'Auth',
    'Game',
    'Tailgate',
    'Menu',
    'Surplus',
    'Claim',
    'DonationCenter',
    'Donation',
    'Impact',
    'Rating',
  ],
  endpoints: () => ({}),
});
