import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type DimensionValue } from 'react-native';

import { useGetGlobalImpactQuery, useGetMyImpactQuery } from '@/src/api/endpoints/impactApi';
import {
  AppHeader,
  Card,
  MetricCard,
  Screen,
  SecondaryButton,
  SectionHeader,
} from '@/src/components';
import { selectIsAuthenticated } from '@/src/features/auth/authSelectors';
import { useAppSelector } from '@/src/redux/hooks';
import { API_MODE } from '@/src/services/config/env';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import { messageFromUnknownError } from '@/src/utils/errorMessage';

export default function ImpactTabScreen() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const skipMyImpact = API_MODE === 'remote' && !isAuthenticated;
  const skipGlobalImpact = API_MODE !== 'remote' || isAuthenticated;

  const {
    data: myImpact,
    isLoading: myLoading,
    isError: myError,
    error: myErr,
    refetch: refetchMy,
  } = useGetMyImpactQuery(undefined, { skip: skipMyImpact });

  const {
    data: globalImpact,
    isLoading: globalLoading,
    isError: globalError,
    error: globalErr,
    refetch: refetchGlobal,
  } = useGetGlobalImpactQuery(undefined, { skip: skipGlobalImpact });

  const impact = skipMyImpact ? globalImpact : myImpact;
  const isLoading = skipMyImpact ? globalLoading : myLoading;
  const isError = skipMyImpact ? globalError : myError;
  const error = skipMyImpact ? globalErr : myErr;

  const refetch = () => {
    if (skipMyImpact) {
      void refetchGlobal();
    } else {
      void refetchMy();
    }
  };

  const isAnonymousRemote = skipMyImpact;

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
          <Text style={styles.errorText}>{messageFromUnknownError(error, 'Could not load impact data.')}</Text>
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
        {isLoading ? (
          <>
            <Text style={styles.todayLine}>
              {isAnonymousRemote ? 'Loading community impact totals…' : 'Loading your impact snapshot…'}
            </Text>
            <Text style={styles.todayLine}>
              {isAnonymousRemote
                ? 'Community totals update as surplus is claimed and pickups are confirmed.'
                : 'Totals update as you claim and confirm surplus pickups.'}
            </Text>
            <Text style={styles.todayLine}>TLAC turns gameday abundance into shared impact.</Text>
          </>
        ) : isError ? (
          <>
            <Text style={styles.todayLine}>Live impact totals are not available right now.</Text>
            <Text style={styles.todayLine}>Try again above when you are back online.</Text>
            <Text style={styles.todayLine}>TLAC turns gameday abundance into shared impact.</Text>
          </>
        ) : impact !== undefined ? (
          <>
            {isAnonymousRemote ? (
              <>
                <Text style={styles.todayLine}>
                  Community-wide: {impact.servingsClaimed} serving
                  {impact.servingsClaimed === 1 ? '' : 's'} claimed, {impact.poundsDonated} lb donated.
                </Text>
                <Text style={styles.todayLine}>
                  {impact.participatingTailgates} participating tailgate
                  {impact.participatingTailgates === 1 ? '' : 's'}, {impact.studentPickups} student pickup
                  {impact.studentPickups === 1 ? '' : 's'}, {impact.donationCentersSupported} donation partner
                  {impact.donationCentersSupported === 1 ? '' : 's'} supported.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.todayLine}>
                  From your loaded totals: {impact.servingsClaimed} serving
                  {impact.servingsClaimed === 1 ? '' : 's'} claimed, {impact.poundsDonated} lb donated.
                </Text>
                <Text style={styles.todayLine}>
                  {impact.participatingTailgates} participating tailgate
                  {impact.participatingTailgates === 1 ? '' : 's'}, {impact.studentPickups} student pickup
                  {impact.studentPickups === 1 ? '' : 's'}, {impact.donationCentersSupported} donation partner
                  {impact.donationCentersSupported === 1 ? '' : 's'} supported.
                </Text>
              </>
            )}
            <Text style={styles.todayLine}>TLAC turns gameday abundance into shared impact.</Text>
          </>
        ) : (
          <>
            <Text style={styles.todayLine}>Impact totals will show here once data is available.</Text>
            <Text style={styles.todayLine}>TLAC turns gameday abundance into shared impact.</Text>
          </>
        )}
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
