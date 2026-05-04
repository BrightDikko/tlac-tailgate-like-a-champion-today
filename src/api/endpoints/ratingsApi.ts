import type {
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from '@reduxjs/toolkit/query';

import { baseApi } from '@/src/api/baseApi';
import { ratingsHandlers } from '@/src/mocks/handlers/ratingsHandlers';
import { API_MODE } from '@/src/services/config/env';

import type { ApiError, ApiResponse, RatingInput, RatingRecord } from '@/src/types';

function fromApiResult<T>(
  result: ApiResponse<T> | ApiError
): QueryReturnValue<T, ApiError | FetchBaseQueryError, FetchBaseQueryMeta | undefined> {
  if ('data' in result) {
    return { data: result.data };
  }
  return { error: result };
}

function asRemoteRatingRecord(value: unknown): QueryReturnValue<
  RatingRecord,
  ApiError | FetchBaseQueryError,
  FetchBaseQueryMeta | undefined
> {
  return value as QueryReturnValue<
    RatingRecord,
    ApiError | FetchBaseQueryError,
    FetchBaseQueryMeta | undefined
  >;
}

export const ratingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createRating: builder.mutation<RatingRecord, RatingInput>({
      queryFn: async (input, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await ratingsHandlers.createRating(input);
          return fromApiResult(result);
        }
        return asRemoteRatingRecord(
          await baseQuery({
            url: '/ratings',
            method: 'POST',
            body: input,
          })
        );
      },
      invalidatesTags: (_result, _error, input) => [
        { type: 'Rating', id: 'LIST' },
        { type: 'Tailgate', id: input.tailgateId },
        { type: 'Tailgate', id: 'LIST' },
      ],
    }),
  }),
});

export const { useCreateRatingMutation } = ratingsApi;
