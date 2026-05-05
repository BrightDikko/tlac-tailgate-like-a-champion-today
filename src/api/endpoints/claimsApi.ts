import { baseApi } from '@/src/api/baseApi';
import { mapClaimRecord } from '@/src/api/mappers';
import { fromMockApiResult, remoteToArray, remoteToSingle } from '@/src/api/response';
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

export const claimsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getMyClaims: builder.query<ClaimRecord[], void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await claimsHandlers.getMyClaims();
          return fromMockApiResult(result as ApiResponse<ClaimRecord[]> | ApiError);
        }
        return remoteToArray(await baseQuery({ url: '/claims/me', method: 'GET' }), mapClaimRecord);
      },
      providesTags: (result) => {
        const listTag = { type: 'Claim' as const, id: 'LIST' as const };
        if (result === undefined) {
          return [listTag];
        }
        const claimTags = result.map((claim) => ({
          type: 'Claim' as const,
          id: claim.id,
        }));
        return [...claimTags, listTag];
      },
    }),

    claimSurplus: builder.mutation<
      ClaimRecord,
      { surplusId: string; input: ClaimInput }
    >({
      queryFn: async ({ surplusId, input }, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          // Mock validation still allows optional `surplusId` in body for legacy parity.
          const result = await claimsHandlers.claimSurplus(surplusId, input);
          return fromMockApiResult(result as ApiResponse<ClaimRecord> | ApiError);
        }
        return remoteToSingle(
          await baseQuery({
            url: `/surplus/${surplusId}/claims`,
            method: 'POST',
            // Path owns `surplusId`; remote body intentionally keeps only claim quantity.
            body: { servingsClaimed: input.servingsClaimed },
          }),
          mapClaimRecord
        );
      },
      invalidatesTags: (result, _error, { surplusId }) => [
        { type: 'Claim', id: 'LIST' },
        ...(result?.id ? [{ type: 'Claim' as const, id: result.id }] : []),
        { type: 'Surplus', id: result?.surplusId ?? surplusId },
        { type: 'Surplus', id: 'LIST' },
        { type: 'Impact', id: 'ME' },
        { type: 'Impact', id: 'GLOBAL' },
      ],
    }),

    confirmClaim: builder.mutation<
      ClaimRecord,
      { id: string; input?: ConfirmClaimInput }
    >({
      queryFn: async ({ id, input }, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await claimsHandlers.confirmClaim(id, input);
          return fromMockApiResult(result as ApiResponse<ClaimRecord> | ApiError);
        }
        return remoteToSingle(
          await baseQuery({
            // Uses backend claim record id (`ClaimRecord.id`), not display-only `claimId`.
            url: `/claims/${id}/confirm`,
            method: 'POST',
            body: input ?? {},
          }),
          mapClaimRecord
        );
      },
      invalidatesTags: (result, _error, { id }) => [
        { type: 'Claim', id },
        { type: 'Claim', id: 'LIST' },
        ...(result?.surplusId ? [{ type: 'Surplus' as const, id: result.surplusId }] : []),
        { type: 'Surplus', id: 'LIST' },
        { type: 'Impact', id: 'ME' },
        { type: 'Impact', id: 'GLOBAL' },
      ],
    }),

    releaseClaim: builder.mutation<
      ClaimRecord,
      { id: string; input?: ReleaseClaimInput }
    >({
      queryFn: async ({ id, input }, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await claimsHandlers.releaseClaim(id, input);
          return fromMockApiResult(result as ApiResponse<ClaimRecord> | ApiError);
        }
        return remoteToSingle(
          await baseQuery({
            // Uses backend claim record id (`ClaimRecord.id`), not display-only `claimId`.
            url: `/claims/${id}/release`,
            method: 'POST',
            body: input ?? {},
          }),
          mapClaimRecord
        );
      },
      invalidatesTags: (result, _error, { id }) => [
        { type: 'Claim', id },
        { type: 'Claim', id: 'LIST' },
        ...(result?.surplusId ? [{ type: 'Surplus' as const, id: result.surplusId }] : []),
        { type: 'Surplus', id: 'LIST' },
        { type: 'Impact', id: 'ME' },
        { type: 'Impact', id: 'GLOBAL' },
      ],
    }),
  }),
});

export const {
  useGetMyClaimsQuery,
  useClaimSurplusMutation,
  useConfirmClaimMutation,
  useReleaseClaimMutation,
} = claimsApi;
