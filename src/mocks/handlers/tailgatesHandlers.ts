import type {
  ApiError,
  ApiResponse,
  CreateTailgateInput,
  PaginatedResponse,
  Tailgate,
  TailgateDeleteResult,
  TailgateQueryParams,
  UpdateTailgateInput,
} from '@/src/types';

import { mockDb } from '@/src/mocks/mockDb';
import { mockDelay } from '@/src/mocks/mockDelay';
import { paginate } from '@/src/mocks/mockPagination';
import { fail, ok } from '@/src/mocks/mockResponse';

function tailgateSearchHaystack(t: Tailgate): string {
  return [
    t.groupName,
    t.hostName,
    t.description,
    t.locationDetail,
    t.groupType,
    t.campusZone ?? '',
    t.servingWindow ?? '',
    ...t.tags,
    ...(t.featuredMenuItems ?? []),
  ]
    .join(' ')
    .toLowerCase();
}

function applyTailgateFilters(items: Tailgate[], params?: TailgateQueryParams): Tailgate[] {
  let result = items;

  if (params?.status !== undefined) {
    result = result.filter((t) => t.status === params.status);
  }

  if (params?.search !== undefined && params.search.trim() !== '') {
    const needle = params.search.trim().toLowerCase();
    result = result.filter((t) => tailgateSearchHaystack(t).includes(needle));
  }

  if (params?.hostUserId !== undefined) {
    result = result.filter((t) => t.hostUserId === params.hostUserId);
  }

  if (params?.createdByUserId !== undefined) {
    result = result.filter((t) => t.createdByUserId === params.createdByUserId);
  }

  return result;
}

export async function getTailgates(
  params?: TailgateQueryParams
): Promise<PaginatedResponse<Tailgate>> {
  await mockDelay();
  const filtered = applyTailgateFilters(mockDb.tailgates, params);
  return paginate(filtered, params?.page, params?.pageSize);
}

export async function getTailgateById(
  id: string
): Promise<ApiResponse<Tailgate> | ApiError> {
  await mockDelay();
  const item = mockDb.tailgates.find((t) => t.id === id);
  if (item === undefined) {
    return fail('Tailgate not found', 'NOT_FOUND');
  }
  return ok(item);
}

export async function createTailgate(
  input: CreateTailgateInput
): Promise<ApiResponse<Tailgate>> {
  await mockDelay();
  const uid = mockDb.currentUser.id;
  const resolvedHostUserId = input.hostUserId ?? uid;
  const resolvedCreatedByUserId = input.createdByUserId ?? uid;
  const resolvedHostName =
    input.hostName.trim() !== ''
      ? input.hostName.trim()
      : (
          mockDb.currentUser.displayName?.trim() ||
          `${mockDb.currentUser.firstName} ${mockDb.currentUser.lastName}`.trim()
        );

  const created: Tailgate = {
    ...input,
    hostUserId: resolvedHostUserId,
    createdByUserId: resolvedCreatedByUserId,
    hostName: resolvedHostName || input.hostName,
    id: `event-${Date.now()}`,
    rating: 0,
    reviewCount: 0,
    distance: '0.0 mi',
    trendingScore: 0,
  };
  mockDb.tailgates.push(created);
  return ok(created);
}

export async function updateTailgate(
  id: string,
  input: UpdateTailgateInput
): Promise<ApiResponse<Tailgate> | ApiError> {
  await mockDelay();
  if (input.id !== id) {
    return fail('Tailgate id mismatch', 'BAD_REQUEST', {
      id: 'Request id must match path id',
    });
  }
  const index = mockDb.tailgates.findIndex((t) => t.id === id);
  if (index === -1) {
    return fail('Tailgate not found', 'NOT_FOUND');
  }
  const existing = mockDb.tailgates[index];
  const { id: _ignoredId, ...patch } = input;
  const merged: Tailgate = {
    ...existing,
    ...patch,
    id: existing.id,
  };
  if (merged.hostUserId === undefined) {
    merged.hostUserId = existing.hostUserId;
  }
  if (merged.createdByUserId === undefined) {
    merged.createdByUserId = existing.createdByUserId;
  }
  mockDb.tailgates[index] = merged;
  return ok(merged);
}

export async function deleteTailgate(id: string): Promise<ApiResponse<TailgateDeleteResult> | ApiError> {
  await mockDelay();
  const index = mockDb.tailgates.findIndex((t) => t.id === id);
  if (index === -1) {
    return fail('Tailgate not found', 'NOT_FOUND');
  }
  const removedMenuItemIds = mockDb.menuItems.filter((m) => m.tailgateId === id).map((m) => m.id);
  const removedSurplusIds = mockDb.surplusItems.filter((s) => s.tailgateId === id).map((s) => s.id);
  mockDb.menuItems = mockDb.menuItems.filter((m) => m.tailgateId !== id);
  mockDb.surplusItems = mockDb.surplusItems.filter((s) => s.tailgateId !== id);
  mockDb.claims = mockDb.claims.filter((c) => !removedSurplusIds.includes(c.surplusId));
  mockDb.tailgates.splice(index, 1);
  return ok({
    tailgateId: id,
    removedSurplusIds,
    removedMenuItemIds,
  });
}

export const tailgatesHandlers = {
  getTailgates,
  getTailgateById,
  createTailgate,
  updateTailgate,
  deleteTailgate,
};
