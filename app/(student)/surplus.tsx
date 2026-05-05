import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useClaimSurplusMutation, useGetMyClaimsQuery, useReleaseClaimMutation } from '@/src/api/endpoints/claimsApi';
import { useGetCurrentGameQuery } from '@/src/api/endpoints/gamesApi';
import { useGetSurplusQuery } from '@/src/api/endpoints/surplusApi';
import { selectIsAuthenticated } from '@/src/features/auth/authSelectors';
import { useAppSelector } from '@/src/redux/hooks';
import { API_MODE } from '@/src/services/config/env';
import {
  AppHeader,
  Card,
  FilterChip,
  MetricCard,
  PrimaryButton,
  Screen,
  SearchBar,
  SectionHeader,
  SecondaryButton,
  StatusChip,
  SurplusCard,
} from '@/src/components';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import type { ClaimRecord, GamePhase, SurplusItem } from '@/src/types';
import { messageFromUnknownError } from '@/src/utils/errorMessage';
import { paramOne } from '@/src/utils/routeParams';
import { formatClockTime, formatDurationMinutes, minutesUntil } from '@/src/utils/timeDisplay';

type SurplusFilter = 'available' | 'almost_gone' | 'my_pickups' | 'claimed' | 'all';

const FILTER_OPTIONS: { key: SurplusFilter; label: string }[] = [
  { key: 'available', label: 'Available' },
  { key: 'almost_gone', label: 'Almost gone' },
  { key: 'my_pickups', label: 'My pickups' },
  { key: 'claimed', label: 'Claimed' },
  { key: 'all', label: 'All' },
];

function phaseLabel(phase: GamePhase) {
  return phase === 'postgame' ? 'Post-game' : 'Pregame';
}

function isClaimable(item: SurplusItem): boolean {
  return (
    (item.status === 'available' || item.status === 'almost_gone') &&
    item.servingsRemaining > 0 &&
    item.minutesLeft > 0
  );
}

function matchesQuery(item: SurplusItem, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return (
    item.foodName.toLowerCase().includes(normalized) ||
    item.groupName.toLowerCase().includes(normalized) ||
    item.location.toLowerCase().includes(normalized) ||
    item.pickupNote.toLowerCase().includes(normalized)
  );
}

export default function SurplusTabScreen() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const skipClaimsQuery = API_MODE === 'remote' && !isAuthenticated;
  const searchParams = useLocalSearchParams();
  const focusSurplusId = paramOne(searchParams.focusSurplusId) ?? paramOne(searchParams.claimSurplusId);
  const showPostAuthClaimHint = isAuthenticated && Boolean(focusSurplusId);

  const {
    data: currentGame,
    isLoading: gameLoading,
    isError: gameError,
    error: gameErr,
    refetch: refetchGame,
  } = useGetCurrentGameQuery();

  const {
    data: surplusResponse,
    isLoading: surplusLoading,
    isError: surplusError,
    error: surplusErr,
    refetch: refetchSurplus,
  } = useGetSurplusQuery();

  const {
    data: claimsResponse,
    isLoading: claimsLoading,
    isError: claimsError,
    error: claimsErr,
    refetch: refetchClaims,
  } = useGetMyClaimsQuery(undefined, { skip: skipClaimsQuery });

  const surplusItems = surplusResponse?.data ?? [];
  const claims = skipClaimsQuery ? [] : (claimsResponse ?? []);
  const activeClaims = claims.filter((c) => c.status === 'reserved');
  const completedClaims = claims.filter((c) => c.status === 'confirmed');
  const releasedClaims = claims.filter((c) => c.status === 'released');
  const claimableSurplus = surplusItems.filter(isClaimable);
  const claimsBySurplusId = new Map(activeClaims.map((c) => [c.surplusId, c]));

  const [claimSurplus, { isLoading: isClaiming, error: claimError, reset: resetClaimError }] =
    useClaimSurplusMutation();
  const [releaseClaim, { isLoading: isReleasingClaim, error: releaseClaimError, reset: resetReleaseClaimError }] =
    useReleaseClaimMutation();
  const [selectedFilter, setSelectedFilter] = useState<SurplusFilter>('available');
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [claimingSurplusId, setClaimingSurplusId] = useState<string | null>(null);
  const [releasingClaimId, setReleasingClaimId] = useState<string | null>(null);

  const filteredSurplus = surplusItems
    .filter((item) => {
      if (selectedFilter === 'available') return isClaimable(item);
      if (selectedFilter === 'almost_gone') return item.status === 'almost_gone' && isClaimable(item);
      if (selectedFilter === 'my_pickups') return claimsBySurplusId.has(item.id);
      if (selectedFilter === 'claimed') {
        return (
          item.status === 'claimed' ||
          completedClaims.some((claim) => claim.surplusId === item.id) ||
          releasedClaims.some((claim) => claim.surplusId === item.id)
        );
      }
      return true;
    })
    .filter((item) => matchesQuery(item, query));

  const handleClaimPress = async (item: SurplusItem) => {
    if (API_MODE === 'remote' && !isAuthenticated) {
      router.push({
        pathname: '/login',
        params: {
          redirectTo: '/surplus',
          intent: 'claimSurplus',
          surplusId: item.id,
        },
      });
      return;
    }

    const existingClaim = claimsBySurplusId.get(item.id);
    if (existingClaim) {
      router.push({
        pathname: '/student/pickup-timer',
        params: {
          claimRecordId: existingClaim.id,
          claimId: existingClaim.claimId ?? '',
          surplusId: existingClaim.surplusId,
          servingsClaimed: String(existingClaim.servingsClaimed),
        },
      });
      return;
    }

    resetClaimError();
    setClaimingSurplusId(item.id);
    try {
      const claim = await claimSurplus({
        surplusId: item.id,
        input: { surplusId: item.id, servingsClaimed: 1 },
      }).unwrap();
      router.push({
        pathname: '/student/pickup-timer',
        params: {
          claimRecordId: claim.id,
          claimId: claim.claimId ?? '',
          surplusId: claim.surplusId,
          servingsClaimed: String(claim.servingsClaimed),
        },
      });
    } catch {
      // Mutation error is surfaced via claimError
    } finally {
      setClaimingSurplusId(null);
    }
  };

  const performReleaseClaim = async (claim: ClaimRecord) => {
    resetReleaseClaimError();
    setReleasingClaimId(claim.id);
    try {
      await releaseClaim({ id: claim.id }).unwrap();
      if (!skipClaimsQuery) {
        void refetchClaims();
      }
      void refetchSurplus();
    } catch {
      // surfaced via releaseClaimError
    } finally {
      setReleasingClaimId(null);
    }
  };

  const servingsLive = claimableSurplus.reduce((sum, item) => sum + item.servingsRemaining, 0);
  const queriesLoading = gameLoading || surplusLoading || (!skipClaimsQuery && claimsLoading);
  const hasQueryError =
    gameError || surplusError || (!skipClaimsQuery && claimsError);
  const combinedError = gameErr ?? surplusErr ?? (skipClaimsQuery ? undefined : claimsErr);

  const refetchAll = () => {
    void refetchGame();
    void refetchSurplus();
    if (!skipClaimsQuery) {
      void refetchClaims();
    }
  };

  return (
    <Screen scroll safeAreaEdges={['top', 'left', 'right']} contentContainerStyle={styles.content}>
      <AppHeader
        title="Surplus"
        subtitle="Reserve servings · Track pickups"
        rightAction={
          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            style={styles.iconHit}
            onPress={() => setShowFilters((prev) => !prev)}
          >
            <Ionicons name="funnel-outline" size={22} color={colors.text} />
          </Pressable>
        }
      />

      {showPostAuthClaimHint ? (
        <Card variant="soft" accentColor={colors.gold}>
          <Text style={styles.contextCopy}>
            You’re signed in. Find this listing below and tap Claim Servings.
          </Text>
        </Card>
      ) : null}

      <Card variant="soft">
        <Text style={styles.contextLabel}>
          {currentGame ? `${phaseLabel(currentGame.phase)} · ${currentGame.matchup}` : 'Gameday context'}
        </Text>
        <Text style={styles.contextTitle}>Surplus pickup phase</Text>
        <Text style={styles.contextCopy}>
          Reserve available servings, then track your reservation pickup deadline from this tab.
        </Text>
      </Card>

      <View style={styles.metricsGrid}>
        <MetricCard label="Available listings" value={String(claimableSurplus.length)} style={styles.metricCard} />
        <MetricCard label="Your pickups" value={String(activeClaims.length)} style={styles.metricCard} />
        <MetricCard label="Servings live" value={String(servingsLive)} style={styles.metricCard} />
        <MetricCard label="Completed" value={String(completedClaims.length)} style={styles.metricCard} />
      </View>

      {queriesLoading ? (
        <Card variant="soft">
          <View style={styles.stateBlock} accessibilityLabel="Loading surplus context">
            <ActivityIndicator size="large" color={colors.goldLight} />
          </View>
        </Card>
      ) : hasQueryError ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.errorText}>{messageFromUnknownError(combinedError, 'Could not load surplus items.')}</Text>
          <SecondaryButton label="Try again" onPress={() => void refetchAll()} style={styles.retryButton} />
        </Card>
      ) : (
        <>
          <View style={styles.sectionDivider} />

          <SectionHeader
              title="Your pickups"
              subtitle="Claim reservations with pickup deadlines after you claim."
              style={styles.spaceUpTop}
          />
          {activeClaims.length > 0 ? (
            <View style={styles.list}>
              {activeClaims.map((claim) => {
                const item = surplusItems.find((s) => s.id === claim.surplusId);
                const timeLeftMinutes = minutesUntil(claim.expiresAt);
                return (
                  <Card key={claim.id} variant="soft" accentColor={colors.green} style={styles.pickupCard}>
                    <View style={styles.pickupHeader}>
                      <View style={styles.pickupHeaderText}>
                        <Text style={styles.pickupFoodName}>{item?.foodName ?? 'Reserved surplus item'}</Text>
                        <Text style={styles.pickupGroupName}>{item?.groupName ?? 'Host listing'}</Text>
                      </View>
                      <StatusChip status="available" label="Reserved" showDot />
                    </View>

                    <View style={styles.pickupDetailRow}>
                      <Text style={styles.pickupDetailLabel}>Servings reserved</Text>
                      <Text style={styles.pickupDetailValue}>
                        {claim.servingsClaimed} serving{claim.servingsClaimed === 1 ? '' : 's'}
                      </Text>
                    </View>
                    <View style={styles.pickupDetailRow}>
                      <Text style={styles.pickupDetailLabel}>Pickup deadline</Text>
                      <Text style={styles.pickupDetailValue}>{formatClockTime(claim.expiresAt)}</Text>
                    </View>
                    <View style={styles.pickupDetailRow}>
                      <Text style={styles.pickupDetailLabel}>Hold window</Text>
                      <Text style={styles.pickupDetailValue}>
                        {timeLeftMinutes !== null ? `${formatDurationMinutes(timeLeftMinutes)} left` : 'Deadline unavailable'}
                      </Text>
                    </View>

                    <View style={styles.pickupDivider} />

                    {item?.pickupNote ? (
                      <View style={styles.pickupInfoBlock}>
                        <Text style={styles.pickupInfoLabel}>Pickup note</Text>
                        <Text style={styles.pickupInfoValue}>{item.pickupNote}</Text>
                      </View>
                    ) : null}
                    {claim.claimId ? (
                      <View style={styles.pickupInfoBlock}>
                        <Text style={styles.pickupInfoLabel}>Claim ID</Text>
                        <Text style={styles.pickupInfoValue}>{claim.claimId}</Text>
                      </View>
                    ) : null}

                    <View style={styles.pickupDivider} />

                    <View style={styles.pickupActions}>
                      <PrimaryButton
                        label="Open pickup timer"
                        size="md"
                        onPress={() =>
                          router.push({
                            pathname: '/student/pickup-timer',
                            params: {
                              claimRecordId: claim.id,
                              claimId: claim.claimId ?? '',
                              surplusId: claim.surplusId,
                              servingsClaimed: String(claim.servingsClaimed),
                            },
                          })
                        }
                      />
                      <SecondaryButton
                        label={isReleasingClaim && releasingClaimId === claim.id ? 'Releasing…' : 'Release claim'}
                        onPress={() => void performReleaseClaim(claim)}
                        disabled={isReleasingClaim}
                      />
                    </View>
                  </Card>
                );
              })}
            </View>
          ) : (
            <Card variant="soft">
              <Text style={styles.emptyTitle}>No pickups waiting</Text>
              <Text style={styles.emptyBody}>
                Claim a surplus item below and it will appear here until you confirm pickup.
              </Text>
            </Card>
          )}

          <View style={styles.sectionDivider} />

          <SectionHeader
              title="Find surplus"
              subtitle="Listing times show how long each surplus stays claimable."
              style={styles.spaceUpTop}
          />
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search food, host, location"
            onClear={() => setQuery('')}
          />

          {showFilters ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
              {FILTER_OPTIONS.map((option) => (
                <FilterChip
                  key={option.key}
                  label={option.label}
                  selected={selectedFilter === option.key}
                  onPress={() => setSelectedFilter(option.key)}
                />
              ))}
            </ScrollView>
          ) : null}

          <Text style={styles.helperCopy}>
            Listing time left is claim availability. Your reservation pickup deadline appears in Your pickups until you confirm or
            release it.
          </Text>

          {claimError ? (
            <Card variant="soft" accentColor={colors.navy}>
              <Text style={styles.claimErrorText}>{messageFromUnknownError(claimError, 'Could not load surplus items.')}</Text>
            </Card>
          ) : null}
          {releaseClaimError ? (
            <Card variant="soft" accentColor={colors.navy}>
              <Text style={styles.claimErrorText}>
                {messageFromUnknownError(releaseClaimError, 'Could not release claim.')}
              </Text>
            </Card>
          ) : null}

          {surplusItems.length === 0 ? (
            <Card variant="soft">
              <Text style={styles.emptyTitle}>No surplus posted yet</Text>
              <Text style={styles.emptyBody}>
                Hosts usually publish leftovers when serving windows close. Check back after the game or browse
                Discover.
              </Text>
              <PrimaryButton label="Browse tailgates" onPress={() => router.push('/discover')} />
            </Card>
          ) : filteredSurplus.length === 0 ? (
            <Card variant="soft">
              <Text style={styles.emptyTitle}>No matches</Text>
              <Text style={styles.emptyBody}>Try another filter or clear your search.</Text>
              {query.length > 0 ? (
                <SecondaryButton label="Clear search" onPress={() => setQuery('')} />
              ) : null}
            </Card>
          ) : (
            <View style={styles.list}>
              {filteredSurplus.map((item) => {
                const activeClaim = claimsBySurplusId.get(item.id);
                const hasExistingClaim = activeClaim !== undefined;
                const claimable = isClaimable(item);

                const disabledReason =
                  hasExistingClaim || claimable || selectedFilter === 'all' || selectedFilter === 'claimed'
                    ? undefined
                    : item.minutesLeft <= 0
                      ? 'Listing is no longer claimable.'
                      : item.servingsRemaining <= 0
                        ? 'No servings left to claim.'
                        : 'This listing is not currently claimable.';

                return (
                  <SurplusCard
                    key={item.id}
                    item={item}
                    claimLabel={hasExistingClaim ? 'Open pickup timer' : 'Reserve serving'}
                    onClaimPress={() => void handleClaimPress(item)}
                    claimDisabled={
                      isClaiming && claimingSurplusId !== null && claimingSurplusId !== item.id
                        ? false
                        : isClaiming && claimingSurplusId === item.id
                    }
                    disabledReason={disabledReason}
                  />
                );
              })}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  iconHit: {
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    alignItems: 'flex-end',
  },
  contextLabel: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  contextTitle: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  contextCopy: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: typography.body,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    width: '48%',
    minWidth: 0,
  },
  helperCopy: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '700',
    lineHeight: 18,
  },
  filtersRow: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  spaceUpTop: {
    marginTop: spacing.xl
  },
  list: {
    gap: spacing.md,
  },
  pickupCard: {
    gap: spacing.sm,
  },
  pickupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  pickupHeaderText: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  pickupFoodName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  pickupGroupName: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  sectionDivider: {
    marginTop: spacing.xxl,
    height: 1,
    backgroundColor: colors.border,
  },
  pickupDivider: {
    marginTop: spacing.sm,
    height: 1,
    backgroundColor: colors.border,
  },
  pickupInfoBlock: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  pickupInfoLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  pickupInfoValue: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 20,
    fontWeight: '600',
  },
  pickupActions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  pickupDetailRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'center',
  },
  pickupDetailLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  pickupDetailValue: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  stateBlock: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.muted,
    fontSize: typography.body,
  },
  retryButton: {
    marginTop: spacing.md,
  },
  claimErrorText: {
    color: colors.muted,
    fontSize: typography.body,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  emptyBody: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
