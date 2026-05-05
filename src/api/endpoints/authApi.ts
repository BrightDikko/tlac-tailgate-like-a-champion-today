import { baseApi } from '@/src/api/baseApi';
import { mapAuthSession, mapCurrentUser } from '@/src/api/mappers';
import { fromMockApiResult, remoteToNull, remoteToSingle } from '@/src/api/response';
import { setCredentials, clearCredentials } from '@/src/features/auth/authSlice';
import type { RootState } from '@/src/redux/store';
import { authHandlers } from '@/src/mocks/handlers/authHandlers';
import { fail } from '@/src/mocks/mockResponse';
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

async function persistSession(
  session: AuthSession,
  api: {
    dispatch: (action: unknown) => void;
  }
): Promise<void> {
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
        const parsed = remoteToSingle(raw, mapAuthSession);
        if ('data' in parsed && parsed.data !== undefined) {
          await persistSession(parsed.data, api);
        }
        return parsed;
      },
      invalidatesTags: [{ type: 'Auth', id: 'ME' }],
    }),

    demoLogin: builder.mutation<AuthSession, void>({
      queryFn: async (_arg, api, _extraOptions, _baseQuery) => {
        if (API_MODE !== 'mock') {
          return {
            error: fail('Demo Mode is only available when EXPO_PUBLIC_API_MODE=mock.', 'BAD_REQUEST'),
          };
        }
        const result = await authHandlers.loginDemo();
        if ('data' in result) {
          await persistSession(result.data, api);
          return { data: result.data };
        }
        return { error: result };
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
        const parsed = remoteToSingle(raw, mapAuthSession);
        if ('data' in parsed && parsed.data !== undefined) {
          await persistSession(parsed.data, api);
        }
        return parsed;
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
        const out = remoteToNull(raw);
        if (!('error' in out && out.error !== undefined)) {
          api.dispatch(clearCredentials());
          await tokenStorage.clearTokens();
        }
        return out;
      },
      invalidatesTags: [{ type: 'Auth', id: 'ME' }],
    }),

    getMe: builder.query<CurrentUser, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await authHandlers.getMe();
          return fromMockApiResult(result as ApiResponse<CurrentUser> | ApiError);
        }
        return remoteToSingle(await baseQuery({ url: '/auth/me', method: 'GET' }), mapCurrentUser);
      },
      providesTags: [{ type: 'Auth', id: 'ME' }],
      async onQueryStarted(_arg, { dispatch, queryFulfilled, getState }) {
        if (API_MODE !== 'remote') {
          return;
        }
        try {
          const { data } = await queryFulfilled;
          const { accessToken, refreshToken } = (getState() as unknown as RootState).auth;
          if (typeof accessToken === 'string' && accessToken.length > 0) {
            dispatch(
              setCredentials({
                user: data,
                accessToken,
                refreshToken: refreshToken ?? undefined,
              })
            );
          }
        } catch {
          /* leave slice unchanged; caller handles errors */
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useDemoLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetMeQuery,
} = authApi;
