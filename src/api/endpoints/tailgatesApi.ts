import { baseApi } from '@/src/api/baseApi';
import { mapTailgate } from '@/src/api/mappers';
import {
  fromMockApiResult,
  remoteToPaginated,
  remoteToSingle,
  remoteToTailgateDeleteResult,
} from '@/src/api/response';
import { tailgatesHandlers } from '@/src/mocks/handlers/tailgatesHandlers';
import { API_MODE } from '@/src/services/config/env';

import type {
  ApiError,
  ApiResponse,
  CreateTailgateInput,
  PaginatedResponse,
  Tailgate,
  TailgateDeleteResult,
  TailgateQueryParams,
  UpdateTailgateInput,
} from '@/src/types';

export const tailgatesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTailgates: builder.query<PaginatedResponse<Tailgate>, TailgateQueryParams | void>({
      queryFn: async (arg, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const data = await tailgatesHandlers.getTailgates(arg ?? undefined);
          return { data };
        }
        return remoteToPaginated(await baseQuery({ url: '/tailgates', method: 'GET', params: arg ?? {} }), mapTailgate);
      },
      providesTags: (result) => {
        const listTag = { type: 'Tailgate' as const, id: 'LIST' as const };
        if (result === undefined) {
          return [listTag];
        }
        const itemTags = result.data.map((item) => ({
          type: 'Tailgate' as const,
          id: item.id,
        }));
        return [...itemTags, listTag];
      },
    }),

    getTailgateById: builder.query<Tailgate, string>({
      queryFn: async (id, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await tailgatesHandlers.getTailgateById(id);
          return fromMockApiResult(result as ApiResponse<Tailgate> | ApiError);
        }
        return remoteToSingle(await baseQuery({ url: `/tailgates/${id}`, method: 'GET' }), mapTailgate);
      },
      providesTags: (_result, _error, id) => [{ type: 'Tailgate' as const, id }],
    }),

    createTailgate: builder.mutation<Tailgate, CreateTailgateInput>({
      queryFn: async (body, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const res = await tailgatesHandlers.createTailgate(body);
          return fromMockApiResult(res as ApiResponse<Tailgate> | ApiError);
        }
        return remoteToSingle(await baseQuery({ url: '/tailgates', method: 'POST', body }), mapTailgate);
      },
      invalidatesTags: [{ type: 'Tailgate', id: 'LIST' }],
    }),

    updateTailgate: builder.mutation<
      Tailgate,
      { id: string; input: UpdateTailgateInput }
    >({
      queryFn: async ({ id, input }, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await tailgatesHandlers.updateTailgate(id, input);
          return fromMockApiResult(result as ApiResponse<Tailgate> | ApiError);
        }
        return remoteToSingle(await baseQuery({ url: `/tailgates/${id}`, method: 'PATCH', body: input }), mapTailgate);
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Tailgate', id },
        { type: 'Tailgate', id: 'LIST' },
      ],
    }),

    deleteTailgate: builder.mutation<TailgateDeleteResult, string>({
      queryFn: async (id, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const res = await tailgatesHandlers.deleteTailgate(id);
          return fromMockApiResult(res as ApiResponse<TailgateDeleteResult> | ApiError);
        }
        return remoteToTailgateDeleteResult(
          await baseQuery({ url: `/tailgates/${id}`, method: 'DELETE' }),
          id
        );
      },
      invalidatesTags: (result) => {
        const tags: { type: 'Tailgate' | 'Menu' | 'Surplus' | 'Claim'; id: string }[] = [
          { type: 'Tailgate', id: 'LIST' },
          { type: 'Surplus', id: 'LIST' },
          { type: 'Claim', id: 'LIST' },
        ];
        if (result !== undefined) {
          tags.push({ type: 'Tailgate', id: result.tailgateId });
          tags.push({ type: 'Menu', id: `TAILGATE-${result.tailgateId}` });
          for (const sid of result.removedSurplusIds) {
            tags.push({ type: 'Surplus', id: sid });
          }
          for (const mid of result.removedMenuItemIds) {
            tags.push({ type: 'Menu', id: mid });
          }
        }
        return tags;
      },
    }),
  }),
});

export const {
  useGetTailgatesQuery,
  useGetTailgateByIdQuery,
  useCreateTailgateMutation,
  useUpdateTailgateMutation,
  useDeleteTailgateMutation,
} = tailgatesApi;
