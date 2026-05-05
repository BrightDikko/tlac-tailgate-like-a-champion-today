import { baseApi } from '@/src/api/baseApi';
import { mapRatingRecord } from '@/src/api/mappers';
import { fromMockApiResult, remoteToSingle } from '@/src/api/response';
import { ratingsHandlers } from '@/src/mocks/handlers/ratingsHandlers';
import { API_MODE } from '@/src/services/config/env';

import type { ApiError, ApiResponse, RatingInput, RatingRecord } from '@/src/types';

export const ratingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createRating: builder.mutation<RatingRecord, RatingInput>({
      queryFn: async (input, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const result = await ratingsHandlers.createRating(input);
          return fromMockApiResult(result as ApiResponse<RatingRecord> | ApiError);
        }
        return remoteToSingle(await baseQuery({ url: '/ratings', method: 'POST', body: input }), mapRatingRecord);
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
