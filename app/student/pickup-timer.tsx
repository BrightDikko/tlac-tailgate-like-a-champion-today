import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useGetSurplusByIdQuery } from '@/src/api/endpoints/surplusApi';
import { Card, PrimaryButton, Screen, SecondaryButton, SectionHeader } from '@/src/components';
import { surplusItems } from '@/src/data/demoData';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

function paramOne(value: string | string[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

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
  return 'Could not load surplus details.';
}

export default function PickupTimerScreen() {
  const params = useLocalSearchParams<{
    claimRecordId?: string;
    claimId?: string;
    surplusId?: string;
    servingsClaimed?: string;
  }>();

  const surplusId = paramOne(params.surplusId);
  const shouldFetchSurplus = Boolean(surplusId);

  const {
    data: surplusItem,
    isLoading: isSurplusLoading,
    isError: isSurplusError,
    error: surplusError,
    refetch: refetchSurplus,
  } = useGetSurplusByIdQuery(surplusId ?? '', { skip: !shouldFetchSurplus });

  const fallbackItem = surplusItems.find((item) => item.id === 'surplus-1') ?? surplusItems[0];

  const claimIdParam = paramOne(params.claimId);
  const displayClaimId =
    claimIdParam && claimIdParam.length > 0
      ? claimIdParam
      : (surplusItem?.claimId ?? fallbackItem.claimId ?? 'TLAC-4821');

  const servingsParam = paramOne(params.servingsClaimed);
  const parsedServings = servingsParam !== undefined ? Number.parseInt(servingsParam, 10) : NaN;
  const servingsCount =
    Number.isFinite(parsedServings) && parsedServings > 0 ? parsedServings : 2;

  const reservedItem = surplusItem ?? fallbackItem;

  const detailCard = shouldFetchSurplus && isSurplusLoading ? (
    <Card variant="soft">
      <View style={styles.loadingBlock}>
        <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading surplus details" />
      </View>
    </Card>
  ) : shouldFetchSurplus && isSurplusError ? (
    <Card variant="soft">
      <Text style={styles.errorText}>{surplusErrorMessage(surplusError)}</Text>
      <SecondaryButton label="Try again" onPress={() => void refetchSurplus()} style={styles.retryButton} />
    </Card>
  ) : (
    <Card variant="soft">
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Claim ID</Text>
        <Text style={styles.detailValue}>{displayClaimId}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Food item</Text>
        <Text style={styles.detailValue}>{reservedItem.foodName}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Quantity</Text>
        <Text style={styles.detailValue}>
          {servingsCount} serving{servingsCount === 1 ? '' : 's'}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Location</Text>
        <Text style={styles.detailValue}>{reservedItem.location}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Pickup note</Text>
        <Text style={styles.detailValue}>{reservedItem.pickupNote}</Text>
      </View>
    </Card>
  );

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionHeader title="Claim Reserved" subtitle="Your servings are held for pickup." />

      <Card style={styles.timerCard} accentColor={colors.gold}>
        <Text style={styles.timerValue}>29:42</Text>
        <Text style={styles.timerLabel}>remaining in pickup window</Text>
      </Card>

      {detailCard}

      <Card variant="soft">
        <Text style={styles.reliabilityCopy}>
          Your claim holds these servings during the pickup window. Confirm once you have picked them up.
        </Text>
      </Card>

      <PrimaryButton label="Confirm Pickup" onPress={() => router.push('/student/pickup-success')} />
      <SecondaryButton label="Release claim" onPress={() => router.push('/surplus')} />
      <SecondaryButton label="Back to surplus" size="md" onPress={() => router.push('/surplus')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  timerCard: {
    alignItems: 'center',
  },
  timerValue: {
    color: colors.goldLight,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timerLabel: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '600',
  },
  detailRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  detailLabel: {
    flex: 1,
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    flex: 2,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    textAlign: 'right',
  },
  reliabilityCopy: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
  loadingBlock: {
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
});
