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

/** Remote POST /surplus — keep body minimal and backend-oriented. */
function buildRemoteCreateSurplusBody(input: CreateSurplusInput): {
  tailgateId: string;
  foodName: string;
  groupName: string;
  location: string;
  servingsRemaining: number;
  pickupNote: string;
  pickupWindowMinutes: number;
  foodItemId?: string;
  expiresAt: string;
} {
  return {
    tailgateId: input.tailgateId,
    foodName: input.foodName,
    groupName: input.groupName,
    location: input.location,
    servingsRemaining: input.servingsRemaining,
    pickupNote: input.pickupNote,
    pickupWindowMinutes: input.pickupWindowMinutes ?? 30,
    expiresAt: input.expiresAt ?? new Date(Date.now() + 4 * 60 * 60_000).toISOString(),
    ...(input.foodItemId !== undefined ? { foodItemId: input.foodItemId } : {}),
  };
}

const REMOTE_SURPLUS_PATCH_KEYS = ['servingsRemaining', 'pickupNote', 'status', 'expiresAt'] as const;

/** Remote PATCH /surplus/:id — no id/claimId or frontend-only fields in body. */
function buildRemoteUpdateSurplusBody(input: UpdateSurplusInput): Partial<{
  servingsRemaining: number;
  pickupNote: string;
  status: SurplusItem['status'];
  expiresAt: string;
}> {
  const { id: _pathId, ...rest } = input;
  const body: Record<string, unknown> = {};
  for (const key of REMOTE_SURPLUS_PATCH_KEYS) {
    const v = rest[key];
    if (v !== undefined) {
      body[key] = v;
    }
  }
  return body as Partial<{
    servingsRemaining: number;
    pickupNote: string;
    status: SurplusItem['status'];
    expiresAt: string;
  }>;
}

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
        return remoteToSingle(
          await baseQuery({ url: '/surplus', method: 'POST', body: buildRemoteCreateSurplusBody(body) }),
          mapSurplusItem
        );
      },
      invalidatesTags: (_result, _error, input) => [
        { type: 'Surplus', id: 'LIST' },
        { type: 'Menu', id: `TAILGATE-${input.tailgateId}` },
        { type: 'Tailgate', id: input.tailgateId },
      ],
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
        return remoteToSingle(
          await baseQuery({ url: `/surplus/${id}`, method: 'PATCH', body: buildRemoteUpdateSurplusBody(input) }),
          mapSurplusItem
        );
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
            body: buildRemoteUpdateSurplusBody({ id, status: 'expired', servingsRemaining: 0 }),
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
  useLazyGetSurplusQuery,
  useGetSurplusByIdQuery,
  useCreateSurplusMutation,
  useUpdateSurplusMutation,
  useCloseSurplusMutation,
} = surplusApi;
