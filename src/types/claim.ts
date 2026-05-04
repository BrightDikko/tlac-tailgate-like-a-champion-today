export type ClaimInput = {
  surplusId: string;
  servingsClaimed: number;
};

export type ClaimStatus = 'reserved' | 'confirmed' | 'released';

export type ClaimRecord = {
  id: string;
  surplusId: string;
  servingsClaimed: number;
  status: ClaimStatus;
  userId?: string;
  claimId?: string;
  expiresAt?: string;
  confirmedAt?: string;
  releasedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ConfirmClaimInput = {
  note?: string;
};

export type ReleaseClaimInput = {
  reason?: string;
};
