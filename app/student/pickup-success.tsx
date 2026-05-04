import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, Screen, SecondaryButton, SectionHeader } from '@/src/components';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

export default function PickupSuccessScreen() {
  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.successWrap}>
        <View style={styles.successCircle}>
          <Text style={styles.successIcon}>✓</Text>
        </View>
        <SectionHeader
          title="Pickup Confirmed"
          subtitle="You helped save 2 servings from going to waste."
          style={styles.header}
        />
      </View>

      <Card accentColor={colors.green}>
        <Text style={styles.badgeTitle}>Waste Warrior</Text>
        <Text style={styles.badgeSub}>Badge progress: 3/5 pickups</Text>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
      </Card>

      <Card variant="soft">
        <Text style={styles.summaryLine}>2 servings saved</Text>
        <Text style={styles.summaryLine}>Claim ID TLAC-4821</Text>
        <Text style={styles.summaryLine}>Domer Grill Crew</Text>
      </Card>

      <PrimaryButton label="View impact" onPress={() => router.push('/impact')} />
      <SecondaryButton label="Back to surplus" onPress={() => router.push('/surplus')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    minHeight: '100%',
    paddingBottom: spacing.xxl,
    justifyContent: 'center',
  },
  successWrap: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  successCircle: {
    width: 76,
    height: 76,
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
  badgeTitle: {
    color: colors.goldLight,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  badgeSub: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
  progressTrack: {
    marginTop: spacing.md,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#DFE6EF',
    overflow: 'hidden',
  },
  progressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: colors.gold,
  },
  summaryLine: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
});
