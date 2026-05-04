import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type DimensionValue } from 'react-native';

import {
  AppHeader,
  Card,
  MetricCard,
  Screen,
  SecondaryButton,
  SectionHeader,
} from '@/src/components';
import { impact } from '@/src/data/demoData';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

export default function ImpactTabScreen() {
  const wasteProgressWidth = `${Math.max(0, Math.min(impact.wasteDivertedPercent, 100))}%` as DimensionValue;

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
});
