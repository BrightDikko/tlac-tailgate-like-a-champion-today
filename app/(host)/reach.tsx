import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Card, HostBrandedHeader, PrimaryButton, Screen, SecondaryButton, SectionHeader } from '@/src/components';
import { currentGame } from '@/src/data/demoData';
import type { GamePhase } from '@/src/types';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

function phaseLabel(phase: GamePhase) {
  return phase === 'postgame' ? 'Post-game' : 'Pregame';
}

export default function HostReachTabScreen() {
  return (
    <Screen scroll safeAreaEdges={['top', 'left', 'right']} contentContainerStyle={styles.content}>
      <HostBrandedHeader
        subtitle={`Host · ${phaseLabel(currentGame.phase)} · ${currentGame.matchup}`}
      />

      <Text style={styles.screenLead}>Reach</Text>
      <Text style={styles.screenLeadMuted}>See the Student / Fan experience around your surplus.</Text>

      <SectionHeader
        title="Student / Fan view"
        subtitle="Jump into the same screens neighbors use to browse and claim."
      />

      <Card variant="soft" accentColor={colors.green}>
        <Text style={styles.cardTitle}>Surplus feed</Text>
        <Text style={styles.cardBody}>
          Open the Surplus tab to confirm how your servings read once they are live.
        </Text>
        <PrimaryButton label="Open surplus feed" onPress={() => router.push('/surplus')} />
      </Card>

      <Card variant="soft" accentColor={colors.navy}>
        <Text style={styles.cardTitle}>Tailgate detail</Text>
        <Text style={styles.cardBody}>
          Preview how your group and menu appear when Student / Fan open your tailgate.
        </Text>
        <SecondaryButton
          label="Preview tailgate detail"
          onPress={() => router.push('/student/tailgate-detail')}
        />
      </Card>

      <Card variant="soft">
        <Text style={styles.cardTitle}>Discover</Text>
        <Text style={styles.cardBody}>
          Browse the full discovery experience alongside the gameday network.
        </Text>
        <SecondaryButton label="Open Discover" onPress={() => router.push('/discover')} />
      </Card>
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
    marginTop: spacing.sm,
    lineHeight: 22,
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
});
