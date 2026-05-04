import type {
  ApiError,
  ApiResponse,
  ClaimInput,
  ClaimRecord,
  ConfirmClaimInput,
  ReleaseClaimInput,
  SurplusItem,
  SurplusStatus,
} from '@/src/types';

import { mockDb } from '@/src/mocks/mockDb';
import { mockDelay } from '@/src/mocks/mockDelay';
import { fail, ok } from '@/src/mocks/mockResponse';

function generatePublicClaimId(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `TLAC-${n}`;
}

function surplusStatusAfterRelease(status: SurplusStatus): SurplusStatus {
  if (status === 'expired' || status === 'donated') {
    return status;
  }
  return 'available';
}

export async function claimSurplus(
  surplusId: string,
  input: ClaimInput
): Promise<ApiResponse<ClaimRecord> | ApiError> {
  await mockDelay();

  if (input.surplusId !== surplusId) {
    return fail('Surplus id mismatch', 'BAD_REQUEST');
  }

  const surplusIndex = mockDb.surplusItems.findIndex((s) => s.id === surplusId);
  if (surplusIndex === -1) {
    return fail('Surplus item not found', 'NOT_FOUND');
  }

  const servingsClaimed = input.servingsClaimed;
  if (servingsClaimed < 1) {
    return fail('Servings claimed must be at least 1', 'BAD_REQUEST');
  }

  const surplus = mockDb.surplusItems[surplusIndex];
  if (servingsClaimed > surplus.servingsRemaining) {
    return fail('Not enough servings remaining', 'INSUFFICIENT_SERVINGS');
  }

  const newRemaining = surplus.servingsRemaining - servingsClaimed;
  const nextSurplusStatus: SurplusStatus =
    newRemaining === 0 ? 'claimed' : surplus.status;

  const publicClaimId = generatePublicClaimId();
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const expiresAt = new Date(nowDate.getTime() + 30 * 60 * 1000).toISOString();

  const record: ClaimRecord = {
    id: `claim-${Date.now()}`,
    surplusId,
    servingsClaimed,
    status: 'reserved',
    userId: mockDb.currentUser.id,
    claimId: publicClaimId,
    expiresAt,
    createdAt: now,
    updatedAt: now,
  };

  mockDb.surplusItems[surplusIndex] = {
    ...surplus,
    servingsRemaining: newRemaining,
    status: nextSurplusStatus,
    claimId: publicClaimId,
  };

  mockDb.claims = [...mockDb.claims, record];
  return ok(record);
}

export async function getMyClaims(): Promise<ApiResponse<ClaimRecord[]>> {
  await mockDelay();
  return ok(mockDb.claims.map((claim) => ({ ...claim })));
}

export async function confirmClaim(
  id: string,
  _input?: ConfirmClaimInput
): Promise<ApiResponse<ClaimRecord> | ApiError> {
  await mockDelay();

  const index = mockDb.claims.findIndex((c) => c.id === id);
  if (index === -1) {
    return fail('Claim not found', 'NOT_FOUND');
  }

  const existing = mockDb.claims[index];
  const updated: ClaimRecord = {
    ...existing,
    status: 'confirmed',
    confirmedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockDb.claims[index] = updated;
  return ok(updated);
}

export async function releaseClaim(
  id: string,
  _input?: ReleaseClaimInput
): Promise<ApiResponse<ClaimRecord> | ApiError> {
  await mockDelay();

  const index = mockDb.claims.findIndex((c) => c.id === id);
  if (index === -1) {
    return fail('Claim not found', 'NOT_FOUND');
  }

  const existing = mockDb.claims[index];
  if (existing.status === 'released') {
    return ok(existing);
  }

  const updatedAt = new Date().toISOString();
  const updated: ClaimRecord = {
    ...existing,
    status: 'released',
    releasedAt: updatedAt,
    updatedAt,
  };
  mockDb.claims[index] = updated;

  const surplusIndex = mockDb.surplusItems.findIndex((s) => s.id === existing.surplusId);
  if (surplusIndex !== -1) {
    const surplus = mockDb.surplusItems[surplusIndex];
    const nextServings = surplus.servingsRemaining + existing.servingsClaimed;
    const nextStatus = surplusStatusAfterRelease(surplus.status);

    let nextClaimId: string | undefined = surplus.claimId;
    if (surplus.claimId === existing.claimId) {
      nextClaimId = undefined;
    }

    const patched: SurplusItem = {
      ...surplus,
      servingsRemaining: nextServings,
      status: nextStatus,
      claimId: nextClaimId,
    };
    mockDb.surplusItems[surplusIndex] = patched;
  }

  return ok(updated);
}

export const claimsHandlers = {
  getMyClaims,
  claimSurplus,
  confirmClaim,
  releaseClaim,
};
