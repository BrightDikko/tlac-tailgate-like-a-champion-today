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

function nonEmptyOr(value: string | undefined, fallback: string): string {
  if (value !== undefined && value.trim().length > 0) return value;
  return fallback;
}

function nestedRecord(obj: Record<string, unknown>, key: string): Record<string, unknown> | null {
  return asRecord(obj[key]);
}

function deriveFeaturedMenuItems(r: Record<string, unknown>): string[] | undefined {
  const direct = pickStringArray(r, ['featuredMenuItems', 'featured_menu_items']);
  if (direct !== undefined && direct.length > 0) return direct;
  const menu = (r.menuItems ?? r.menu_items) as unknown;
  if (!Array.isArray(menu)) return undefined;
  const names: string[] = [];
  for (const row of menu) {
    const rr = asRecord(row);
    if (rr === null) continue;
    const name = pickOptionalString(rr, ['name']);
    if (name !== undefined && name.trim().length > 0) {
      names.push(name);
    }
    if (names.length >= 3) break;
  }
  return names.length > 0 ? names : undefined;
}

function deriveSurplusMinutesLeft(r: Record<string, unknown>): number {
  const direct = pickNumber(r, ['minutesLeft', 'minutes_left'], 0);
  if (direct > 0) return direct;
  const expiresAt = pickOptionalString(r, ['expiresAt', 'expires_at']);
  if (expiresAt === undefined) return direct;
  const expiresMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresMs)) return direct;
  return Math.max(0, Math.ceil((expiresMs - Date.now()) / 60000));
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
  const tokensNested = r.tokens ?? r.token ?? r.tokens_data;
  const tokens = mapAuthTokens(tokensNested) ?? mapAuthTokens(r);
  const user = mapCurrentUser(userRaw);
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
  const host = nestedRecord(r, 'host');
  const featuredMenuItems = deriveFeaturedMenuItems(r) ?? [];
  return {
    id,
    createdAt: pickOptionalString(r, ['createdAt', 'created_at']),
    updatedAt: pickOptionalString(r, ['updatedAt', 'updated_at']),
    groupName: nonEmptyOr(
      pickOptionalString(r, ['groupName', 'group_name', 'name', 'title']),
      'Tailgate'
    ),
    groupType: nonEmptyOr(
      pickOptionalString(r, ['groupType', 'group_type', 'type']),
      'Host tailgate'
    ),
    hostName: nonEmptyOr(
      pickOptionalString(r, ['hostName', 'host_name']) ??
        (host ? pickOptionalString(host, ['displayName', 'display_name']) : undefined),
      'Host'
    ),
    description: nonEmptyOr(
      pickOptionalString(r, ['description']),
      'Tailgate details coming soon.'
    ),
    locationDetail: nonEmptyOr(
      pickOptionalString(r, ['locationDetail', 'location_detail', 'location', 'address']),
      'Location pending'
    ),
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
    featuredMenuItems,
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
  const tailgate = nestedRecord(r, 'tailgate');
  const nestedTailgateId = tailgate ? pickOptionalString(tailgate, ['id']) : undefined;
  return {
    id,
    tailgateId: pickString(r, ['tailgateId', 'tailgate_id'], nestedTailgateId ?? ''),
    name: pickString(r, ['name'], ''),
    category: coerceFoodCategory(pickString(r, ['category'], 'entree')),
    description: pickString(r, ['description'], ''),
    quantityPrepared: pickNumber(
      r,
      ['quantityPrepared', 'quantity_prepared', 'quantity', 'servingsPrepared', 'servings_prepared'],
      0
    ),
    imageKey: pickOptionalString(r, ['imageKey', 'image_key']),
  };
}

export function mapSurplusItem(raw: unknown): SurplusItem | null {
  const r = asRecord(raw);
  if (r === null) return null;
  const id = pickId(r);
  if (id === undefined) return null;
  const tailgate = nestedRecord(r, 'tailgate');
  const foodItem = nestedRecord(r, 'foodItem') ?? nestedRecord(r, 'food_item');
  const tailgateId =
    pickOptionalString(r, ['tailgateId', 'tailgate_id']) ??
    (tailgate ? pickOptionalString(tailgate, ['id']) : undefined) ??
    '';
  const foodName =
    pickOptionalString(r, ['foodName', 'food_name']) ??
    (foodItem ? pickOptionalString(foodItem, ['name']) : undefined);
  const groupName =
    pickOptionalString(r, ['groupName', 'group_name']) ??
    (tailgate
      ? pickOptionalString(tailgate, ['groupName', 'group_name', 'name', 'title'])
      : undefined);
  const location =
    pickOptionalString(r, ['location']) ??
    (tailgate
      ? pickOptionalString(tailgate, ['locationDetail', 'location_detail', 'location'])
      : undefined);
  const pickupNote = pickOptionalString(r, ['pickupNote', 'pickup_note', 'note']);
  return {
    id,
    tailgateId,
    foodItemId: pickOptionalString(r, ['foodItemId', 'food_item_id']),
    foodName: nonEmptyOr(foodName, 'Surplus item'),
    groupName: nonEmptyOr(groupName, 'Host listing'),
    location: nonEmptyOr(location, 'Pickup location pending'),
    servingsRemaining: pickNumber(r, ['servingsRemaining', 'servings_remaining'], 0),
    minutesLeft: deriveSurplusMinutesLeft(r),
    status: coerceSurplusStatus(pickString(r, ['status'], 'available')),
    pickupNote: nonEmptyOr(pickupNote, 'Check with host at pickup.'),
    claimId: pickOptionalString(r, ['claimId', 'claim_id']),
    imageKey: pickOptionalString(r, ['imageKey', 'image_key']),
    createdAt: pickOptionalString(r, ['createdAt', 'created_at']),
    expiresAt: pickOptionalString(r, ['expiresAt', 'expires_at']),
    pickupWindowMinutes: pickNumber(r, ['pickupWindowMinutes', 'pickup_window_minutes'], 30),
  };
}

export function mapClaimRecord(raw: unknown): ClaimRecord | null {
  const r = asRecord(raw);
  if (r === null) return null;
  const id = pickId(r);
  if (id === undefined) return null;
  const surplus = nestedRecord(r, 'surplus');
  const surplusId =
    pickOptionalString(r, ['surplusId', 'surplus_id']) ??
    (surplus ? pickOptionalString(surplus, ['id']) : undefined) ??
    '';
  return {
    id,
    surplusId,
    servingsClaimed: pickNumber(r, ['servingsClaimed', 'servings_claimed', 'quantity', 'servings'], 0),
    status: coerceClaimStatus(pickString(r, ['status'], 'reserved')),
    userId: pickOptionalString(r, ['userId', 'user_id']),
    claimId: pickOptionalString(r, ['claimId', 'claim_id', 'publicClaimId', 'public_claim_id', 'code']),
    expiresAt: pickOptionalString(r, ['expiresAt', 'expires_at', 'expires', 'pickupExpiresAt', 'pickup_expires_at']),
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
