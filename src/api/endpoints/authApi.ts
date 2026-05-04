import type {
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from '@reduxjs/toolkit/query';

import { baseApi } from '@/src/api/baseApi';
import { setCredentials, clearCredentials } from '@/src/features/auth/authSlice';
import { authHandlers } from '@/src/mocks/handlers/authHandlers';
import { API_MODE } from '@/src/services/config/env';
import { tokenStorage } from '@/src/services/storage/tokenStorage';

import type {
  ApiError,
  ApiResponse,
  AuthSession,
  CurrentUser,
  LoginInput,
  RegisterInput,
} from '@/src/types';

function fromApiResult<T>(
  result: ApiResponse<T> | ApiError
): QueryReturnValue<T, ApiError | FetchBaseQueryError, FetchBaseQueryMeta | undefined> {
  if ('data' in result) {
    return { data: result.data };
  }
  return { error: result };
}

function asRemoteAuthSession(value: unknown): QueryReturnValue<
  AuthSession,
  ApiError | FetchBaseQueryError,
  FetchBaseQueryMeta | undefined
> {
  return value as QueryReturnValue<
    AuthSession,
    ApiError | FetchBaseQueryError,
    FetchBaseQueryMeta | undefined
  >;
}

function asRemoteCurrentUser(value: unknown): QueryReturnValue<
  CurrentUser,
  ApiError | FetchBaseQueryError,
  FetchBaseQueryMeta | undefined
> {
  return value as QueryReturnValue<
    CurrentUser,
    ApiError | FetchBaseQueryError,
    FetchBaseQueryMeta | undefined
  >;
}

function isAuthSession(data: unknown): data is AuthSession {
  if (data === null || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.user === 'object' &&
    d.user !== null &&
    typeof d.tokens === 'object' &&
    d.tokens !== null &&
    typeof (d.tokens as Record<string, unknown>).accessToken === 'string'
  );
}

async function persistSession(session: AuthSession, api: {
  dispatch: (action: unknown) => void;
}): Promise<void> {
  api.dispatch(
    setCredentials({
      user: session.user,
      accessToken: session.tokens.accessToken,
      refreshToken: session.tokens.refreshToken,
    })
  );
  await tokenStorage.setTokens({
    accessToken: session.tokens.accessToken,
    refreshToken: session.tokens.refreshToken,
  });
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthSession, LoginInput>({
      queryFn: async (input, api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await authHandlers.login(input);
          if ('data' in result) {
            await persistSession(result.data, api);
            return { data: result.data };
          }
          return { error: result };
        }
        const raw = await baseQuery({
          url: '/auth/login',
          method: 'POST',
          body: input,
        });
        if ('error' in raw && raw.error !== undefined) {
          return { error: raw.error as ApiError };
        }
        const data = raw.data;
        if (isAuthSession(data)) {
          await persistSession(data, api);
          return { data };
        }
        return asRemoteAuthSession(raw);
      },
      invalidatesTags: [{ type: 'Auth', id: 'ME' }],
    }),

    register: builder.mutation<AuthSession, RegisterInput>({
      queryFn: async (input, api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await authHandlers.register(input);
          if ('data' in result) {
            await persistSession(result.data, api);
            return { data: result.data };
          }
          return { error: result };
        }
        const raw = await baseQuery({
          url: '/auth/register',
          method: 'POST',
          body: input,
        });
        if ('error' in raw && raw.error !== undefined) {
          return { error: raw.error as ApiError };
        }
        const data = raw.data;
        if (isAuthSession(data)) {
          await persistSession(data, api);
          return { data };
        }
        return asRemoteAuthSession(raw);
      },
      invalidatesTags: [{ type: 'Auth', id: 'ME' }],
    }),

    logout: builder.mutation<null, void>({
      queryFn: async (_arg, api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await authHandlers.logout();
          if ('data' in result) {
            api.dispatch(clearCredentials());
            await tokenStorage.clearTokens();
            return { data: null };
          }
          return { error: result };
        }
        const raw = await baseQuery({
          url: '/auth/logout',
          method: 'POST',
        });
        if ('error' in raw && raw.error !== undefined) {
          return { error: raw.error as ApiError };
        }
        api.dispatch(clearCredentials());
        await tokenStorage.clearTokens();
        return { data: null };
      },
      invalidatesTags: [{ type: 'Auth', id: 'ME' }],
    }),

    getMe: builder.query<CurrentUser, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await authHandlers.getMe();
          return fromApiResult(result);
        }
        return asRemoteCurrentUser(
          await baseQuery({
            url: '/auth/me',
            method: 'GET',
          })
        );
      },
      providesTags: [{ type: 'Auth', id: 'ME' }],
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useLogoutMutation, useGetMeQuery } = authApi;
