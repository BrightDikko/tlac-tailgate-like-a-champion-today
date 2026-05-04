import type {
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from '@reduxjs/toolkit/query';

import { baseApi } from '@/src/api/baseApi';
import { gamesHandlers } from '@/src/mocks/handlers/gamesHandlers';
import { API_MODE } from '@/src/services/config/env';

import type { ApiError, Game } from '@/src/types';

function asRemoteGame(value: unknown): QueryReturnValue<
  Game,
  ApiError | FetchBaseQueryError,
  FetchBaseQueryMeta | undefined
> {
  return value as QueryReturnValue<
    Game,
    ApiError | FetchBaseQueryError,
    FetchBaseQueryMeta | undefined
  >;
}

export const gamesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentGame: builder.query<Game, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const res = await gamesHandlers.getCurrentGame();
          return { data: res.data };
        }
        return asRemoteGame(
          await baseQuery({
            url: '/games/current',
            method: 'GET',
          })
        );
      },
      providesTags: () => [{ type: 'Game' as const, id: 'CURRENT' }],
    }),
  }),
});

export const { useGetCurrentGameQuery } = gamesApi;
