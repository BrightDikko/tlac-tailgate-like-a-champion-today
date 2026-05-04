import type { ApiError, ApiResponse, DonationInput, DonationRecord, SurplusItem } from '@/src/types';

import { mockDb } from '@/src/mocks/mockDb';
import { mockDelay } from '@/src/mocks/mockDelay';
import { fail, ok } from '@/src/mocks/mockResponse';
import { centerAcceptsCategory } from '@/src/utils/donationCategories';

function newDonationId(): string {
  return `donation-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function surplusEligibleForDonation(status: SurplusItem['status']): boolean {
  return status === 'available' || status === 'almost_gone';
}

export async function getDonationById(
  id: string
): Promise<ApiResponse<DonationRecord> | ApiError> {
  await mockDelay();
  const donation = mockDb.donations.find((d) => d.id === id);
  if (donation === undefined) {
    return fail('Donation not found', 'NOT_FOUND');
  }
  return ok(donation);
}

export async function createDonation(
  input: DonationInput
): Promise<ApiResponse<DonationRecord> | ApiError> {
  await mockDelay();

  const center = mockDb.donationCenters.find((c) => c.id === input.donationCenterId);
  if (center === undefined) {
    return fail('Donation center not found', 'NOT_FOUND');
  }

  const w = input.approximateWeightLbs;
  if (typeof w !== 'number' || !Number.isFinite(w) || w <= 0) {
    return fail('Approximate weight must be a positive number', 'BAD_REQUEST');
  }

  if (!centerAcceptsCategory(center, input.donationCategory)) {
    return fail(
      `This donation center does not accept ${input.donationCategory.replace('_', ' ')}`,
      'BAD_REQUEST',
      {
        donationCategory: 'Choose a supported donation category for this center.',
      },
    );
  }

  const linkedSurplusId = (input.surplusId ?? '').trim();

  if (input.donationCategory === 'prepared_food') {
    if (linkedSurplusId === '') {
      return fail('Prepared food donations require a surplus item', 'BAD_REQUEST', {
        surplusId: 'Select the prepared surplus item being donated.',
      });
    }
    const surplus = mockDb.surplusItems.find((s) => s.id === linkedSurplusId);
    if (surplus === undefined) {
      return fail('Surplus item not found', 'NOT_FOUND');
    }
    if (!surplusEligibleForDonation(surplus.status)) {
      return fail(
        'Surplus item cannot be donated in its current status (claimed, expired, or already donated)',
        'BAD_REQUEST',
        { surplusId: 'Pick an available or almost-gone surplus listing, or omit surplus.' },
      );
    }
  }

  const record: DonationRecord = {
    id: newDonationId(),
    donationCenterId: input.donationCenterId,
    donationCategory: input.donationCategory,
    ...(input.itemDescription !== undefined && input.itemDescription.trim() !== ''
      ? { itemDescription: input.itemDescription.trim() }
      : {}),
    approximateWeightLbs: input.approximateWeightLbs,
    createdAt: new Date().toISOString(),
    ...(input.donationCategory === 'prepared_food' && linkedSurplusId !== '' ? { surplusId: linkedSurplusId } : {}),
    ...(input.notes !== undefined && input.notes.trim() !== '' ? { notes: input.notes.trim() } : {}),
  };

  mockDb.donations.push(record);

  if (input.donationCategory === 'prepared_food' && linkedSurplusId !== '') {
    const idx = mockDb.surplusItems.findIndex((s) => s.id === linkedSurplusId);
    if (idx !== -1) {
      const s = mockDb.surplusItems[idx];
      mockDb.surplusItems[idx] = { ...s, status: 'donated' as const, servingsRemaining: 0 };
    }
  }

  mockDb.impact.poundsDonated += Math.round(input.approximateWeightLbs);

  return ok(record);
}

export const donationsHandlers = {
  createDonation,
  getDonationById,
};
