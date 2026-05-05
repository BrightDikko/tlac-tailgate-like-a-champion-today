import { baseApi } from '@/src/api/baseApi';
import { mapFoodItem } from '@/src/api/mappers';
import {
  fromMockApiResult,
  remoteToMenuItemDeleteResult,
  remoteToPaginated,
  remoteToSingle,
} from '@/src/api/response';
import { menuHandlers } from '@/src/mocks/handlers/menuHandlers';
import { API_MODE } from '@/src/services/config/env';

import type {
  ApiError,
  ApiResponse,
  CreateMenuItemInput,
  FoodCategory,
  FoodItem,
  MenuItemDeleteResult,
  MenuQueryParams,
  PaginatedResponse,
  UpdateMenuItemInput,
} from '@/src/types';

/**
 * Remote POST /tailgates/:tailgateId/menu.
 * Backend currently validates `tailgateId` in the body even though the path also includes it.
 */
function buildRemoteCreateMenuItemBody(tailgateId: string, input: CreateMenuItemInput): {
  tailgateId: string;
  name: string;
  category: FoodCategory;
  description: string;
  quantityPrepared: number;
} {
  return {
    tailgateId,
    name: input.name,
    category: input.category,
    description: input.description,
    quantityPrepared: input.quantityPrepared,
  };
}

const REMOTE_MENU_PATCH_KEYS = ['name', 'category', 'description', 'quantityPrepared'] as const;

/** Remote PATCH /menu-items/:id — no id or tailgateId in body. */
function buildRemoteUpdateMenuItemBody(input: UpdateMenuItemInput): Partial<{
  name: string;
  category: FoodCategory;
  description: string;
  quantityPrepared: number;
}> {
  const { id: _pathId, ...rest } = input;
  const body: Record<string, unknown> = {};
  for (const key of REMOTE_MENU_PATCH_KEYS) {
    const v = rest[key];
    if (v !== undefined) {
      body[key] = v;
    }
  }
  return body as Partial<{
    name: string;
    category: FoodCategory;
    description: string;
    quantityPrepared: number;
  }>;
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
        return remoteToPaginated(
          await baseQuery({
            url: `/tailgates/${tailgateId}/menu`,
            method: 'GET',
            params: params ?? {},
          }),
          mapFoodItem
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
          return fromMockApiResult(result as ApiResponse<FoodItem> | ApiError);
        }
        const res = await baseQuery({
          url: `/tailgates/${tailgateId}/menu`,
          method: 'POST',
          body: buildRemoteCreateMenuItemBody(tailgateId, input),
        });
        const out = remoteToSingle(res, mapFoodItem);
        if ('data' in out && out.data !== undefined && out.data.tailgateId === '') {
          return { ...out, data: { ...out.data, tailgateId } };
        }
        return out;
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
          return fromMockApiResult(result as ApiResponse<FoodItem> | ApiError);
        }
        return remoteToSingle(
          await baseQuery({
            url: `/menu-items/${id}`,
            method: 'PATCH',
            body: buildRemoteUpdateMenuItemBody(input),
          }),
          mapFoodItem
        );
      },
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Menu', id }],
    }),

    deleteMenuItem: builder.mutation<MenuItemDeleteResult, { id: string; tailgateId: string }>({
      queryFn: async ({ id, tailgateId }, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await menuHandlers.deleteMenuItem(id);
          return fromMockApiResult(result as ApiResponse<MenuItemDeleteResult> | ApiError);
        }
        return remoteToMenuItemDeleteResult(
          await baseQuery({ url: `/menu-items/${id}`, method: 'DELETE' }),
          { id, tailgateId }
        );
      },
      invalidatesTags: (_result, _error, { id, tailgateId }) => [
        { type: 'Menu', id },
        { type: 'Menu', id: `TAILGATE-${tailgateId}` },
        { type: 'Tailgate', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetMenuByTailgateIdQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
} = menuApi;
