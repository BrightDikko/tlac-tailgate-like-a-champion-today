import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import {
  Card,
  FilterChip,
  HostBrandedHeader,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionHeader,
  StatusChip,
} from '@/src/components';
import { currentGame, tailgates } from '@/src/data/demoData';
import type { GamePhase } from '@/src/types';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

type LeftoverItem = {
  id: string;
  name: string;
  servingsLabel: string;
  selected: boolean;
};

const pickupWindows = ['15 min', '30 min', '45 min', '60 min'];

const leftoverItems: LeftoverItem[] = [
  {
    id: 'leftover-1',
    name: 'Pulled Pork Sliders',
    servingsLabel: '12 servings',
    selected: true,
  },
  {
    id: 'leftover-2',
    name: 'Mac & Cheese Tray',
    servingsLabel: '8 servings',
    selected: true,
  },
  {
    id: 'leftover-3',
    name: 'Brownies',
    servingsLabel: '20 pieces',
    selected: false,
  },
];

function phaseLabel(phase: GamePhase) {
  return phase === 'postgame' ? 'Post-game' : 'Pregame';
}

export default function HostPublishTabScreen() {
  const hostTailgate = tailgates.find((item) => item.id === 'event-1') ?? tailgates[0];

  return (
    <Screen scroll safeAreaEdges={['top', 'left', 'right']} contentContainerStyle={styles.content}>
      <HostBrandedHeader
        subtitle={`Host · ${phaseLabel(currentGame.phase)} · ${currentGame.matchup}`}
      />

      <Text style={styles.screenLead}>Publish surplus</Text>
      <Text style={styles.screenLeadMuted}>
        {hostTailgate.groupName} · {hostTailgate.locationDetail}
      </Text>

      <Card variant="soft">
        <Text style={styles.afterGameLabel}>After-game surplus</Text>
        <Text style={styles.afterGameCopy}>
          List extra servings with a pickup window so Student / Fan neighbors can reserve what is
          actually available.
        </Text>
      </Card>

      <SectionHeader title="Leftover items" subtitle="Choose what to list for pickup." />
      <View style={styles.leftoversList}>
        {leftoverItems.map((item) => (
          <Card key={item.id} style={item.selected ? styles.selectedItem : styles.unselectedItem}>
            <View style={styles.itemRow}>
              <View style={styles.itemCopy}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemServings}>{item.servingsLabel}</Text>
              </View>
              {item.selected ? (
                <StatusChip status="available" label="Ready to publish" showDot={false} />
              ) : (
                <Text style={styles.optionalText}>Optional</Text>
              )}
            </View>
          </Card>
        ))}
      </View>

      <SectionHeader title="Pickup window" subtitle="How long claims stay active." />
      <View style={styles.pickupRow}>
        {pickupWindows.map((window) => (
          <FilterChip key={window} label={window} selected={window === '30 min'} />
        ))}
      </View>

      <SectionHeader title="Pickup note" />
      <Card variant="soft">
        <Text style={styles.noteText}>Blue tent near Stadium Lot B</Text>
      </Card>

      <Card style={styles.summaryCard} accentColor={colors.gold}>
        <Text style={styles.summaryTitle}>Publish summary</Text>
        <Text style={styles.summaryLine}>2 items selected</Text>
        <Text style={styles.summaryLine}>20 total servings</Text>
        <Text style={styles.summaryLine}>30-minute pickup window</Text>
        <Text style={styles.summarySubtext}>
          Student / Fan nearby can reserve servings once you publish.
        </Text>
      </Card>

      <PrimaryButton label="Publish surplus" onPress={() => router.push('/host/surplus-published')} />
      <SecondaryButton label="Back to dashboard" onPress={() => router.push('/dashboard')} />
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
    marginTop: spacing.xs,
  },
  afterGameLabel: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  afterGameCopy: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 23,
  },
  leftoversList: {
    gap: spacing.md,
  },
  selectedItem: {
    borderColor: '#B7E5C5',
  },
  unselectedItem: {
    opacity: 0.82,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  itemCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  itemName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  itemServings: {
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '600',
  },
  optionalText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pickupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  noteText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
  summaryCard: {
    borderColor: '#E3D5A6',
  },
  summaryTitle: {
    color: colors.goldLight,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  summaryLine: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
  summarySubtext: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
