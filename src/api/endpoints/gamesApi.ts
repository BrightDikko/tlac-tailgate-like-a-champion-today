import { baseApi } from '@/src/api/baseApi';
import { mapGame } from '@/src/api/mappers';
import { remoteToSingle } from '@/src/api/response';
import { gamesHandlers } from '@/src/mocks/handlers/gamesHandlers';
import { API_MODE } from '@/src/services/config/env';

import type { Game } from '@/src/types';

export const gamesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentGame: builder.query<Game, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        if (API_MODE === 'mock') {
          const res = await gamesHandlers.getCurrentGame();
          return { data: res.data };
        }
        return remoteToSingle(await baseQuery({ url: '/games/current', method: 'GET' }), mapGame);
      },
      providesTags: () => [{ type: 'Game' as const, id: 'CURRENT' }],
    }),
  }),
});

export const { useGetCurrentGameQuery, useLazyGetCurrentGameQuery } = gamesApi;
