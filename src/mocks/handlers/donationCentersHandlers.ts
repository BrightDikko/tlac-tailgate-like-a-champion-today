import type { ApiError, ApiResponse, DonationCenter, PaginatedResponse } from '@/src/types';

import { mockDb } from '@/src/mocks/mockDb';
import { mockDelay } from '@/src/mocks/mockDelay';
import { paginate } from '@/src/mocks/mockPagination';
import { fail, ok } from '@/src/mocks/mockResponse';

export async function getDonationCenters(
  params?: { page?: number; pageSize?: number }
): Promise<PaginatedResponse<DonationCenter>> {
  await mockDelay();
  return paginate(mockDb.donationCenters, params?.page, params?.pageSize);
}

export async function getDonationCenterById(
  id: string
): Promise<ApiResponse<DonationCenter> | ApiError> {
  await mockDelay();
  const center = mockDb.donationCenters.find((c) => c.id === id);
  if (center === undefined) {
    return fail('Donation center not found', 'NOT_FOUND');
  }
  return ok(center);
}

export const donationCentersHandlers = {
  getDonationCenters,
  getDonationCenterById,
};
