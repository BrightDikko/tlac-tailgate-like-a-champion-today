import type {
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from '@reduxjs/toolkit/query';

import { baseApi } from '@/src/api/baseApi';
import { claimsHandlers } from '@/src/mocks/handlers/claimsHandlers';
import { API_MODE } from '@/src/services/config/env';

import type {
  ApiError,
  ApiResponse,
  ClaimInput,
  ClaimRecord,
  ConfirmClaimInput,
  ReleaseClaimInput,
} from '@/src/types';

function fromApiResult<T>(
  result: ApiResponse<T> | ApiError
): QueryReturnValue<T, ApiError | FetchBaseQueryError, FetchBaseQueryMeta | undefined> {
  if ('data' in result) {
    return { data: result.data };
  }
  return { error: result };
}

function asRemoteClaim(value: unknown): QueryReturnValue<
  ClaimRecord,
  ApiError | FetchBaseQueryError,
  FetchBaseQueryMeta | undefined
> {
  return value as QueryReturnValue<
    ClaimRecord,
    ApiError | FetchBaseQueryError,
    FetchBaseQueryMeta | undefined
  >;
}

export const claimsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    claimSurplus: builder.mutation<
      ClaimRecord,
      { surplusId: string; input: ClaimInput }
    >({
      queryFn: async ({ surplusId, input }, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await claimsHandlers.claimSurplus(surplusId, input);
          return fromApiResult(result);
        }
        return asRemoteClaim(
          await baseQuery({
            url: `/surplus/${surplusId}/claims`,
            method: 'POST',
            body: input,
          })
        );
      },
      invalidatesTags: (_result, _error, { surplusId }) => [
        { type: 'Surplus', id: surplusId },
        { type: 'Surplus', id: 'LIST' },
        { type: 'Claim', id: 'LIST' },
      ],
    }),

    confirmClaim: builder.mutation<
      ClaimRecord,
      { id: string; input?: ConfirmClaimInput }
    >({
      queryFn: async ({ id, input }, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await claimsHandlers.confirmClaim(id, input);
          return fromApiResult(result);
        }
        return asRemoteClaim(
          await baseQuery({
            url: `/claims/${id}/confirm`,
            method: 'POST',
            body: input ?? {},
          })
        );
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Claim', id },
        { type: 'Claim', id: 'LIST' },
      ],
    }),

    releaseClaim: builder.mutation<
      ClaimRecord,
      { id: string; input?: ReleaseClaimInput }
    >({
      queryFn: async ({ id, input }, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await claimsHandlers.releaseClaim(id, input);
          return fromApiResult(result);
        }
        return asRemoteClaim(
          await baseQuery({
            url: `/claims/${id}/release`,
            method: 'POST',
            body: input ?? {},
          })
        );
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Claim', id },
        { type: 'Claim', id: 'LIST' },
        { type: 'Surplus', id: 'LIST' },
      ],
    }),
  }),
});

export const { useClaimSurplusMutation, useConfirmClaimMutation, useReleaseClaimMutation } =
  claimsApi;
