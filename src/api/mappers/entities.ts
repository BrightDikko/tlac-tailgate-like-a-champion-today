import type {
  AuthSession,
  AuthTokens,
  ClaimRecord,
  ClaimStatus,
  CurrentUser,
  DonationCategory,
  DonationCenter,
  DonationRecord,
  FoodCategory,
  FoodItem,
  Game,
  GamePhase,
  Impact,
  RatingRecord,
  SurplusItem,
  SurplusStatus,
  Tailgate,
  TailgateImageTone,
  TailgateStatus,
  UserRole,
} from '@/src/types';

import {
  asRecord,
  pickBoolean,
  pickId,
  pickNumber,
  pickOptionalString,
  pickString,
  pickStringArray,
} from './dto';

const USER_ROLES: UserRole[] = ['student', 'host', 'admin'];
const FOOD_CATEGORIES: FoodCategory[] = ['entree', 'side', 'drink', 'dessert'];
const SURPLUS_STATUSES: SurplusStatus[] = ['available', 'almost_gone', 'claimed', 'expired', 'donated'];
const CLAIM_STATUSES: ClaimStatus[] = ['reserved', 'confirmed', 'released'];
const TAILGATE_STATUSES: TailgateStatus[] = ['planned', 'active', 'completed'];
const GAME_PHASES: GamePhase[] = ['pregame', 'postgame'];
const DONATION_CATEGORIES: DonationCategory[] = [
  'prepared_food',
  'packaged_drinks',
  'packaged_food',
  'produce',
];
const IMAGE_TONES: TailgateImageTone[] = [
  'stadium',
  'goldLot',
  'quad',
  'tailgateClassic',
  'southBendSunset',
];

function coerceUserRole(value: string): UserRole {
  return USER_ROLES.includes(value as UserRole) ? (value as UserRole) : 'student';
}

function coerceFoodCategory(value: string): FoodCategory {
  return FOOD_CATEGORIES.includes(value as FoodCategory) ? (value as FoodCategory) : 'entree';
}

function coerceSurplusStatus(value: string): SurplusStatus {
  return SURPLUS_STATUSES.includes(value as SurplusStatus) ? (value as SurplusStatus) : 'available';
}

function coerceClaimStatus(value: string): ClaimStatus {
  return CLAIM_STATUSES.includes(value as ClaimStatus) ? (value as ClaimStatus) : 'reserved';
}

function coerceTailgateStatus(value: string): TailgateStatus {
  return TAILGATE_STATUSES.includes(value as TailgateStatus) ? (value as TailgateStatus) : 'planned';
}

function coerceGamePhase(value: string): GamePhase {
  return GAME_PHASES.includes(value as GamePhase) ? (value as GamePhase) : 'pregame';
}

function coerceDonationCategory(value: string): DonationCategory {
  return DONATION_CATEGORIES.includes(value as DonationCategory) ? (value as DonationCategory) : 'prepared_food';
}

function pickImageTone(obj: Record<string, unknown>): TailgateImageTone | undefined {
  const raw = pickOptionalString(obj, ['imageTone', 'image_tone']);
  if (raw !== undefined && IMAGE_TONES.includes(raw as TailgateImageTone)) {
    return raw as TailgateImageTone;
  }
  return undefined;
}

export function mapCurrentUser(raw: unknown): CurrentUser | null {
  const r = asRecord(raw);
  if (r === null) return null;
  const id = pickId(r);
  if (id === undefined) return null;
  const firstName = pickString(r, ['firstName', 'first_name'], '');
  const lastName = pickString(r, ['lastName', 'last_name'], '');
  const role = coerceUserRole(pickString(r, ['role'], 'student'));
  const user: CurrentUser = {
    id,
    firstName,
    lastName,
    role,
    displayName: pickOptionalString(r, ['displayName', 'display_name']),
    affiliationLabel: pickOptionalString(r, ['affiliationLabel', 'affiliation_label']),
    avatarInitials: pickOptionalString(r, ['avatarInitials', 'avatar_initials']),
    avatarImageKey: pickOptionalString(r, ['avatarImageKey', 'avatar_image_key']),
    savedTailgateIds: pickStringArray(r, ['savedTailgateIds', 'saved_tailgate_ids']),
    claimedSurplusIds: pickStringArray(r, ['claimedSurplusIds', 'claimed_surplus_ids']),
  };
  if ('pickupStreak' in r || 'pickup_streak' in r) {
    user.pickupStreak = pickNumber(r, ['pickupStreak', 'pickup_streak'], 0);
  }
  return user;
}

function mapAuthTokens(raw: unknown): AuthTokens | null {
  const r = asRecord(raw);
  if (r === null) return null;
  const accessToken = pickString(r, ['accessToken', 'access_token'], '');
  if (accessToken.length === 0) return null;
  return {
    accessToken,
    refreshToken: pickOptionalString(r, ['refreshToken', 'refresh_token']),
  };
}

export function mapAuthSession(raw: unknown): AuthSession | null {
  const r = asRecord(raw);
  if (r === null) return null;
  const userRaw = r.user ?? r.user_data;
  const tokensRaw = r.tokens ?? r.token ?? r.tokens_data;
  const user = mapCurrentUser(userRaw);
  const tokens = mapAuthTokens(tokensRaw);
  if (user === null || tokens === null) return null;
  return { user, tokens };
}

export function mapGame(raw: unknown): Game | null {
  const r = asRecord(raw);
  if (r === null) return null;
  const id = pickId(r);
  if (id === undefined) return null;
  return {
    id,
    opponent: pickString(r, ['opponent'], ''),
    matchup: pickString(r, ['matchup'], ''),
    gameDate: pickString(r, ['gameDate', 'game_date'], ''),
    kickoffTime: pickString(r, ['kickoffTime', 'kickoff_time'], ''),
    location: pickString(r, ['location'], ''),
    weather: pickString(r, ['weather'], ''),
    phase: coerceGamePhase(pickString(r, ['phase'], 'pregame')),
  };
}

export function mapTailgate(raw: unknown): Tailgate | null {
  const r = asRecord(raw);
  if (r === null) return null;
  const id = pickId(r);
  if (id === undefined) return null;
  return {
    id,
    groupName: pickString(r, ['groupName', 'group_name'], ''),
    groupType: pickString(r, ['groupType', 'group_type'], ''),
    hostName: pickString(r, ['hostName', 'host_name'], ''),
    description: pickString(r, ['description'], ''),
    locationDetail: pickString(r, ['locationDetail', 'location_detail'], ''),
    status: coerceTailgateStatus(pickString(r, ['status'], 'planned')),
    rating: pickNumber(r, ['rating'], 0),
    reviewCount: pickNumber(r, ['reviewCount', 'review_count'], 0),
    attendeeEstimate: pickNumber(r, ['attendeeEstimate', 'attendee_estimate'], 0),
    distance: pickString(r, ['distance'], '0 mi'),
    tags: pickStringArray(r, ['tags']) ?? [],
    trendingScore: pickNumber(r, ['trendingScore', 'trending_score'], 0),
    imageTone: pickImageTone(r),
    imageKey: pickOptionalString(r, ['imageKey', 'image_key']),
    hostAvatarKey: pickOptionalString(r, ['hostAvatarKey', 'host_avatar_key']),
    placeImageKey: pickOptionalString(r, ['placeImageKey', 'place_image_key']),
    avatarInitials: pickOptionalString(r, ['avatarInitials', 'avatar_initials']),
    featuredMenuItems: pickStringArray(r, ['featuredMenuItems', 'featured_menu_items']),
    campusZone: pickOptionalString(r, ['campusZone', 'campus_zone']),
    servingWindow: pickOptionalString(r, ['servingWindow', 'serving_window']),
    hostUserId: pickOptionalString(r, ['hostUserId', 'host_user_id']),
    createdByUserId: pickOptionalString(r, ['createdByUserId', 'created_by_user_id']),
  };
}

export function mapFoodItem(raw: unknown): FoodItem | null {
  const r = asRecord(raw);
  if (r === null) return null;
  const id = pickId(r);
  if (id === undefined) return null;
  return {
    id,
    tailgateId: pickString(r, ['tailgateId', 'tailgate_id'], ''),
    name: pickString(r, ['name'], ''),
    category: coerceFoodCategory(pickString(r, ['category'], 'entree')),
    description: pickString(r, ['description'], ''),
    quantityPrepared: pickNumber(r, ['quantityPrepared', 'quantity_prepared'], 0),
    imageKey: pickOptionalString(r, ['imageKey', 'image_key']),
  };
}

export function mapSurplusItem(raw: unknown): SurplusItem | null {
  const r = asRecord(raw);
  if (r === null) return null;
  const id = pickId(r);
  if (id === undefined) return null;
  return {
    id,
    tailgateId: pickString(r, ['tailgateId', 'tailgate_id'], ''),
    foodItemId: pickOptionalString(r, ['foodItemId', 'food_item_id']),
    foodName: pickString(r, ['foodName', 'food_name'], ''),
    groupName: pickString(r, ['groupName', 'group_name'], ''),
    location: pickString(r, ['location'], ''),
    servingsRemaining: pickNumber(r, ['servingsRemaining', 'servings_remaining'], 0),
    minutesLeft: pickNumber(r, ['minutesLeft', 'minutes_left'], 0),
    status: coerceSurplusStatus(pickString(r, ['status'], 'available')),
    pickupNote: pickString(r, ['pickupNote', 'pickup_note'], ''),
    claimId: pickOptionalString(r, ['claimId', 'claim_id']),
    imageKey: pickOptionalString(r, ['imageKey', 'image_key']),
    createdAt: pickOptionalString(r, ['createdAt', 'created_at']),
    expiresAt: pickOptionalString(r, ['expiresAt', 'expires_at']),
  };
}

export function mapClaimRecord(raw: unknown): ClaimRecord | null {
  const r = asRecord(raw);
  if (r === null) return null;
  const id = pickId(r);
  if (id === undefined) return null;
  return {
    id,
    surplusId: pickString(r, ['surplusId', 'surplus_id'], ''),
    servingsClaimed: pickNumber(r, ['servingsClaimed', 'servings_claimed'], 0),
    status: coerceClaimStatus(pickString(r, ['status'], 'reserved')),
    userId: pickOptionalString(r, ['userId', 'user_id']),
    claimId: pickOptionalString(r, ['claimId', 'claim_id']),
    expiresAt: pickOptionalString(r, ['expiresAt', 'expires_at']),
    confirmedAt: pickOptionalString(r, ['confirmedAt', 'confirmed_at']),
    releasedAt: pickOptionalString(r, ['releasedAt', 'released_at']),
    createdAt: pickOptionalString(r, ['createdAt', 'created_at']),
    updatedAt: pickOptionalString(r, ['updatedAt', 'updated_at']),
  };
}

export function mapDonationCenter(raw: unknown): DonationCenter | null {
  const r = asRecord(raw);
  if (r === null) return null;
  const id = pickId(r);
  if (id === undefined) return null;
  const rawCats = pickStringArray(r, ['acceptedDonationCategories', 'accepted_donation_categories']);
  const acceptedDonationCategories =
    rawCats !== undefined ? rawCats.map((c) => coerceDonationCategory(c)) : undefined;
  return {
    id,
    name: pickString(r, ['name'], ''),
    address: pickString(r, ['address'], ''),
    distance: pickString(r, ['distance'], ''),
    acceptsPreparedFood: pickBoolean(r, ['acceptsPreparedFood', 'accepts_prepared_food']),
    acceptedDonationCategories,
    openStatus: pickString(r, ['openStatus', 'open_status'], ''),
    phone: pickString(r, ['phone'], ''),
    description: pickOptionalString(r, ['description']),
    imageKey: pickOptionalString(r, ['imageKey', 'image_key']),
    policyNotes: pickStringArray(r, ['policyNotes', 'policy_notes']),
    hours: pickStringArray(r, ['hours']),
    dropoffInstructions: pickOptionalString(r, ['dropoffInstructions', 'dropoff_instructions']),
    impactLabel: pickOptionalString(r, ['impactLabel', 'impact_label']),
  };
}

export function mapDonationRecord(raw: unknown): DonationRecord | null {
  const r = asRecord(raw);
  if (r === null) return null;
  const id = pickId(r);
  if (id === undefined) return null;
  const category = coerceDonationCategory(pickString(r, ['donationCategory', 'donation_category'], 'prepared_food'));
  return {
    id,
    donationCenterId: pickString(r, ['donationCenterId', 'donation_center_id'], ''),
    donationCategory: category,
    surplusId: pickOptionalString(r, ['surplusId', 'surplus_id']),
    itemDescription: pickOptionalString(r, ['itemDescription', 'item_description']),
    approximateWeightLbs: pickNumber(r, ['approximateWeightLbs', 'approximate_weight_lbs'], 0),
    notes: pickOptionalString(r, ['notes']),
    createdAt: pickString(r, ['createdAt', 'created_at'], ''),
  };
}

export function mapImpact(raw: unknown): Impact | null {
  const r = asRecord(raw);
  if (r === null) return null;
  return {
    servingsClaimed: pickNumber(r, ['servingsClaimed', 'servings_claimed'], 0),
    poundsDonated: pickNumber(r, ['poundsDonated', 'pounds_donated'], 0),
    wasteDivertedPercent: pickNumber(r, ['wasteDivertedPercent', 'waste_diverted_percent'], 0),
    participatingTailgates: pickNumber(r, ['participatingTailgates', 'participating_tailgates'], 0),
    studentPickups: pickNumber(r, ['studentPickups', 'student_pickups'], 0),
    donationCentersSupported: pickNumber(r, ['donationCentersSupported', 'donation_centers_supported'], 0),
  };
}

export function mapRatingRecord(raw: unknown): RatingRecord | null {
  const r = asRecord(raw);
  if (r === null) return null;
  const id = pickId(r);
  if (id === undefined) return null;
  return {
    id,
    tailgateId: pickString(r, ['tailgateId', 'tailgate_id'], ''),
    score: pickNumber(r, ['score'], 0),
    comment: pickOptionalString(r, ['comment']),
    author: pickOptionalString(r, ['author']),
    createdAt: pickOptionalString(r, ['createdAt', 'created_at']),
  };
}
