import type { Tailgate, TailgateStatus } from '@/src/types';

export type TailgateQueryParams = {
  status?: TailgateStatus;
  search?: string;
  page?: number;
  pageSize?: number;
};

/** Payload to create a tailgate; server may assign id, rating, reviewCount, distance, trendingScore. */
export type CreateTailgateInput = Omit<Tailgate, 'id' | 'rating' | 'reviewCount' | 'distance' | 'trendingScore'>;

export type UpdateTailgateInput = Partial<Omit<Tailgate, 'id'>> & {
  id: string;
};
