import type {
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from '@reduxjs/toolkit/query';

import { baseApi } from '@/src/api/baseApi';
import { menuHandlers } from '@/src/mocks/handlers/menuHandlers';
import { API_MODE } from '@/src/services/config/env';

import type {
  ApiError,
  ApiResponse,
  CreateMenuItemInput,
  FoodItem,
  MenuQueryParams,
  PaginatedResponse,
  UpdateMenuItemInput,
} from '@/src/types';

function fromApiResult<T>(
  result: ApiResponse<T> | ApiError
): QueryReturnValue<T, ApiError | FetchBaseQueryError, FetchBaseQueryMeta | undefined> {
  if ('data' in result) {
    return { data: result.data };
  }
  return { error: result };
}

function asRemoteMenuList(value: unknown): QueryReturnValue<
  PaginatedResponse<FoodItem>,
  ApiError | FetchBaseQueryError,
  FetchBaseQueryMeta | undefined
> {
  return value as QueryReturnValue<
    PaginatedResponse<FoodItem>,
    ApiError | FetchBaseQueryError,
    FetchBaseQueryMeta | undefined
  >;
}

function asRemoteMenuItem(value: unknown): QueryReturnValue<
  FoodItem,
  ApiError | FetchBaseQueryError,
  FetchBaseQueryMeta | undefined
> {
  return value as QueryReturnValue<
    FoodItem,
    ApiError | FetchBaseQueryError,
    FetchBaseQueryMeta | undefined
  >;
}

export const menuApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMenuByTailgateId: builder.query<
      PaginatedResponse<FoodItem>,
      { tailgateId: string; params?: MenuQueryParams }
    >({
      queryFn: async ({ tailgateId, params }, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const data = await menuHandlers.getMenuByTailgateId(tailgateId, params);
          return { data };
        }
        return asRemoteMenuList(
          await baseQuery({
            url: `/tailgates/${tailgateId}/menu`,
            method: 'GET',
            params: params ?? {},
          })
        );
      },
      providesTags: (result, _error, arg) => {
        const tailgateTag = {
          type: 'Menu' as const,
          id: `TAILGATE-${arg.tailgateId}`,
        };
        if (result === undefined) {
          return [tailgateTag];
        }
        const itemTags = result.data.map((item) => ({
          type: 'Menu' as const,
          id: item.id,
        }));
        return [tailgateTag, ...itemTags];
      },
    }),

    createMenuItem: builder.mutation<
      FoodItem,
      { tailgateId: string; input: CreateMenuItemInput }
    >({
      queryFn: async ({ tailgateId, input }, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await menuHandlers.createMenuItem(tailgateId, input);
          return fromApiResult(result);
        }
        return asRemoteMenuItem(
          await baseQuery({
            url: `/tailgates/${tailgateId}/menu`,
            method: 'POST',
            body: input,
          })
        );
      },
      invalidatesTags: (_result, _error, { tailgateId }) => [
        { type: 'Menu', id: `TAILGATE-${tailgateId}` },
      ],
    }),

    updateMenuItem: builder.mutation<
      FoodItem,
      { id: string; input: UpdateMenuItemInput }
    >({
      queryFn: async ({ id, input }, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await menuHandlers.updateMenuItem(id, input);
          return fromApiResult(result);
        }
        return asRemoteMenuItem(
          await baseQuery({
            url: `/menu-items/${id}`,
            method: 'PATCH',
            body: input,
          })
        );
      },
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Menu', id }],
    }),
  }),
});

export const { useGetMenuByTailgateIdQuery, useCreateMenuItemMutation, useUpdateMenuItemMutation } =
  menuApi;
