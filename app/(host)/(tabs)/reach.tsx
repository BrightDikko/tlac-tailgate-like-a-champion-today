import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useGetMeQuery } from '@/src/api/endpoints/authApi';
import { useGetCurrentGameQuery } from '@/src/api/endpoints/gamesApi';
import { useGetSurplusQuery } from '@/src/api/endpoints/surplusApi';
import { useGetTailgatesQuery } from '@/src/api/endpoints/tailgatesApi';
import { selectIsAuthenticated } from '@/src/features/auth/authSelectors';
import { useAppSelector } from '@/src/redux/hooks';
import { API_MODE } from '@/src/services/config/env';
import {
  Card,
  HostBrandedHeader,
  MetricCard,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionHeader,
  StatusChip,
} from '@/src/components';
import type { GamePhase, SurplusItem, Tailgate } from '@/src/types';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import { messageFromUnknownError } from '@/src/utils/errorMessage';
import { formatClockTime, formatDurationMinutes } from '@/src/utils/timeDisplay';

function phaseLabel(phase: GamePhase) {
  return phase === 'postgame' ? 'Post-game' : 'Pregame';
}

function tailgateLocation(tailgate: Tailgate): string {
  const detail = tailgate.locationDetail?.trim();
  if (detail) return detail;
  const zone = tailgate.campusZone?.trim();
  return zone || 'Location TBD';
}

export default function HostReachTabScreen() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const skipProtected = API_MODE === 'remote' && !isAuthenticated;

  const {
    data: currentUser,
    isLoading: meLoading,
    isError: meError,
    error: meErr,
    refetch: refetchMe,
  } = useGetMeQuery(undefined, { skip: skipProtected });

  const {
    data: currentGame,
    isLoading: gameLoading,
    isError: gameError,
    error: gameErr,
    refetch: refetchGame,
  } = useGetCurrentGameQuery();

  const userId = currentUser?.id;

  const {
    data: tailgatesResponse,
    isLoading: tailgatesLoading,
    isError: tailgatesError,
    error: tailgatesErr,
    refetch: refetchTailgates,
  } = useGetTailgatesQuery(userId ? { hostUserId: userId } : undefined, { skip: !userId });

  const {
    data: surplusResponse,
    isLoading: surplusLoading,
    isError: surplusError,
    error: surplusErr,
    refetch: refetchSurplus,
  } = useGetSurplusQuery();

  const hostTailgates = tailgatesResponse?.data ?? [];
  const allSurplus = surplusResponse?.data ?? [];
  const hostTailgateIds = new Set(hostTailgates.map((t) => t.id));
  const hostSurplus = allSurplus.filter((s) => hostTailgateIds.has(s.tailgateId));
  const liveHostSurplus = hostSurplus.filter((s) => s.status === 'available' || s.status === 'almost_gone');

  const activeTailgates = hostTailgates.filter((t) => t.status === 'active');
  const activeCount = activeTailgates.length;
  const liveSurplusCount = liveHostSurplus.length;
  const servingsVisible = liveHostSurplus.reduce((sum, s) => sum + s.servingsRemaining, 0);
  const totalBuzz = hostTailgates.reduce((sum, t) => sum + (t.trendingScore ?? 0), 0);

  const combinedError = (skipProtected ? undefined : meErr) ?? gameErr ?? tailgatesErr ?? surplusErr;
  const hasQueryError =
    (!skipProtected && meError) || (Boolean(userId) && (gameError || tailgatesError || surplusError));
  const queriesLoading =
    (!skipProtected && meLoading) || (Boolean(userId) && (gameLoading || tailgatesLoading || surplusLoading));

  const refetchAll = () => {
    if (!skipProtected) {
      void refetchMe();
    }
    void refetchGame();
    if (userId) {
      void refetchTailgates();
    }
    void refetchSurplus();
  };

  const headerSubtitle = currentGame
    ? `Host · ${phaseLabel(currentGame.phase)} · ${currentGame.matchup}`
    : (!skipProtected && meLoading) || gameLoading
      ? 'Host · Loading gameday…'
      : 'Host · Gameday';

  const showMainContent = !queriesLoading && !hasQueryError;

  return (
    <Screen scroll safeAreaEdges={['top', 'left', 'right']} contentContainerStyle={styles.content}>
      <HostBrandedHeader subtitle={headerSubtitle} />

      <Text style={styles.screenLead}>Reach</Text>
      <Text style={styles.screenLeadMuted}>
        Preview how Student / Fan users find your tailgates, menus, and surplus listings.
      </Text>

      {hasQueryError ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.errorText}>{messageFromUnknownError(combinedError, 'Could not load reach data.')}</Text>
          <SecondaryButton label="Try again" onPress={() => void refetchAll()} style={styles.retryButton} />
        </Card>
      ) : null}

      {queriesLoading && !hasQueryError ? (
        <Card variant="soft">
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading reach data" />
          </View>
        </Card>
      ) : null}

      {showMainContent && !currentUser ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.cardTitle}>Sign in</Text>
          <Text style={styles.cardBody}>
            Sign in with your host account to see how your tailgates and surplus appear to students and fans.
          </Text>
          <PrimaryButton
            label="Sign in"
            onPress={() => router.push({ pathname: '/login', params: { redirectTo: '/dashboard' } })}
            style={styles.retryButton}
          />
        </Card>
      ) : null}

      {showMainContent && currentUser ? (
        <>
          <View style={styles.sectionDivider} />

          <SectionHeader title="Visibility snapshot" subtitle="What Student / Fan surfaces can show right now." />
          <View style={styles.metricsGrid}>
            <MetricCard label="Active tailgates" value={String(activeCount)} style={styles.metricCard} />
            <MetricCard label="Live surplus" value={String(liveSurplusCount)} style={styles.metricCard} />
            <MetricCard label="Servings visible" value={String(servingsVisible)} style={styles.metricCard} />
            <MetricCard label="Total buzz" value={String(totalBuzz)} style={styles.metricCard} />
          </View>

          <Card variant="soft" accentColor={colors.navy}>
            <Text style={styles.cardTitle}>Student / Fan preview</Text>
            <Text style={styles.cardBody}>
              Active tailgates appear in Discover with your hero, menu highlights, and location. Live surplus
              listings appear in the Surplus tab so neighbors can claim servings before availability ends.
            </Text>
            {activeCount === 0 ? (
              <Text style={styles.warningText}>
                No active tailgates are visible in Discover yet. Activate or create a tailgate to improve reach.
              </Text>
            ) : null}
            {liveSurplusCount === 0 ? (
              <Text style={[styles.warningText, activeCount === 0 && styles.warningTextSpaced]}>
                No live surplus is visible in the Surplus feed yet. Publish leftovers when pickup is ready.
              </Text>
            ) : null}
            <View style={styles.buttonStack}>
              <PrimaryButton label="Open Discover" onPress={() => router.push('/discover')} />
              <SecondaryButton label="Open Surplus feed" onPress={() => router.push('/surplus')} />
            </View>
          </Card>

          <View style={styles.sectionDivider} />

          <SectionHeader title="Your visible tailgates" subtitle="Only active listings surface in Discover." />
          {activeTailgates.length > 0 ? (
            <View style={styles.listCol}>
              {activeTailgates.map((tailgate) => (
                <Card key={tailgate.id} variant="soft" style={styles.compactCard}>
                  <View style={styles.compactHeader}>
                    <Text style={styles.compactTitle}>{tailgate.groupName}</Text>
                    <StatusChip status={tailgate.status} showDot />
                  </View>
                  <View style={styles.sectionDivider} />
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={16} color={colors.muted} />
                    <Text style={styles.metaText}>{tailgateLocation(tailgate)}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="star-outline" size={16} color={colors.goldLight} />
                    <Text style={styles.metaText}>
                      {tailgate.rating.toFixed(1)} rating · {tailgate.reviewCount} reviews
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="trending-up-outline" size={16} color={colors.green} />
                    <Text style={styles.metaText}>Trending score {tailgate.trendingScore}</Text>
                  </View>
                  <View style={styles.sectionDivider} />
                  <SecondaryButton
                    label="Preview detail"
                    onPress={() =>
                      router.push({ pathname: '/student/tailgate-detail', params: { tailgateId: tailgate.id } })
                    }
                  />
                </Card>
              ))}
            </View>
          ) : (
            <Card variant="soft" accentColor={colors.navy}>
              <Text style={styles.emptyTitle}>Nothing visible yet</Text>
              <Text style={styles.cardBody}>
                Create or activate a tailgate so students and fans can find you in Discover.
              </Text>
              <PrimaryButton label="Create tailgate" onPress={() => router.push('/create-tailgate')} />
            </Card>
          )}

          <View style={styles.sectionDivider} />

          <SectionHeader title="Live surplus reach" subtitle="Claimable listings in the Student / Fan Surplus tab." />
          {liveHostSurplus.length > 0 ? (
            <View style={styles.listCol}>
              {liveHostSurplus.map((item: SurplusItem) => (
                <Card key={item.id} variant="soft" accentColor={colors.green} style={styles.compactCard}>
                  <View style={styles.compactHeader}>
                    <Text style={styles.compactTitle}>{item.foodName}</Text>
                    <StatusChip status={item.status} showDot />
                  </View>
                  <View style={styles.sectionDivider} />
                  <Text style={styles.surplusGroup}>{item.groupName}</Text>
                  <Text style={styles.surplusMeta}>
                    {item.servingsRemaining} servings · Available until {formatClockTime(item.expiresAt)}
                  </Text>
                  <Text style={styles.surplusMeta}>
                    Pickup window {formatDurationMinutes(item.pickupWindowMinutes ?? 30)}
                  </Text>
                  {item.pickupNote?.trim() ? (
                    <Text style={styles.pickupNote}>{item.pickupNote.trim()}</Text>
                  ) : null}
                </Card>
              ))}
              <SecondaryButton label="Open Surplus feed" onPress={() => router.push('/surplus')} />
            </View>
          ) : (
            <Card variant="soft" accentColor={colors.green}>
              <Text style={styles.emptyTitle}>No surplus currently live</Text>
              <Text style={styles.cardBody}>
                When you publish leftovers, they become claimable in the Student / Fan Surplus tab.
              </Text>
              <PrimaryButton label="Publish surplus" onPress={() => router.push('/publish')} />
            </Card>
          )}

          <View style={styles.sectionDivider} />
          <Card variant="soft">
            <Text style={styles.cardTitle}>Improve your reach</Text>
            <Text style={styles.cardBody}>
              Add clear menu photos, keep at least one tailgate active on gameday, and publish surplus with a clear
              pickup note so neighbors know where to meet you.
            </Text>
            <View style={styles.buttonStack}>
              <PrimaryButton label="Manage dashboard" onPress={() => router.push('/dashboard')} />
              <SecondaryButton label="Donation centers" onPress={() => router.push('/donate')} />
            </View>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  screenLead: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  screenLeadMuted: {
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '600',
    lineHeight: 22,
  },
  loadingBlock: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  errorText: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: spacing.md,
  },
  sectionDivider: {
    marginVertical: spacing.md,
    height: 1,
    backgroundColor: colors.border,
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
  cardTitle: {
    color: colors.goldLight,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  cardBody: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 24,
  },
  warningText: {
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '600',
    lineHeight: 22,
  },
  warningTextSpaced: {
    marginTop: spacing.md,
  },
  buttonStack: {
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  listCol: {
    gap: spacing.lg,
  },
  compactCard: {
    gap: spacing.sm,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  compactTitle: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  metaText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '600',
    lineHeight: 18,
  },
  surplusGroup: {
    color: colors.goldLight,
    fontSize: typography.subheading,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  surplusMeta: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
  pickupNote: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '400',
    lineHeight: 22,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
});
