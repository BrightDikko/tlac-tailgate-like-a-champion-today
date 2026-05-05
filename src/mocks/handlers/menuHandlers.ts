import type {
  ApiError,
  ApiResponse,
  CreateMenuItemInput,
  FoodItem,
  MenuItemDeleteResult,
  MenuQueryParams,
  PaginatedResponse,
  UpdateMenuItemInput,
} from '@/src/types';

import { mockDb } from '@/src/mocks/mockDb';
import { mockDelay } from '@/src/mocks/mockDelay';
import { paginate } from '@/src/mocks/mockPagination';
import { fail, ok } from '@/src/mocks/mockResponse';

function filterMenuForTailgate(
  tailgateId: string,
  params?: MenuQueryParams
): FoodItem[] {
  let result = mockDb.menuItems.filter((item) => item.tailgateId === tailgateId);
  if (params?.category !== undefined) {
    result = result.filter((item) => item.category === params.category);
  }
  return result;
}

export async function getMenuByTailgateId(
  tailgateId: string,
  params?: MenuQueryParams
): Promise<PaginatedResponse<FoodItem>> {
  await mockDelay();
  const filtered = filterMenuForTailgate(tailgateId, params);
  return paginate(filtered, params?.page, params?.pageSize);
}

export async function createMenuItem(
  tailgateId: string,
  input: CreateMenuItemInput
): Promise<ApiResponse<FoodItem> | ApiError> {
  await mockDelay();
  const tailgate = mockDb.tailgates.find((t) => t.id === tailgateId);
  if (tailgate === undefined) {
    return fail('Tailgate not found', 'NOT_FOUND');
  }
  const created: FoodItem = {
    ...input,
    id: `food-${Date.now()}`,
    tailgateId,
  };
  mockDb.menuItems.push(created);
  return ok(created);
}

export async function updateMenuItem(
  id: string,
  input: UpdateMenuItemInput
): Promise<ApiResponse<FoodItem> | ApiError> {
  await mockDelay();
  if (input.id !== id) {
    return fail('Menu item id mismatch', 'BAD_REQUEST', {
      id: 'Request id must match path id',
    });
  }
  const index = mockDb.menuItems.findIndex((item) => item.id === id);
  if (index === -1) {
    return fail('Menu item not found', 'NOT_FOUND');
  }
  const existing = mockDb.menuItems[index];
  const { id: _ignoredId, ...patch } = input;
  const merged: FoodItem = {
    ...existing,
    ...patch,
    id: existing.id,
    tailgateId: existing.tailgateId,
  };
  mockDb.menuItems[index] = merged;
  return ok(merged);
}

export async function deleteMenuItem(id: string): Promise<ApiResponse<MenuItemDeleteResult> | ApiError> {
  await mockDelay();
  const index = mockDb.menuItems.findIndex((item) => item.id === id);
  if (index === -1) {
    return fail('Menu item not found', 'NOT_FOUND');
  }
  const existing = mockDb.menuItems[index];
  const tailgateId = existing.tailgateId;
  mockDb.menuItems = mockDb.menuItems.filter((item) => item.id !== id);
  return ok({ id, tailgateId });
}

export const menuHandlers = {
  getMenuByTailgateId,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
