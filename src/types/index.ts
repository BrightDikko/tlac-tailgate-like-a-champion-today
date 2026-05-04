export type UserRole = 'student' | 'host' | 'admin';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

/** Active Student/Fan profile for local MVP data (JSON-backed). */
export type CurrentUser = User & {
  displayName?: string;
  affiliationLabel?: string;
  avatarInitials?: string;
  avatarImageKey?: string;
  pickupStreak?: number;
  savedTailgateIds?: string[];
  claimedSurplusIds?: string[];
};

export type GamePhase = 'pregame' | 'postgame';

export interface Game {
  id: string;
  opponent: string;
  matchup: string;
  gameDate: string;
  kickoffTime: string;
  location: string;
  weather: string;
  phase: GamePhase;
}

export type TailgateStatus = 'planned' | 'active' | 'completed';

/** Visual hero gradient preset for local placeholder art (no remote images). */
export type TailgateImageTone = 'stadium' | 'goldLot' | 'quad' | 'tailgateClassic' | 'southBendSunset';

export interface Tailgate {
  id: string;
  groupName: string;
  groupType: string;
  hostName: string;
  description: string;
  locationDetail: string;
  status: TailgateStatus;
  rating: number;
  reviewCount: number;
  attendeeEstimate: number;
  distance: string;
  tags: string[];
  trendingScore: number;
  /** Two-layer hero gradient key */
  imageTone?: TailgateImageTone;
  /** Local image key in src/assets/images.ts tailgateImages map */
  imageKey?: string;
  /** Local image key in src/assets/images.ts avatarImages map */
  hostAvatarKey?: string;
  /** Local image key in src/assets/images.ts placeImages map */
  placeImageKey?: string;
  /** Host / group initials on card */
  avatarInitials?: string;
  /** Short menu highlights for discovery cards */
  featuredMenuItems?: string[];
  /** Campus area label (e.g. Stadium lots) */
  campusZone?: string;
  /** When they are serving (copy only) */
  servingWindow?: string;
  /** Account id allowed to manage this tailgate (when backend auth exists). */
  hostUserId?: string;
  /** Account id that originally created this listing. */
  createdByUserId?: string;
}

export type FoodCategory = 'entree' | 'side' | 'drink' | 'dessert';

export interface FoodItem {
  id: string;
  tailgateId: string;
  name: string;
  category: FoodCategory;
  description: string;
  quantityPrepared: number;
  imageKey?: string;
}

export type SurplusStatus = 'available' | 'almost_gone' | 'claimed' | 'expired' | 'donated';

export interface SurplusItem {
  id: string;
  tailgateId: string;
  foodItemId?: string;
  foodName: string;
  groupName: string;
  location: string;
  servingsRemaining: number;
  minutesLeft: number;
  status: SurplusStatus;
  pickupNote: string;
  claimId?: string;
  imageKey?: string;
  createdAt?: string;
  expiresAt?: string;
}

export interface Review {
  id: string;
  author: string;
  score: number;
  comment: string;
}

export interface Impact {
  servingsClaimed: number;
  poundsDonated: number;
  wasteDivertedPercent: number;
  participatingTailgates: number;
  studentPickups: number;
  donationCentersSupported: number;
}

export interface DonationCenter {
  id: string;
  name: string;
  address: string;
  distance: string;
  acceptsPreparedFood: boolean;
  openStatus: string;
  phone: string;
  description?: string;
  imageKey?: string;
  policyNotes?: string[];
  hours?: string[];
  dropoffInstructions?: string;
  impactLabel?: string;
}

export * from './api';
export * from './auth';
export * from './game';
export * from './tailgate';
export * from './menu';
export * from './surplus';
export * from './claim';
export * from './donation';
export * from './impact';
export * from './rating';
