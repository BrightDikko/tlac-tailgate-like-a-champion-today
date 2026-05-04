import type {
  ApiError,
  ApiResponse,
  RatingInput,
  RatingRecord,
} from '@/src/types';

import { mockDb } from '@/src/mocks/mockDb';
import { mockDelay } from '@/src/mocks/mockDelay';
import { fail, ok } from '@/src/mocks/mockResponse';

function authorFromCurrentUser(): string {
  const u = mockDb.currentUser;
  const d = u.displayName?.trim();
  if (d) return d;
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  return name || 'TLAC member';
}

export async function createRating(
  input: RatingInput
): Promise<ApiResponse<RatingRecord> | ApiError> {
  await mockDelay();

  const tailgateIndex = mockDb.tailgates.findIndex((t) => t.id === input.tailgateId);
  if (tailgateIndex === -1) {
    return fail('Tailgate not found', 'NOT_FOUND');
  }

  const score = input.score;
  if (typeof score !== 'number' || !Number.isFinite(score) || score < 1 || score > 5) {
    return fail('Rating score must be between 1 and 5', 'BAD_REQUEST');
  }

  const existing = mockDb.tailgates[tailgateIndex];
  const record: RatingRecord = {
    id: `rating-${Date.now()}`,
    tailgateId: input.tailgateId,
    score: input.score,
    ...(input.comment !== undefined ? { comment: input.comment } : {}),
    author: authorFromCurrentUser(),
    createdAt: new Date().toISOString(),
  };

  mockDb.ratings.push(record);

  const oldTotal = existing.rating * existing.reviewCount;
  const nextReviewCount = existing.reviewCount + 1;
  const nextRating = (oldTotal + input.score) / nextReviewCount;
  const roundedRating = Math.round(nextRating * 100) / 100;

  mockDb.tailgates[tailgateIndex] = {
    ...existing,
    rating: roundedRating,
    reviewCount: nextReviewCount,
  };

  return ok(record);
}

export const ratingsHandlers = {
  createRating,
};
