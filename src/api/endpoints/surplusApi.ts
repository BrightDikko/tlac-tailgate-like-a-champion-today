import { baseApi } from '@/src/api/baseApi';
import { mapSurplusItem } from '@/src/api/mappers';
import { fromMockApiResult, remoteToPaginated, remoteToSingle } from '@/src/api/response';
import { surplusHandlers } from '@/src/mocks/handlers/surplusHandlers';
import { API_MODE } from '@/src/services/config/env';

import type {
  ApiError,
  ApiResponse,
  CreateSurplusInput,
  PaginatedResponse,
  SurplusItem,
  SurplusQueryParams,
  UpdateSurplusInput,
} from '@/src/types';

export const surplusApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSurplus: builder.query<PaginatedResponse<SurplusItem>, SurplusQueryParams | void>({
      queryFn: async (arg, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const data = await surplusHandlers.getSurplus(arg ?? undefined);
          return { data };
        }
        return remoteToPaginated(await baseQuery({ url: '/surplus', method: 'GET', params: arg ?? {} }), mapSurplusItem);
      },
      providesTags: (result) => {
        const listTag = { type: 'Surplus' as const, id: 'LIST' as const };
        if (result === undefined) {
          return [listTag];
        }
        const itemTags = result.data.map((item) => ({
          type: 'Surplus' as const,
          id: item.id,
        }));
        return [...itemTags, listTag];
      },
    }),

    getSurplusById: builder.query<SurplusItem, string>({
      queryFn: async (id, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await surplusHandlers.getSurplusById(id);
          return fromMockApiResult(result as ApiResponse<SurplusItem> | ApiError);
        }
        return remoteToSingle(await baseQuery({ url: `/surplus/${id}`, method: 'GET' }), mapSurplusItem);
      },
      providesTags: (_result, _error, id) => [{ type: 'Surplus' as const, id }],
    }),

    createSurplus: builder.mutation<SurplusItem, CreateSurplusInput>({
      queryFn: async (body, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await surplusHandlers.createSurplus(body);
          return fromMockApiResult(result as ApiResponse<SurplusItem> | ApiError);
        }
        return remoteToSingle(await baseQuery({ url: '/surplus', method: 'POST', body }), mapSurplusItem);
      },
      invalidatesTags: [{ type: 'Surplus', id: 'LIST' }],
    }),

    updateSurplus: builder.mutation<
      SurplusItem,
      { id: string; input: UpdateSurplusInput }
    >({
      queryFn: async ({ id, input }, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await surplusHandlers.updateSurplus(id, input);
          return fromMockApiResult(result as ApiResponse<SurplusItem> | ApiError);
        }
        return remoteToSingle(await baseQuery({ url: `/surplus/${id}`, method: 'PATCH', body: input }), mapSurplusItem);
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Surplus', id },
        { type: 'Surplus', id: 'LIST' },
      ],
    }),

    closeSurplus: builder.mutation<SurplusItem, string>({
      queryFn: async (id, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await surplusHandlers.closeSurplus(id);
          return fromMockApiResult(result as ApiResponse<SurplusItem> | ApiError);
        }
        return remoteToSingle(
          await baseQuery({
            url: `/surplus/${id}`,
            method: 'PATCH',
            body: { status: 'expired', servingsRemaining: 0 },
          }),
          mapSurplusItem
        );
      },
      invalidatesTags: (_result, _error, id) => [
        { type: 'Surplus', id },
        { type: 'Surplus', id: 'LIST' },
        { type: 'Claim', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetSurplusQuery,
  useGetSurplusByIdQuery,
  useCreateSurplusMutation,
  useUpdateSurplusMutation,
  useCloseSurplusMutation,
} = surplusApi;
