export type DonationInput = {
  surplusId?: string;
  donationCenterId: string;
  approximateWeightLbs: number;
  notes?: string;
};

export type DonationRecord = DonationInput & {
  id: string;
  createdAt: string;
};
