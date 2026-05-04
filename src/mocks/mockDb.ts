import type { ClaimRecord, CurrentUser, DonationRecord, RatingRecord } from '@/src/types';

import {
  currentGame,
  currentUser as seedCurrentUser,
  donationCenters,
  impact,
  menuItems,
  reviews,
  surplusItems,
  tailgates,
} from '@/src/data/localData';

export const mockDb = {
  currentGame,
  currentUser: { ...seedCurrentUser } as CurrentUser,
  donationCenters: [...donationCenters],
  claims: [] as ClaimRecord[],
  donations: [] as DonationRecord[],
  impact,
  menuItems: [...menuItems],
  ratings: [] as RatingRecord[],
  reviews: [...reviews],
  surplusItems: [...surplusItems],
  tailgates: [...tailgates],
};
