import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, Screen, SecondaryButton } from '@/src/components';
import { donationCenters, surplusItems } from '@/src/data/demoData';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

export default function LogDonationScreen() {
  const selectedSurplus = surplusItems[0];
  const selectedCenter = donationCenters.find((item) => item.acceptsPreparedFood) ?? donationCenters[0];

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <SecondaryButton label="Back" size="md" onPress={() => router.back()} style={styles.backButton} />
        <Text style={styles.topTitle}>Log Donation</Text>
        <View style={styles.topSpacer} />
      </View>

      <Card accentColor={colors.gold}>
        <Text style={styles.contextTitle}>Finalizing surplus</Text>
        <Text style={styles.contextBody}>
          Your contribution helps feed neighbors and supports TLAC impact tracking.
        </Text>
      </Card>

      <Card variant="soft">
        <Field label="Select surplus item" value={selectedSurplus?.foodName ?? 'Pulled pork sliders'} />
        <Field label="Select donation center" value={selectedCenter?.name ?? 'Cultivate Food Rescue'} />
        <Field label="Approximate weight" value="12 lbs" />
        <Field label="Notes" value="Kept covered and chilled until drop-off." />
      </Card>

      <Text style={styles.disclaimer}>All donations are logged with local demo data for this prototype.</Text>

      <PrimaryButton label="Log Donation" onPress={() => router.push('/host/donation-success')} />
      <SecondaryButton label="Back to Donate" onPress={() => router.push('/donate')} />
    </Screen>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldValueWrap}>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    minWidth: 84,
  },
  topTitle: {
    flex: 1,
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
    textAlign: 'center',
  },
  topSpacer: {
    minWidth: 84,
  },
  contextTitle: {
    color: colors.goldLight,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  contextBody: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
  fieldWrap: {
    marginTop: spacing.md,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValueWrap: {
    marginTop: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  fieldValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
  disclaimer: {
    color: colors.muted,
    fontSize: typography.caption,
    lineHeight: 20,
  },
});
