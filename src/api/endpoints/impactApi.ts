import type {
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from '@reduxjs/toolkit/query';

import { baseApi } from '@/src/api/baseApi';
import { impactHandlers } from '@/src/mocks/handlers/impactHandlers';
import { API_MODE } from '@/src/services/config/env';

import type { ApiError, Impact } from '@/src/types';

function asRemoteImpact(value: unknown): QueryReturnValue<
  Impact,
  ApiError | FetchBaseQueryError,
  FetchBaseQueryMeta | undefined
> {
  return value as QueryReturnValue<
    Impact,
    ApiError | FetchBaseQueryError,
    FetchBaseQueryMeta | undefined
  >;
}

export const impactApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyImpact: builder.query<Impact, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const res = await impactHandlers.getMyImpact();
          return { data: res.data };
        }
        return asRemoteImpact(
          await baseQuery({
            url: '/impact/me',
            method: 'GET',
          })
        );
      },
      providesTags: () => [{ type: 'Impact' as const, id: 'ME' }],
    }),

    getGlobalImpact: builder.query<Impact, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const res = await impactHandlers.getGlobalImpact();
          return { data: res.data };
        }
        return asRemoteImpact(
          await baseQuery({
            url: '/impact/global',
            method: 'GET',
          })
        );
      },
      providesTags: () => [{ type: 'Impact' as const, id: 'GLOBAL' }],
    }),
  }),
});

export const { useGetMyImpactQuery, useGetGlobalImpactQuery } = impactApi;
