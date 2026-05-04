import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useGetCurrentGameQuery } from '@/src/api/endpoints/gamesApi';
import { Card, HostBrandedHeader, PrimaryButton, Screen, SecondaryButton, SectionHeader } from '@/src/components';
import type { GamePhase } from '@/src/types';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

function phaseLabel(phase: GamePhase) {
  return phase === 'postgame' ? 'Post-game' : 'Pregame';
}

function reachErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const d = (err as { data: unknown }).data;
    if (d && typeof d === 'object' && d !== null && 'message' in d) {
      return String((d as { message: string }).message);
    }
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return 'Could not load game context.';
}

export default function HostReachTabScreen() {
  const { data: currentGame, isLoading, isError, error, refetch } = useGetCurrentGameQuery();

  const headerSubtitle = currentGame
    ? `Host · ${phaseLabel(currentGame.phase)} · ${currentGame.matchup}`
    : isLoading
      ? 'Host · Loading gameday…'
      : 'Host · Gameday';

  return (
    <Screen scroll safeAreaEdges={['top', 'left', 'right']} contentContainerStyle={styles.content}>
      <HostBrandedHeader subtitle={headerSubtitle} />

      <Text style={styles.screenLead}>Reach</Text>
      <Text style={styles.screenLeadMuted}>See the Student / Fan experience around your surplus.</Text>

      {isLoading ? (
        <Card variant="soft">
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading game context" />
          </View>
        </Card>
      ) : isError ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.errorText}>{reachErrorMessage(error)}</Text>
          <SecondaryButton label="Try again" onPress={() => void refetch()} style={styles.retryButton} />
        </Card>
      ) : null}

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
  loadingBlock: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  errorText: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: spacing.md,
  },
});
