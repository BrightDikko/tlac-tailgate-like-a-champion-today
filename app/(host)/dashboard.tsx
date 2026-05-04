import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

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
import { currentGame, menuItems, tailgates } from '@/src/data/demoData';
import type { GamePhase } from '@/src/types';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

function phaseLabel(phase: GamePhase) {
  return phase === 'postgame' ? 'Post-game' : 'Pregame';
}

export default function HostDashboardTabScreen() {
  const hostTailgate = tailgates.find((item) => item.id === 'event-1') ?? tailgates[0];
  const hostMenu = menuItems.filter((item) => item.tailgateId === hostTailgate.id);
  const metaLine = `${currentGame.gameDate} · Kickoff ${currentGame.kickoffTime}`;

  return (
    <Screen scroll safeAreaEdges={['top', 'left', 'right']} contentContainerStyle={styles.content}>
      <HostBrandedHeader
        subtitle={`Host · ${phaseLabel(currentGame.phase)} · ${currentGame.matchup}`}
      />

      <View style={styles.statusPill}>
        <Text style={styles.statusDot}>●</Text>
        <Text style={styles.statusPillText}>Hosting live</Text>
      </View>

      <Text style={styles.screenLead}>Dashboard</Text>
      <Text style={styles.screenLeadMuted}>{hostTailgate.groupName}</Text>

      <Card style={styles.hostCard}>
        <View style={styles.hostTopRow}>
          <Text style={styles.matchup}>{currentGame.matchup}</Text>
          <StatusChip status={hostTailgate.status} />
        </View>
        <Text style={styles.location}>{hostTailgate.locationDetail}</Text>
        <Text style={styles.helperCopy}>Keep your tailgate listing current for the gameday network.</Text>
      </Card>

      <Card variant="soft" accentColor={colors.navy}>
        <Text style={styles.contextLabel}>Current game</Text>
        <Text style={styles.contextMatchup}>{currentGame.matchup}</Text>
        <Text style={styles.contextMeta}>{metaLine}</Text>
        <Text style={styles.contextMeta}>
          {currentGame.location} · {currentGame.weather}
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
});
