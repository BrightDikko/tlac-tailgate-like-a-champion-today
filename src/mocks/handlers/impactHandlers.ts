import type { ApiResponse, Impact } from '@/src/types';

import { mockDb } from '@/src/mocks/mockDb';
import { mockDelay } from '@/src/mocks/mockDelay';
import { ok } from '@/src/mocks/mockResponse';

export async function getMyImpact(): Promise<ApiResponse<Impact>> {
  await mockDelay();
  return ok(mockDb.impact);
}

export async function getGlobalImpact(): Promise<ApiResponse<Impact>> {
  await mockDelay();
  return ok(mockDb.impact);
}

export const impactHandlers = {
  getMyImpact,
  getGlobalImpact,
};
