import type {
  ApiError,
  ApiResponse,
  CreateSurplusInput,
  PaginatedResponse,
  SurplusItem,
  SurplusQueryParams,
  UpdateSurplusInput,
} from '@/src/types';

import { mockDb } from '@/src/mocks/mockDb';
import { mockDelay } from '@/src/mocks/mockDelay';
import { paginate } from '@/src/mocks/mockPagination';
import { fail, ok } from '@/src/mocks/mockResponse';

function findTailgateGroupName(tailgateId: string): string | undefined {
  return mockDb.tailgates.find((t) => t.id === tailgateId)?.groupName;
}

function applySurplusFilters(
  items: SurplusItem[],
  params?: SurplusQueryParams
): SurplusItem[] {
  let result = items;

  if (params?.status !== undefined) {
    result = result.filter((item) => item.status === params.status);
  }

  if (params?.tailgateId !== undefined) {
    const groupName = findTailgateGroupName(params.tailgateId);
    if (groupName === undefined) {
      return [];
    }
    result = result.filter((item) => item.groupName === groupName);
  }

  return result;
}

export async function getSurplus(
  params?: SurplusQueryParams
): Promise<PaginatedResponse<SurplusItem>> {
  await mockDelay();
  const filtered = applySurplusFilters(mockDb.surplusItems, params);
  return paginate(filtered, params?.page, params?.pageSize);
}

export async function getSurplusById(
  id: string
): Promise<ApiResponse<SurplusItem> | ApiError> {
  await mockDelay();
  const item = mockDb.surplusItems.find((s) => s.id === id);
  if (item === undefined) {
    return fail('Surplus item not found', 'NOT_FOUND');
  }
  return ok(item);
}

export async function createSurplus(
  input: CreateSurplusInput
): Promise<ApiResponse<SurplusItem>> {
  await mockDelay();
  const created: SurplusItem = {
    ...input,
    id: `surplus-${Date.now()}`,
  };
  mockDb.surplusItems.push(created);
  return ok(created);
}

export async function updateSurplus(
  id: string,
  input: UpdateSurplusInput
): Promise<ApiResponse<SurplusItem> | ApiError> {
  await mockDelay();
  if (input.id !== id) {
    return fail('Surplus id mismatch', 'BAD_REQUEST', {
      id: 'Request id must match path id',
    });
  }
  const index = mockDb.surplusItems.findIndex((item) => item.id === id);
  if (index === -1) {
    return fail('Surplus item not found', 'NOT_FOUND');
  }
  const existing = mockDb.surplusItems[index];
  const { id: _ignoredId, ...patch } = input;
  const merged: SurplusItem = {
    ...existing,
    ...patch,
    id: existing.id,
  };
  mockDb.surplusItems[index] = merged;
  return ok(merged);
}

export const surplusHandlers = {
  getSurplus,
  getSurplusById,
  createSurplus,
  updateSurplus,
};
