import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type DimensionValue } from 'react-native';

import { useGetMyImpactQuery } from '@/src/api/endpoints/impactApi';
import {
  AppHeader,
  Card,
  MetricCard,
  Screen,
  SecondaryButton,
  SectionHeader,
} from '@/src/components';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

function impactErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const d = (err as { data: unknown }).data;
    if (d && typeof d === 'object' && d !== null && 'message' in d) {
      return String((d as { message: string }).message);
    }
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return 'Could not load impact data.';
}

export default function ImpactTabScreen() {
  const {
    data: impact,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetMyImpactQuery();

  const wasteProgressWidth =
    impact !== undefined
      ? (`${Math.max(0, Math.min(impact.wasteDivertedPercent, 100))}%` as DimensionValue)
      : ('0%' as DimensionValue);

  return (
    <Screen scroll safeAreaEdges={['top', 'left', 'right']} contentContainerStyle={styles.content}>
      <AppHeader
        title="Impact"
        subtitle="Community outcomes from surplus and sharing"
        rightAction={
          <Pressable accessibilityRole="button" hitSlop={12} style={styles.iconHit}>
            <Ionicons name="information-circle-outline" size={24} color={colors.text} />
          </Pressable>
        }
      />

      <SectionHeader
        title="Community impact"
        subtitle="Together, the Notre Dame gameday network reduces waste."
      />

      {isLoading ? (
        <Card style={styles.featuredCard} accentColor={colors.green}>
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading impact" />
          </View>
        </Card>
      ) : isError ? (
        <Card variant="soft">
          <Text style={styles.errorText}>{impactErrorMessage(error)}</Text>
          <SecondaryButton label="Try again" onPress={() => void refetch()} style={styles.retryButton} />
        </Card>
      ) : impact !== undefined ? (
        <>
          <Card style={styles.featuredCard} accentColor={colors.green}>
            <Text style={styles.featuredPercent}>{impact.wasteDivertedPercent}% waste diverted</Text>
            <Text style={styles.featuredCopy}>
              Good food redirected through Student / Fan pickup and donation pathways.
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: wasteProgressWidth }]} />
            </View>
          </Card>

          <View style={styles.metricsGrid}>
            <MetricCard label="Servings claimed" value={impact.servingsClaimed} style={styles.metricCard} />
            <MetricCard label="Pounds donated" value={impact.poundsDonated} style={styles.metricCard} />
            <MetricCard label="Tailgates" value={impact.participatingTailgates} style={styles.metricCard} />
            <MetricCard
              label="Student / Fan pickups"
              value={impact.studentPickups}
              style={styles.metricCard}
            />
            <MetricCard
              label="Donation centers"
              value={impact.donationCentersSupported}
              style={styles.metricCardWide}
            />
          </View>
        </>
      ) : null}

      <Card variant="soft" accentColor={colors.gold}>
        <Text style={styles.todayTitle}>Today on TLAC</Text>
        <Text style={styles.todayLine}>Your pickup helped save 2 servings.</Text>
        <Text style={styles.todayLine}>Domer Grill Crew kept surplus food in the community.</Text>
        <Text style={styles.todayLine}>TLAC turns gameday abundance into shared impact.</Text>
      </Card>

      <SecondaryButton label="Back to welcome" onPress={() => router.push('/welcome')} />
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
  featuredCard: {
    borderColor: '#B7E5C5',
  },
  featuredPercent: {
    color: colors.goldLight,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  featuredCopy: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 23,
  },
  progressTrack: {
    marginTop: spacing.md,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#DFE6EF',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.green,
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
  metricCardWide: {
    width: '100%',
  },
  todayTitle: {
    color: colors.goldLight,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  todayLine: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: typography.body,
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
});
