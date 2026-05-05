import type { ClaimRecord, CurrentUser, DonationRecord, RatingRecord, SurplusItem } from '@/src/types';

import currentUserJson from '@/src/data/json/currentUser.json';
import {
  currentGame,
  donationCenters,
  impact,
  menuItems,
  reviews,
  surplusItems,
  tailgates,
} from '@/src/data/localData';

export type MockStoredAccount = {
  password: string;
  user: CurrentUser;
};

/** Deep clone user arrays so mutations do not leak between sessions or registry entries. */
export function cloneCurrentUser(user: CurrentUser): CurrentUser {
  return {
    ...user,
    savedTailgateIds: [...(user.savedTailgateIds ?? [])],
    claimedSurplusIds: [...(user.claimedSurplusIds ?? [])],
  };
}

/**
 * Bright Dikko profile from JSON — demo persona only (`loginDemo`).
 * Not inserted into `usersByEmail`; normal Sign in must use registered accounts.
 */
const demoPersonaTemplate = cloneCurrentUser(currentUserJson as CurrentUser);

export function cloneDemoPersonaUser(): CurrentUser {
  return cloneCurrentUser(demoPersonaTemplate);
}

/** Default mock session when nobody has signed in / after logout — not the Bright demo persona. */
export function createAnonymousMockUser(): CurrentUser {
  return {
    id: 'mock-anonymous',
    firstName: '',
    lastName: '',
    role: 'student',
    displayName: 'Guest',
    avatarInitials: 'TL',
    affiliationLabel: 'TLAC',
    pickupStreak: 0,
    savedTailgateIds: [],
    claimedSurplusIds: [],
  };
}

function normalizeMockSurplusItems(items: SurplusItem[]): SurplusItem[] {
  const now = Date.now();
  return items.map((item, index) => {
    const availabilityMinutes = 120 + index * 30;
    const expiresAt = new Date(now + availabilityMinutes * 60_000).toISOString();
    const minutesLeft = Math.max(1, Math.ceil((Date.parse(expiresAt) - now) / 60_000));
    return {
      ...item,
      expiresAt,
      minutesLeft,
      pickupWindowMinutes: item.pickupWindowMinutes ?? 30,
    };
  });
}

export const mockDb = {
  currentGame,
  /** Reflects the active mock session user (registered user, demo persona, or anonymous guest). */
  currentUser: createAnonymousMockUser(),
  /** Credential-backed accounts created via mock `register` — excludes Bright unless someone registers that email. */
  usersByEmail: {} as Record<string, MockStoredAccount>,
  donationCenters: [...donationCenters],
  claims: [] as ClaimRecord[],
  donations: [] as DonationRecord[],
  impact,
  menuItems: [...menuItems],
  ratings: [] as RatingRecord[],
  reviews: [...reviews],
  surplusItems: normalizeMockSurplusItems([...surplusItems]),
  tailgates: [...tailgates],
};
