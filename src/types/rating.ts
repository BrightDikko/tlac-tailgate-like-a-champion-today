export type RatingInput = {
  tailgateId: string;
  score: number;
  comment?: string;
};

export type RatingRecord = RatingInput & {
  id: string;
  author?: string;
  createdAt?: string;
};
