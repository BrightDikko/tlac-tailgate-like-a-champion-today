import type {
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from '@reduxjs/toolkit/query';

import { baseApi } from '@/src/api/baseApi';
import { donationsHandlers } from '@/src/mocks/handlers/donationsHandlers';
import { API_MODE } from '@/src/services/config/env';

import type { ApiError, ApiResponse, DonationInput, DonationRecord } from '@/src/types';

function fromApiResult<T>(
  result: ApiResponse<T> | ApiError
): QueryReturnValue<T, ApiError | FetchBaseQueryError, FetchBaseQueryMeta | undefined> {
  if ('data' in result) {
    return { data: result.data };
  }
  return { error: result };
}

function asRemoteDonationRecord(value: unknown): QueryReturnValue<
  DonationRecord,
  ApiError | FetchBaseQueryError,
  FetchBaseQueryMeta | undefined
> {
  return value as QueryReturnValue<
    DonationRecord,
    ApiError | FetchBaseQueryError,
    FetchBaseQueryMeta | undefined
  >;
}

export const donationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDonationById: builder.query<DonationRecord, string>({
      queryFn: async (id, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await donationsHandlers.getDonationById(id);
          return fromApiResult(result);
        }
        return asRemoteDonationRecord(
          await baseQuery({
            url: `/donations/${id}`,
            method: 'GET',
          })
        );
      },
      providesTags: (_result, _error, id) => [{ type: 'Donation' as const, id }],
    }),

    createDonation: builder.mutation<DonationRecord, DonationInput>({
      queryFn: async (input, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await donationsHandlers.createDonation(input);
          return fromApiResult(result);
        }
        return asRemoteDonationRecord(
          await baseQuery({
            url: '/donations',
            method: 'POST',
            body: input,
          })
        );
      },
      invalidatesTags: (result, _error, arg) => {
        const tags: { type: 'Donation' | 'Surplus' | 'Impact'; id: string }[] = [
          { type: 'Donation', id: 'LIST' },
          { type: 'Surplus', id: 'LIST' },
          { type: 'Impact', id: 'ME' },
          { type: 'Impact', id: 'GLOBAL' },
        ];
        if (result !== undefined && 'id' in result) {
          tags.push({ type: 'Donation', id: result.id });
        }
        const sid = arg.surplusId?.trim();
        if (sid !== undefined && sid !== '') {
          tags.push({ type: 'Surplus', id: sid });
        }
        return tags;
      },
    }),
  }),
});

export const { useCreateDonationMutation, useGetDonationByIdQuery } = donationsApi;
