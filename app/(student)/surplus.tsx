import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useClaimSurplusMutation, useGetMyClaimsQuery } from '@/src/api/endpoints/claimsApi';
import { useGetCurrentGameQuery } from '@/src/api/endpoints/gamesApi';
import { useGetSurplusQuery } from '@/src/api/endpoints/surplusApi';
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

function surplusErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const d = (err as { data: unknown }).data;
    if (d && typeof d === 'object' && d !== null && 'message' in d) {
      return String((d as { message: string }).message);
    }
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return 'Could not load surplus items.';
}

function isClaimable(item: SurplusItem): boolean {
  return (
    (item.status === 'available' || item.status === 'almost_gone') &&
    item.servingsRemaining > 0 &&
    item.minutesLeft > 0
  );
}

function pickupHintFor(claim: ClaimRecord, item?: SurplusItem): string {
  if (claim.expiresAt) {
    const expiresMs = new Date(claim.expiresAt).getTime();
    if (!Number.isNaN(expiresMs)) {
      const remaining = Math.max(0, Math.round((expiresMs - Date.now()) / 60000));
      return remaining > 0 ? `Pickup window ends in about ${remaining} min` : 'Pickup window is ending now';
    }
  }
  if (item && item.minutesLeft > 0) {
    return `Host window shows about ${item.minutesLeft} min left`;
  }
  return 'Open timer to confirm pickup status';
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
  } = useGetMyClaimsQuery();

  const surplusItems = surplusResponse?.data ?? [];
  const claims = claimsResponse ?? [];
  const activeClaims = claims.filter((c) => c.status === 'reserved');
  const completedClaims = claims.filter((c) => c.status === 'confirmed');
  const releasedClaims = claims.filter((c) => c.status === 'released');
  const claimableSurplus = surplusItems.filter(isClaimable);
  const claimsBySurplusId = new Map(activeClaims.map((c) => [c.surplusId, c]));

  const [claimSurplus, { isLoading: isClaiming, error: claimError, reset: resetClaimError }] =
    useClaimSurplusMutation();
  const [selectedFilter, setSelectedFilter] = useState<SurplusFilter>('available');
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [claimingSurplusId, setClaimingSurplusId] = useState<string | null>(null);

  const filteredSurplus = surplusItems
    .filter((item) => {
      if (selectedFilter === 'available') return item.status === 'available' && isClaimable(item);
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

  const servingsLive = claimableSurplus.reduce((sum, item) => sum + item.servingsRemaining, 0);
  const queriesLoading = gameLoading || surplusLoading || claimsLoading;
  const hasQueryError = gameError || surplusError || claimsError;
  const combinedError = gameErr ?? surplusErr ?? claimsErr;

  const refetchAll = () => {
    void refetchGame();
    void refetchSurplus();
    void refetchClaims();
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

      <Card variant="soft">
        <Text style={styles.contextLabel}>
          {currentGame ? `${phaseLabel(currentGame.phase)} · ${currentGame.matchup}` : 'Gameday context'}
        </Text>
        <Text style={styles.contextTitle}>Surplus pickup phase</Text>
        <Text style={styles.contextCopy}>
          Reserve available servings, then track your pickup window from this tab.
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
          <Text style={styles.errorText}>{surplusErrorMessage(combinedError)}</Text>
          <SecondaryButton label="Try again" onPress={() => void refetchAll()} style={styles.retryButton} />
        </Card>
      ) : (
        <>
          <SectionHeader title="Your pickups" subtitle="Reserved claims waiting for pickup confirmation." />
          {activeClaims.length > 0 ? (
            <View style={styles.list}>
              {activeClaims.map((claim) => {
                const item = surplusItems.find((s) => s.id === claim.surplusId);
                return (
                  <Card key={claim.id} variant="soft">
                    <View style={styles.pickupHeader}>
                      <Text style={styles.pickupTitle}>{item?.foodName ?? 'Reserved surplus item'}</Text>
                      <StatusChip status="available" label="Reserved" showDot />
                    </View>
                    <Text style={styles.pickupGroup}>{item?.groupName ?? 'Host listing'}</Text>
                    <Text style={styles.pickupMeta}>Claim ID {claim.claimId ?? claim.id}</Text>
                    <Text style={styles.pickupMeta}>
                      {claim.servingsClaimed} serving{claim.servingsClaimed === 1 ? '' : 's'} claimed
                    </Text>
                    {item?.pickupNote ? <Text style={styles.pickupNote}>Pickup note: {item.pickupNote}</Text> : null}
                    {item?.location ? <Text style={styles.pickupLocation}>{item.location}</Text> : null}
                    <Text style={styles.pickupHint}>{pickupHintFor(claim, item)}</Text>
                    <View style={styles.buttonStack}>
                      <PrimaryButton
                        label="Open pickup timer"
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
                      <SecondaryButton label="Release claim" disabled />
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

          <SectionHeader title="Find surplus" subtitle="Reserve what is still available nearby." />
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
            Claiming reserves one serving per listing. Your reservation appears in Your pickups until you confirm or
            release it.
          </Text>

          {claimError ? (
            <Card variant="soft" accentColor={colors.navy}>
              <Text style={styles.claimErrorText}>{surplusErrorMessage(claimError)}</Text>
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
                      ? 'Pickup window has ended for this listing.'
                      : item.servingsRemaining <= 0
                        ? 'No servings left to claim.'
                        : 'This listing is not currently claimable.';

                return (
                  <SurplusCard
                    key={item.id}
                    item={item}
                    claimLabel={hasExistingClaim ? 'Open pickup timer' : 'Claim servings'}
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
  list: {
    gap: spacing.md,
  },
  pickupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  pickupTitle: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  pickupGroup: {
    marginTop: spacing.sm,
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  pickupMeta: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  pickupNote: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  pickupLocation: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  pickupHint: {
    marginTop: spacing.sm,
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  buttonStack: {
    marginTop: spacing.md,
    gap: spacing.sm,
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
