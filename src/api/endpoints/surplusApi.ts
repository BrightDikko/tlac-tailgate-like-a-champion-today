import type {
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from '@reduxjs/toolkit/query';

import { baseApi } from '@/src/api/baseApi';
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

function fromApiResult<T>(
  result: ApiResponse<T> | ApiError
): QueryReturnValue<T, ApiError | FetchBaseQueryError, FetchBaseQueryMeta | undefined> {
  if ('data' in result) {
    return { data: result.data };
  }
  return { error: result };
}

function asRemoteList(value: unknown): QueryReturnValue<
  PaginatedResponse<SurplusItem>,
  ApiError | FetchBaseQueryError,
  FetchBaseQueryMeta | undefined
> {
  return value as QueryReturnValue<
    PaginatedResponse<SurplusItem>,
    ApiError | FetchBaseQueryError,
    FetchBaseQueryMeta | undefined
  >;
}

function asRemoteItem(value: unknown): QueryReturnValue<
  SurplusItem,
  ApiError | FetchBaseQueryError,
  FetchBaseQueryMeta | undefined
> {
  return value as QueryReturnValue<
    SurplusItem,
    ApiError | FetchBaseQueryError,
    FetchBaseQueryMeta | undefined
  >;
}

export const surplusApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSurplus: builder.query<PaginatedResponse<SurplusItem>, SurplusQueryParams | void>({
      queryFn: async (arg, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const data = await surplusHandlers.getSurplus(arg ?? undefined);
          return { data };
        }
        return asRemoteList(
          await baseQuery({
            url: '/surplus',
            method: 'GET',
            params: arg ?? {},
          })
        );
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
          return fromApiResult(result);
        }
        return asRemoteItem(
          await baseQuery({
            url: `/surplus/${id}`,
            method: 'GET',
          })
        );
      },
      providesTags: (_result, _error, id) => [{ type: 'Surplus' as const, id }],
    }),

    createSurplus: builder.mutation<SurplusItem, CreateSurplusInput>({
      queryFn: async (body, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const res = await surplusHandlers.createSurplus(body);
          return { data: res.data };
        }
        return asRemoteItem(
          await baseQuery({
            url: '/surplus',
            method: 'POST',
            body,
          })
        );
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
          return fromApiResult(result);
        }
        return asRemoteItem(
          await baseQuery({
            url: `/surplus/${id}`,
            method: 'PATCH',
            body: input,
          })
        );
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Surplus', id },
        { type: 'Surplus', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetSurplusQuery,
  useGetSurplusByIdQuery,
  useCreateSurplusMutation,
  useUpdateSurplusMutation,
} = surplusApi;
