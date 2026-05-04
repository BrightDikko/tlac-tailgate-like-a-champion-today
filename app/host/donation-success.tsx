import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card, MetricCard, PrimaryButton, Screen, SecondaryButton, SectionHeader } from '@/src/components';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

export default function DonationSuccessScreen() {
  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.successWrap}>
        <View style={styles.successCircle}>
          <Text style={styles.successIcon}>✓</Text>
        </View>
        <SectionHeader
          title="Donation Logged"
          subtitle="Remaining surplus is headed to a local partner."
          style={styles.header}
        />
      </View>

      <Card accentColor={colors.green}>
        <Text style={styles.summaryTitle}>Donation summary</Text>
        <Text style={styles.summaryLine}>12 lbs saved</Text>
        <Text style={styles.summaryLine}>15+ people fed</Text>
        <Text style={styles.summaryLine}>Cultivate Food Rescue</Text>
      </Card>

      <View style={styles.metricsRow}>
        <MetricCard label="CO2 offset" value="4.2 kg" style={styles.metricCard} />
        <MetricCard label="People fed" value="15+" style={styles.metricCard} />
      </View>
      <MetricCard label="Pounds donated" value="12" />

      <PrimaryButton label="View Impact" onPress={() => router.push('/impact')} />
      <SecondaryButton label="Donate more" onPress={() => router.push('/donate')} />
      <SecondaryButton label="Back to host dashboard" onPress={() => router.push('/dashboard')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    minHeight: '100%',
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  successWrap: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  successCircle: {
    width: 76,
    height: 76,
    borderRadius: 999,
    backgroundColor: 'rgba(62, 209, 111, 0.16)',
    borderWidth: 2,
    borderColor: 'rgba(62, 209, 111, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    color: colors.green,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  header: {
    alignItems: 'center',
  },
  summaryTitle: {
    color: colors.goldLight,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  summaryLine: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: 0,
  },
});
