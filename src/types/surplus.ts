import type { SurplusItem, SurplusStatus } from '@/src/types';

export type SurplusQueryParams = {
  status?: SurplusStatus;
  tailgateId?: string;
  page?: number;
  pageSize?: number;
};

export type CreateSurplusInput = Omit<SurplusItem, 'id' | 'claimId'>;

export type UpdateSurplusInput = Partial<Omit<SurplusItem, 'id'>> & {
  id: string;
};
