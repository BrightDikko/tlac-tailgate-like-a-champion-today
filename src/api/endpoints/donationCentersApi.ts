import { baseApi } from '@/src/api/baseApi';
import { mapDonationCenter } from '@/src/api/mappers';
import { fromMockApiResult, remoteToPaginated, remoteToSingle } from '@/src/api/response';
import { donationCentersHandlers } from '@/src/mocks/handlers/donationCentersHandlers';
import { API_MODE } from '@/src/services/config/env';

import type { ApiError, ApiResponse, DonationCenter, PaginatedResponse } from '@/src/types';

export const donationCentersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDonationCenters: builder.query<
      PaginatedResponse<DonationCenter>,
      { page?: number; pageSize?: number } | void
    >({
      queryFn: async (arg, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const data = await donationCentersHandlers.getDonationCenters(arg ?? undefined);
          return { data };
        }
        return remoteToPaginated(
          await baseQuery({
            url: '/donation-centers',
            method: 'GET',
            params: arg ?? {},
          }),
          mapDonationCenter
        );
      },
      providesTags: (result) => {
        const listTag = { type: 'DonationCenter' as const, id: 'LIST' as const };
        if (result === undefined) {
          return [listTag];
        }
        const itemTags = result.data.map((item) => ({
          type: 'DonationCenter' as const,
          id: item.id,
        }));
        return [...itemTags, listTag];
      },
    }),

    getDonationCenterById: builder.query<DonationCenter, string>({
      queryFn: async (id, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await donationCentersHandlers.getDonationCenterById(id);
          return fromMockApiResult(result as ApiResponse<DonationCenter> | ApiError);
        }
        return remoteToSingle(await baseQuery({ url: `/donation-centers/${id}`, method: 'GET' }), mapDonationCenter);
      },
      providesTags: (_result, _error, id) => [{ type: 'DonationCenter' as const, id }],
    }),
  }),
});

export const { useGetDonationCentersQuery, useGetDonationCenterByIdQuery } = donationCentersApi;
