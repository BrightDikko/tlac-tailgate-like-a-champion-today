import type { ApiResponse, Game } from '@/src/types';

import { mockDb } from '@/src/mocks/mockDb';
import { mockDelay } from '@/src/mocks/mockDelay';
import { ok } from '@/src/mocks/mockResponse';

export async function getCurrentGame(): Promise<ApiResponse<Game>> {
  await mockDelay();
  return ok(mockDb.currentGame);
}

export const gamesHandlers = {
  getCurrentGame,
};
