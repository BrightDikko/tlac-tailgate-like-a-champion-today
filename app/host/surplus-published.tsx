import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import {
  Card,
  HostBrandedHeader,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionHeader,
} from '@/src/components';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

export default function SurplusPublishedScreen() {
  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <HostBrandedHeader subtitle="Surplus published" />

      <View style={styles.successWrap}>
        <View style={styles.successCircle}>
          <Text style={styles.successIcon}>✓</Text>
        </View>
        <SectionHeader
          title="Surplus is live"
          subtitle="Servings are listed for nearby pickups."
          style={styles.header}
        />
      </View>

      <Card accentColor={colors.green}>
        <Text style={styles.summaryTitle}>Publish Summary</Text>
        <Text style={styles.summaryLine}>2 items published</Text>
        <Text style={styles.summaryLine}>20 total servings</Text>
        <Text style={styles.summaryLine}>30-minute pickup window</Text>
        <Text style={styles.summaryLine}>Pickup note: Blue tent near Stadium Lot B</Text>
      </Card>

      <Card variant="soft">
        <Text style={styles.reliabilityTitle}>Why this works</Text>
        <Text style={styles.reliabilityCopy}>
          Claims reserve servings for a short pickup window so food is not promised twice.
        </Text>
      </Card>

      <PrimaryButton
        label="View surplus feed"
        onPress={() => router.push('/surplus')}
      />
      <SecondaryButton label="Donate unclaimed surplus" onPress={() => router.push('/donate')} />
      <SecondaryButton label="Back to host dashboard" onPress={() => router.push('/dashboard')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
    minHeight: '100%',
    justifyContent: 'center',
  },
  successWrap: {
    gap: spacing.lg,
    alignItems: 'center',
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: '#DBF7E4',
    borderWidth: 2,
    borderColor: '#9CDCB1',
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
    fontWeight: '600',
  },
  reliabilityTitle: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  reliabilityCopy: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
