import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useClaimSurplusMutation } from '@/src/api/endpoints/claimsApi';
import { useGetSurplusQuery } from '@/src/api/endpoints/surplusApi';
import { AppHeader, Card, Screen, SectionHeader, SecondaryButton, SurplusCard } from '@/src/components';
import { currentGame } from '@/src/data/demoData';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import type { SurplusItem } from '@/src/types';

function surplusErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const d = (err as { data: unknown }).data;
    if (d && typeof d === 'object' && d !== null && 'message' in d) {
      return String((d as { message: string }).message);
    }
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return 'Could not load surplus items.';
}

export default function SurplusTabScreen() {
  const { data, isLoading, isError, error, refetch } = useGetSurplusQuery();
  const surplusItems = data?.data ?? [];

  const [claimSurplus, { isLoading: isClaiming, error: claimError, reset: resetClaimError }] =
    useClaimSurplusMutation();

  const handleClaimPress = async (item: SurplusItem) => {
    resetClaimError();
    try {
      const claim = await claimSurplus({
        surplusId: item.id,
        input: { surplusId: item.id, servingsClaimed: 2 },
      }).unwrap();
      router.push({
        pathname: '/student/pickup-timer',
        params: {
          claimRecordId: claim.id,
          claimId: claim.claimId ?? '',
          surplusId: claim.surplusId,
          servingsClaimed: String(claim.servingsClaimed),
        },
      });
    } catch {
      // Mutation error is surfaced via claimError
    }
  };

  return (
    <Screen scroll safeAreaEdges={['top', 'left', 'right']} contentContainerStyle={styles.content}>
      <AppHeader
        title="Surplus"
        subtitle="Reserve servings · timed pickup windows"
        rightAction={
          <Pressable accessibilityRole="button" hitSlop={12} style={styles.iconHit}>
            <Ionicons name="funnel-outline" size={22} color={colors.text} />
          </Pressable>
        }
      />

      <SectionHeader
        title="Available near campus"
        subtitle="Post-game pickup windows stay open for a limited time."
      />

      <Card variant="soft">
        <Text style={styles.contextLabel}>{currentGame.matchup}</Text>
        <Text style={styles.contextTitle}>Surplus pickup phase</Text>
        <Text style={styles.contextCopy}>
          Claimed servings are held for 30 minutes so hosts can plan handoffs.
        </Text>
      </Card>

      <Text style={styles.helperCopy}>
        Claiming below reserves 2 servings of Pulled Pork Sliders for your pickup timer.
      </Text>

      {isLoading ? (
        <View style={styles.stateBlock} accessibilityLabel="Loading surplus">
          <ActivityIndicator size="large" color={colors.goldLight} />
        </View>
      ) : isError ? (
        <Card variant="soft">
          <Text style={styles.errorText}>{surplusErrorMessage(error)}</Text>
          <SecondaryButton label="Try again" onPress={() => void refetch()} style={styles.retryButton} />
        </Card>
      ) : (
        <>
          {claimError ? (
            <Card variant="soft">
              <Text style={styles.claimErrorText}>{surplusErrorMessage(claimError)}</Text>
            </Card>
          ) : null}
          <View style={styles.list}>
            {surplusItems.map((item) => (
              <SurplusCard
                key={item.id}
                item={item}
                onClaimPress={() => void handleClaimPress(item)}
                claimDisabled={isClaiming}
              />
            ))}
          </View>
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
  iconHit: {
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    alignItems: 'flex-end',
  },
  contextLabel: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contextTitle: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  contextCopy: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: typography.body,
  },
  helperCopy: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  list: {
    gap: spacing.md,
  },
  stateBlock: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.muted,
    fontSize: typography.body,
  },
  retryButton: {
    marginTop: spacing.md,
  },
  claimErrorText: {
    color: colors.muted,
    fontSize: typography.body,
  },
});
