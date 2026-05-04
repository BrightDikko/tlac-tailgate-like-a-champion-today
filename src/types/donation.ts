import type { DonationCategory } from './index';

export type DonationInput = {
  surplusId?: string;
  donationCenterId: string;
  donationCategory: DonationCategory;
  itemDescription?: string;
  approximateWeightLbs: number;
  notes?: string;
};

export type DonationRecord = DonationInput & {
  id: string;
  createdAt: string;
};
