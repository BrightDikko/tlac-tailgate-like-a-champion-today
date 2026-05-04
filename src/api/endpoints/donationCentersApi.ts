import type {
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from '@reduxjs/toolkit/query';

import { baseApi } from '@/src/api/baseApi';
import { donationCentersHandlers } from '@/src/mocks/handlers/donationCentersHandlers';
import { API_MODE } from '@/src/services/config/env';

import type {
  ApiError,
  ApiResponse,
  DonationCenter,
  PaginatedResponse,
} from '@/src/types';

function fromApiResult<T>(
  result: ApiResponse<T> | ApiError
): QueryReturnValue<T, ApiError | FetchBaseQueryError, FetchBaseQueryMeta | undefined> {
  if ('data' in result) {
    return { data: result.data };
  }
  return { error: result };
}

function asRemoteDonationCenterList(value: unknown): QueryReturnValue<
  PaginatedResponse<DonationCenter>,
  ApiError | FetchBaseQueryError,
  FetchBaseQueryMeta | undefined
> {
  return value as QueryReturnValue<
    PaginatedResponse<DonationCenter>,
    ApiError | FetchBaseQueryError,
    FetchBaseQueryMeta | undefined
  >;
}

function asRemoteDonationCenter(value: unknown): QueryReturnValue<
  DonationCenter,
  ApiError | FetchBaseQueryError,
  FetchBaseQueryMeta | undefined
> {
  return value as QueryReturnValue<
    DonationCenter,
    ApiError | FetchBaseQueryError,
    FetchBaseQueryMeta | undefined
  >;
}

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
        return asRemoteDonationCenterList(
          await baseQuery({
            url: '/donation-centers',
            method: 'GET',
            params: arg ?? {},
          })
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
          return fromApiResult(result);
        }
        return asRemoteDonationCenter(
          await baseQuery({
            url: `/donation-centers/${id}`,
            method: 'GET',
          })
        );
      },
      providesTags: (_result, _error, id) => [{ type: 'DonationCenter' as const, id }],
    }),
  }),
});

export const { useGetDonationCentersQuery, useGetDonationCenterByIdQuery } = donationCentersApi;
