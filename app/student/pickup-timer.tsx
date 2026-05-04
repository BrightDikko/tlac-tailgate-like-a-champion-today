import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, Screen, SecondaryButton, SectionHeader } from '@/src/components';
import { surplusItems } from '@/src/data/demoData';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

export default function PickupTimerScreen() {
  const reservedItem = surplusItems.find((item) => item.id === 'surplus-1') ?? surplusItems[0];

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionHeader title="Claim Reserved" subtitle="Your servings are held for pickup." />

      <Card style={styles.timerCard} accentColor={colors.gold}>
        <Text style={styles.timerValue}>29:42</Text>
        <Text style={styles.timerLabel}>remaining in pickup window</Text>
      </Card>

      <Card variant="soft">
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Claim ID</Text>
          <Text style={styles.detailValue}>{reservedItem.claimId ?? 'TLAC-4821'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Food item</Text>
          <Text style={styles.detailValue}>{reservedItem.foodName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Quantity</Text>
          <Text style={styles.detailValue}>2 servings</Text>
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
});
