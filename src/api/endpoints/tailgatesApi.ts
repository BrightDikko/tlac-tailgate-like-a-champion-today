import type {
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from '@reduxjs/toolkit/query';

import { baseApi } from '@/src/api/baseApi';
import { tailgatesHandlers } from '@/src/mocks/handlers/tailgatesHandlers';
import { API_MODE } from '@/src/services/config/env';

import type {
  ApiError,
  ApiResponse,
  CreateTailgateInput,
  PaginatedResponse,
  Tailgate,
  TailgateQueryParams,
  UpdateTailgateInput,
} from '@/src/types';

function fromApiResult<T>(
  result: ApiResponse<T> | ApiError
): QueryReturnValue<T, ApiError | FetchBaseQueryError, FetchBaseQueryMeta | undefined> {
  if ('data' in result) {
    return { data: result.data };
  }
  return { error: result };
}

function asRemoteTailgateList(value: unknown): QueryReturnValue<
  PaginatedResponse<Tailgate>,
  ApiError | FetchBaseQueryError,
  FetchBaseQueryMeta | undefined
> {
  return value as QueryReturnValue<
    PaginatedResponse<Tailgate>,
    ApiError | FetchBaseQueryError,
    FetchBaseQueryMeta | undefined
  >;
}

function asRemoteTailgate(value: unknown): QueryReturnValue<
  Tailgate,
  ApiError | FetchBaseQueryError,
  FetchBaseQueryMeta | undefined
> {
  return value as QueryReturnValue<
    Tailgate,
    ApiError | FetchBaseQueryError,
    FetchBaseQueryMeta | undefined
  >;
}

export const tailgatesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTailgates: builder.query<PaginatedResponse<Tailgate>, TailgateQueryParams | void>({
      queryFn: async (arg, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const data = await tailgatesHandlers.getTailgates(arg ?? undefined);
          return { data };
        }
        return asRemoteTailgateList(
          await baseQuery({
            url: '/tailgates',
            method: 'GET',
            params: arg ?? {},
          })
        );
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
          return fromApiResult(result);
        }
        return asRemoteTailgate(
          await baseQuery({
            url: `/tailgates/${id}`,
            method: 'GET',
          })
        );
      },
      providesTags: (_result, _error, id) => [{ type: 'Tailgate' as const, id }],
    }),

    createTailgate: builder.mutation<Tailgate, CreateTailgateInput>({
      queryFn: async (body, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const res = await tailgatesHandlers.createTailgate(body);
          return { data: res.data };
        }
        return asRemoteTailgate(
          await baseQuery({
            url: '/tailgates',
            method: 'POST',
            body,
          })
        );
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
          return fromApiResult(result);
        }
        return asRemoteTailgate(
          await baseQuery({
            url: `/tailgates/${id}`,
            method: 'PATCH',
            body: input,
          })
        );
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Tailgate', id },
        { type: 'Tailgate', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetTailgatesQuery,
  useGetTailgateByIdQuery,
  useCreateTailgateMutation,
  useUpdateTailgateMutation,
} = tailgatesApi;
