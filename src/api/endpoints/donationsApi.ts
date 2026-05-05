import { baseApi } from '@/src/api/baseApi';
import { mapDonationRecord } from '@/src/api/mappers';
import { fromMockApiResult, remoteToSingle } from '@/src/api/response';
import { donationsHandlers } from '@/src/mocks/handlers/donationsHandlers';
import { API_MODE } from '@/src/services/config/env';

import type { ApiError, ApiResponse, DonationInput, DonationRecord } from '@/src/types';

export const donationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDonationById: builder.query<DonationRecord, string>({
      queryFn: async (id, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await donationsHandlers.getDonationById(id);
          return fromMockApiResult(result as ApiResponse<DonationRecord> | ApiError);
        }
        return remoteToSingle(await baseQuery({ url: `/donations/${id}`, method: 'GET' }), mapDonationRecord);
      },
      providesTags: (_result, _error, id) => [{ type: 'Donation' as const, id }],
    }),

    createDonation: builder.mutation<DonationRecord, DonationInput>({
      queryFn: async (input, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await donationsHandlers.createDonation(input);
          return fromMockApiResult(result as ApiResponse<DonationRecord> | ApiError);
        }
        return remoteToSingle(await baseQuery({ url: '/donations', method: 'POST', body: input }), mapDonationRecord);
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
