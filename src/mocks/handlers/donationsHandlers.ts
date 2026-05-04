import type {
  ApiError,
  ApiResponse,
  DonationInput,
  DonationRecord,
} from '@/src/types';

import { mockDb } from '@/src/mocks/mockDb';
import { mockDelay } from '@/src/mocks/mockDelay';
import { fail, ok } from '@/src/mocks/mockResponse';

export async function createDonation(
  input: DonationInput
): Promise<ApiResponse<DonationRecord> | ApiError> {
  await mockDelay();

  const center = mockDb.donationCenters.find((c) => c.id === input.donationCenterId);
  if (center === undefined) {
    return fail('Donation center not found', 'NOT_FOUND');
  }

  if (input.surplusId !== undefined) {
    const surplus = mockDb.surplusItems.find((s) => s.id === input.surplusId);
    if (surplus === undefined) {
      return fail('Surplus item not found', 'NOT_FOUND');
    }
  }

  const w = input.approximateWeightLbs;
  if (typeof w !== 'number' || !Number.isFinite(w) || w <= 0) {
    return fail('Approximate weight must be greater than 0', 'BAD_REQUEST');
  }

  const record: DonationRecord = {
    id: `donation-${Date.now()}`,
    donationCenterId: input.donationCenterId,
    approximateWeightLbs: input.approximateWeightLbs,
    createdAt: new Date().toISOString(),
    ...(input.surplusId !== undefined ? { surplusId: input.surplusId } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
  };

  mockDb.donations.push(record);

  if (input.surplusId !== undefined) {
    const idx = mockDb.surplusItems.findIndex((s) => s.id === input.surplusId);
    if (idx !== -1) {
      const s = mockDb.surplusItems[idx];
      mockDb.surplusItems[idx] = { ...s, status: 'donated' };
    }
  }

  mockDb.impact.poundsDonated += Math.round(input.approximateWeightLbs);

  return ok(record);
}

export const donationsHandlers = {
  createDonation,
};
