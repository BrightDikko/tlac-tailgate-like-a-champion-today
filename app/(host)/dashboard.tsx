import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useGetCurrentGameQuery } from '@/src/api/endpoints/gamesApi';
import { useGetMenuByTailgateIdQuery } from '@/src/api/endpoints/menuApi';
import { useGetTailgateByIdQuery } from '@/src/api/endpoints/tailgatesApi';
import {
  Card,
  FoodItemCard,
  HostBrandedHeader,
  MetricCard,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionHeader,
  StatusChip,
} from '@/src/components';
import type { GamePhase } from '@/src/types';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

const HOST_TAILGATE_ID = 'event-1';

function phaseLabel(phase: GamePhase) {
  return phase === 'postgame' ? 'Post-game' : 'Pregame';
}

function dashboardErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const d = (err as { data: unknown }).data;
    if (d && typeof d === 'object' && d !== null && 'message' in d) {
      return String((d as { message: string }).message);
    }
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return 'Could not load dashboard data.';
}

export default function HostDashboardTabScreen() {
  const {
    data: currentGame,
    isLoading: gameLoading,
    isError: gameError,
    error: gameErr,
    refetch: refetchGame,
  } = useGetCurrentGameQuery();

  const {
    data: hostTailgate,
    isLoading: tailgateLoading,
    isError: tailgateError,
    error: tailgateErr,
    refetch: refetchTailgate,
  } = useGetTailgateByIdQuery(HOST_TAILGATE_ID);

  const {
    data: menuResponse,
    isLoading: menuLoading,
    isError: menuError,
    error: menuErr,
    refetch: refetchMenu,
  } = useGetMenuByTailgateIdQuery({ tailgateId: HOST_TAILGATE_ID });

  const hostMenu = menuResponse?.data ?? [];
  const isLoading = gameLoading || tailgateLoading || menuLoading;
  const isError = gameError || tailgateError || menuError;
  const combinedError = gameErr ?? tailgateErr ?? menuErr;

  const metaLine = currentGame
    ? `${currentGame.gameDate} · Kickoff ${currentGame.kickoffTime}`
    : '';

  const refetchDashboard = () => {
    void refetchGame();
    void refetchTailgate();
    void refetchMenu();
  };

  const headerSubtitle = currentGame
    ? `Host · ${phaseLabel(currentGame.phase)} · ${currentGame.matchup}`
    : 'Host · Loading gameday…';

  return (
    <Screen scroll safeAreaEdges={['top', 'left', 'right']} contentContainerStyle={styles.content}>
      <HostBrandedHeader subtitle={headerSubtitle} />

      <View style={styles.statusPill}>
        <Text style={styles.statusDot}>●</Text>
        <Text style={styles.statusPillText}>Hosting live</Text>
      </View>

      <Text style={styles.screenLead}>Dashboard</Text>
      <Text style={styles.screenLeadMuted}>{hostTailgate?.groupName ?? '…'}</Text>

      {isLoading ? (
        <Card variant="soft">
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading dashboard" />
          </View>
        </Card>
      ) : isError ? (
        <Card variant="soft">
          <Text style={styles.helperCopy}>{dashboardErrorMessage(combinedError)}</Text>
          <SecondaryButton label="Try again" onPress={() => void refetchDashboard()} />
        </Card>
      ) : hostTailgate === undefined ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.helperCopy}>
            No tailgate listing found for this host profile. Check back once your event is published.
          </Text>
        </Card>
      ) : (
        <>
          <Card style={styles.hostCard}>
            <View style={styles.hostTopRow}>
              <Text style={styles.matchup}>{currentGame?.matchup ?? ''}</Text>
              <StatusChip status={hostTailgate.status} />
            </View>
            <Text style={styles.location}>{hostTailgate.locationDetail}</Text>
            <Text style={styles.helperCopy}>Keep your tailgate listing current for the gameday network.</Text>
          </Card>

          <Card variant="soft" accentColor={colors.navy}>
            <Text style={styles.contextLabel}>Current game</Text>
            <Text style={styles.contextMatchup}>{currentGame?.matchup ?? ''}</Text>
            <Text style={styles.contextMeta}>{metaLine}</Text>
            <Text style={styles.contextMeta}>
              {currentGame?.location ?? ''} · {currentGame?.weather ?? ''}
            </Text>
          </Card>

          <SectionHeader title="Quick actions" />
          <View style={styles.actionsRow}>
            <SecondaryButton label="Donation centers" onPress={() => router.push('/donate')} />
            <PrimaryButton label="Publish surplus" onPress={() => router.push('/publish')} />
          </View>

          <SectionHeader title="Today on TLAC" subtitle="Host metrics for this gameday." />
          <View style={styles.metricsGrid}>
            <MetricCard label="Views" value="128" style={styles.metricCard} />
            <MetricCard label="Saves" value="42" style={styles.metricCard} />
            <MetricCard label="Rating" value={hostTailgate.rating.toFixed(1)} style={styles.metricCard} />
            <MetricCard label="Claims" value="0" style={styles.metricCard} />
          </View>

          <SectionHeader title="Menu preview" subtitle="Items listed for your tailgate group." />
          <View style={styles.menuList}>
            {hostMenu.map((item) => (
              <FoodItemCard key={item.id} item={item} status="active" />
            ))}
          </View>

          <SecondaryButton
            label="Preview tailgate (Student / Fan)"
            onPress={() => router.push('/student/tailgate-detail')}
          />
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
  statusPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  statusDot: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '900',
  },
  statusPillText: {
    color: '#065F46',
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
  hostCard: {
    borderColor: colors.border,
  },
  hostTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  matchup: {
    flex: 1,
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  location: {
    marginTop: spacing.sm,
    color: colors.goldLight,
    fontSize: typography.body,
    fontWeight: '700',
  },
  helperCopy: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: typography.body,
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
  actionsRow: {
    gap: spacing.sm,
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
  menuList: {
    gap: spacing.sm,
  },
  loadingBlock: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
});
