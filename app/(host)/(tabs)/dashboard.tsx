import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { placeholderImages, tailgateImages } from '@/src/assets/images';
import { useGetMeQuery } from '@/src/api/endpoints/authApi';
import { useGetCurrentGameQuery } from '@/src/api/endpoints/gamesApi';
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
import type { GamePhase, Tailgate, TailgateImageTone } from '@/src/types';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import { messageFromUnknownError } from '@/src/utils/errorMessage';

function phaseLabel(phase: GamePhase) {
  return phase === 'postgame' ? 'Post-game' : 'Pregame';
}

function countByStatus(tailgates: Tailgate[], status: Tailgate['status']) {
  return tailgates.filter((t) => t.status === status).length;
}

const IMAGE_TONE_GRADIENT: Record<TailgateImageTone, { bottom: string }> = {
  stadium: { bottom: '#0B2A4A' },
  goldLot: { bottom: '#5C4300' },
  quad: { bottom: '#1A3324' },
  tailgateClassic: { bottom: '#3A4250' },
  southBendSunset: { bottom: '#4A2640' },
};

function heroOverlayBottom(tailgate: Tailgate): string {
  const tone = tailgate.imageTone;
  if (tone !== undefined && tone in IMAGE_TONE_GRADIENT) {
    return IMAGE_TONE_GRADIENT[tone].bottom;
  }
  return '#0B2A4A';
}

function hostTailgateHeroSource(tailgate: Tailgate): ImageSourcePropType {
  return (
    (tailgate.imageKey ? (tailgateImages as Record<string, ImageSourcePropType>)[tailgate.imageKey] : undefined) ??
    placeholderImages.tailgate
  );
}

export default function HostDashboardTabScreen() {
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
    data: tailgatesListResponse,
    isLoading: tailgatesLoading,
    isError: tailgatesError,
    error: tailgatesErr,
    refetch: refetchTailgates,
  } = useGetTailgatesQuery(userId ? { hostUserId: userId } : undefined, { skip: !userId });

  // Mock mode: host ownership is scoped with hostUserId until real auth-backed ownership exists.
  const hostTailgates = tailgatesListResponse?.data ?? [];

  const combinedQueryError = (skipProtected ? undefined : meErr) ?? gameErr ?? tailgatesErr;
  const hasQueryError = (!skipProtected && meError) || gameError || (Boolean(userId) && tailgatesError);
  const queriesLoading =
    (!skipProtected && meLoading) || (Boolean(userId) && (gameLoading || tailgatesLoading));

  const refetchDashboard = () => {
    if (!skipProtected) {
      void refetchMe();
    }
    void refetchGame();
    if (userId) {
      void refetchTailgates();
    }
  };

  const headerSubtitle = currentGame
    ? `Host · ${phaseLabel(currentGame.phase)} · ${currentGame.matchup}`
    : (!skipProtected && meLoading) || gameLoading
      ? 'Host · Loading gameday…'
      : 'Host · Gameday';

  const activeCount = countByStatus(hostTailgates, 'active');
  const plannedCount = countByStatus(hostTailgates, 'planned');
  const completedCount = countByStatus(hostTailgates, 'completed');

  return (
    <Screen scroll safeAreaEdges={['top', 'left', 'right']} contentContainerStyle={styles.content}>
      <HostBrandedHeader subtitle={headerSubtitle} />

      <View style={styles.statusPill}>
        <Text style={styles.statusDot}>●</Text>
        <Text style={styles.statusPillText}>Host workspace</Text>
      </View>

      <Text style={styles.screenLead}>Dashboard</Text>
      <Text style={styles.screenLeadMuted}>Manage your tailgates, menus, surplus, and donations.</Text>

      {hasQueryError ? (
        <Card variant="soft">
          <Text style={styles.helperCopy}>{messageFromUnknownError(combinedQueryError, 'Could not load dashboard data.')}</Text>
          <SecondaryButton label="Try again" onPress={() => void refetchDashboard()} />
        </Card>
      ) : null}

      {queriesLoading && !hasQueryError ? (
        <Card variant="soft">
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading dashboard" />
          </View>
        </Card>
      ) : null}

      {!queriesLoading && !hasQueryError && skipProtected ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.helperCopy}>Sign in with your host account to manage tailgates and surplus.</Text>
          <PrimaryButton
            label="Sign in"
            onPress={() => router.push({ pathname: '/login', params: { redirectTo: '/dashboard' } })}
            style={styles.emptyCta}
          />
        </Card>
      ) : null}

      {currentGame && !gameError && (!skipProtected ? !meError : true) ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.contextLabel}>Current game</Text>
          <Text style={styles.contextMatchup}>{currentGame.matchup}</Text>
          <Text style={styles.contextMeta}>
            {currentGame.gameDate} · Kickoff {currentGame.kickoffTime}
          </Text>
          <Text style={styles.contextMeta}>
            {currentGame.location} · {currentGame.weather}
          </Text>
        </Card>
      ) : null}

      {!queriesLoading && !hasQueryError && userId ? (
        <>
          <SectionHeader title="Summary" />
          <View style={styles.metricsGrid}>
            <MetricCard label="Tailgates" value={String(hostTailgates.length)} style={styles.metricCard} />
            <MetricCard label="Active" value={String(activeCount)} style={styles.metricCard} />
            <MetricCard label="Planned" value={String(plannedCount)} style={styles.metricCard} />
            <MetricCard label="Completed" value={String(completedCount)} style={styles.metricCard} />
          </View>

          <SectionHeader title="Quick actions" />
          <View style={styles.actionsCol}>
            <PrimaryButton label="Create tailgate" onPress={() => router.push('/create-tailgate')} />
            <SecondaryButton label="Donation centers" onPress={() => router.push('/donate')} />
          </View>

          <SectionHeader
            title="Your tailgates"
            subtitle="Edit details, update the menu, and manage surplus from each tailgate."
          />

          {hostTailgates.length === 0 ? (
            <Card variant="soft" accentColor={colors.navy}>
              <Text style={styles.emptyTitle}>No tailgates yet</Text>
              <Text style={styles.helperCopy}>
                Create your first tailgate to start publishing menus and surplus.
              </Text>
              <Text style={styles.helperCopy}>
                You can still browse other public tailgates from the Student / Fan tabs.
              </Text>
              <PrimaryButton
                label="Create tailgate"
                onPress={() => router.push('/create-tailgate')}
                style={styles.emptyCta}
              />
            </Card>
          ) : (
            <View style={styles.tailgateList}>
              {hostTailgates.map((tailgate) => {
                const overlayTint = heroOverlayBottom(tailgate);
                return (
                  <Card key={tailgate.id} noPadding style={styles.tailgateCard}>
                    <ImageBackground
                      source={hostTailgateHeroSource(tailgate)}
                      style={styles.tailgateHero}
                      resizeMode="cover"
                    >
                      <View style={[styles.tailgateHeroTint, { backgroundColor: overlayTint }]} />
                      <View style={styles.tailgateHeroDim} />
                      <View style={styles.tailgateHeroInner}>
                        <View style={styles.tailgateHeroTop}>
                          <StatusChip status={tailgate.status} />
                          <View style={styles.distancePill}>
                            <Ionicons name="navigate-outline" size={14} color={colors.goldLight} />
                            <Text style={styles.distancePillText}>{tailgate.distance}</Text>
                          </View>
                        </View>
                        <View>
                          <Text style={styles.tailgateHeroTitle} numberOfLines={2}>
                            {tailgate.groupName}
                          </Text>
                          <View style={styles.heroRatingRow}>
                            <Ionicons name="star" size={16} color="#F4C633" />
                            <Text style={styles.heroRatingText}>
                              {tailgate.rating.toFixed(1)} · {tailgate.reviewCount} reviews
                            </Text>
                          </View>
                        </View>
                      </View>
                    </ImageBackground>
                    <View style={styles.tailgateCardBody}>
                      <View style={styles.tailgateInfoStack}>
                        <Text style={styles.tailgateMeta}>{tailgate.groupType}</Text>

                        <View style={styles.infoRow}>
                          <View style={styles.infoIconCircle}>
                            <Ionicons name="location-outline" size={15} color={colors.goldLight} />
                          </View>
                          <Text style={styles.infoText} numberOfLines={2}>
                            {tailgate.locationDetail}
                          </Text>
                        </View>

                        <View style={styles.infoRow}>
                          <View style={styles.hostAvatarMini}>
                            <Text style={styles.hostAvatarMiniText}>
                              {(
                                tailgate.avatarInitials ??
                                (tailgate.hostName.slice(0, 2) || 'TL')
                              )
                                .toUpperCase()
                                .slice(0, 2)}
                            </Text>
                          </View>
                          <Text style={styles.infoText} numberOfLines={1}>
                            Hosted by {tailgate.hostName}
                          </Text>
                        </View>

                        <View style={styles.attendancePill}>
                          <Ionicons name="people-outline" size={16} color={colors.textInverse} />
                          <Text style={styles.attendancePillText}>
                            {tailgate.attendeeEstimate}+ attending
                          </Text>
                        </View>
                      </View>

                      {tailgate.tags.length > 0 ? (
                        <View style={styles.tagsRow}>
                          {tailgate.tags.map((tag) => (
                            <View key={tag} style={styles.tagChip}>
                              <Text style={styles.tagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}

                      <View style={styles.tailgateActions}>
                        <PrimaryButton
                          label="Edit tailgate"
                          onPress={() =>
                            router.push({
                              pathname: '/edit-tailgate',
                              params: { tailgateId: tailgate.id },
                            })
                          }
                        />
                        <SecondaryButton
                          label="Manage tailgate"
                          onPress={() =>
                            router.push({
                              pathname: '/tailgate-manage',
                              params: { tailgateId: tailgate.id },
                            })
                          }
                        />
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
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
  statusPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  statusDot: {
    color: colors.goldLight,
    fontSize: 12,
    fontWeight: '900',
  },
  statusPillText: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
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
    marginTop: spacing.xs,
  },
  contextLabel: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contextMatchup: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  contextMeta: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '600',
  },
  helperCopy: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: typography.body,
  },
  loadingBlock: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
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
  actionsCol: {
    gap: spacing.sm,
  },
  tailgateList: {
    gap: spacing.md,
  },
  tailgateCard: {
    borderColor: colors.border,
  },
  tailgateHero: {
    height: 168,
    overflow: 'hidden',
  },
  tailgateHeroTint: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22,
  },
  tailgateHeroDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  tailgateHeroInner: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  tailgateHeroTop: {
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(2, 11, 21, 0.76)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  distancePillText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  tailgateHeroTitle: {
    zIndex: 1,
    color: colors.white,
    fontSize: typography.subheading,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroRatingRow: {
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  heroRatingText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  tailgateCardBody: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  tailgateInfoStack: {
    gap: spacing.md,
  },
  tailgateMeta: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
    lineHeight: 22,
  },
  hostAvatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
  },
  hostAvatarMiniText: {
    color: colors.textInverse,
    fontSize: typography.caption,
    fontWeight: '900',
  },
  attendancePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(244, 197, 66, 0.42)',
  },
  attendancePillText: {
    color: colors.textInverse,
    fontSize: typography.caption,
    fontWeight: '900',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagChip: {
    borderRadius: 999,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  tagText: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  tailgateActions: {
    gap: spacing.sm,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  emptyCta: {
    marginTop: spacing.md,
  },
});
