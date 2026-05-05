import { baseApi } from '@/src/api/baseApi';
import { mapImpact } from '@/src/api/mappers';
import { remoteToSingle } from '@/src/api/response';
import { impactHandlers } from '@/src/mocks/handlers/impactHandlers';
import { API_MODE } from '@/src/services/config/env';

import type { Impact } from '@/src/types';

export const impactApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyImpact: builder.query<Impact, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const res = await impactHandlers.getMyImpact();
          return { data: res.data };
        }
        return remoteToSingle(await baseQuery({ url: '/impact/me', method: 'GET' }), mapImpact);
      },
      providesTags: () => [{ type: 'Impact' as const, id: 'ME' }],
    }),

    getGlobalImpact: builder.query<Impact, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const res = await impactHandlers.getGlobalImpact();
          return { data: res.data };
        }
        return remoteToSingle(await baseQuery({ url: '/impact/global', method: 'GET' }), mapImpact);
      },
      providesTags: () => [{ type: 'Impact' as const, id: 'GLOBAL' }],
    }),
  }),
});

export const { useGetMyImpactQuery, useGetGlobalImpactQuery, useLazyGetGlobalImpactQuery } = impactApi;
