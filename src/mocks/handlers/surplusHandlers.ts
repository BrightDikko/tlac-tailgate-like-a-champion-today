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

function applySurplusFilters(
  items: SurplusItem[],
  params?: SurplusQueryParams
): SurplusItem[] {
  let result = items;

  if (params?.status !== undefined) {
    result = result.filter((item) => item.status === params.status);
  }

  if (params?.tailgateId !== undefined) {
    result = result.filter((item) => item.tailgateId === params.tailgateId);
  }

  return result;
}

function newSurplusId(): string {
  return `surplus-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
): Promise<ApiResponse<SurplusItem> | ApiError> {
  await mockDelay();
  if (typeof input.tailgateId !== 'string' || input.tailgateId.trim() === '') {
    return fail('tailgateId is required', 'BAD_REQUEST', { tailgateId: 'Must be a non-empty tailgate id' });
  }
  const created: SurplusItem = {
    ...input,
    id: newSurplusId(),
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
