import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, Screen, SecondaryButton, SectionHeader } from '@/src/components';
import { useRemoteAuthGate } from '@/src/features/auth/remoteAuthGate';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import { paramOne } from '@/src/utils/routeParams';

export default function PickupSuccessScreen() {
  const { shouldRedirectToLogin } = useRemoteAuthGate();
  const params = useLocalSearchParams<{
    claimRecordId?: string;
    claimId?: string;
    servingsClaimed?: string;
    foodName?: string;
    groupName?: string;
  }>();

  const claimRecordIdParam = paramOne(params.claimRecordId);
  const claimIdParam = paramOne(params.claimId);
  const servingsParam = paramOne(params.servingsClaimed);
  const foodNameParam = paramOne(params.foodName);
  const groupNameParam = paramOne(params.groupName);

  const parsedServings = servingsParam !== undefined ? Number.parseInt(servingsParam, 10) : NaN;
  const hasValidServings = Number.isFinite(parsedServings) && parsedServings > 0;

  const displayClaimId = claimIdParam && claimIdParam.length > 0 ? claimIdParam : undefined;
  const displayGroup = groupNameParam && groupNameParam.length > 0 ? groupNameParam : 'Host listing';

  const subtitle = hasValidServings
    ? `You confirmed pickup for ${parsedServings} serving${parsedServings === 1 ? '' : 's'}.`
    : 'You confirmed your pickup.';

  if (shouldRedirectToLogin) {
    return <Redirect href="/login" />;
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.successWrap}>
        <View style={styles.successCircle}>
          <Text style={styles.successIcon}>✓</Text>
        </View>
        <SectionHeader title="Pickup Confirmed" subtitle={subtitle} style={styles.header} />
      </View>

      <Card accentColor={colors.green}>
        <Text style={styles.badgeTitle}>Waste Warrior</Text>
        <Text style={styles.badgeSub}>
          Thanks for confirming pickup. Every surplus rescue helps the gameday network cut waste.
        </Text>
      </Card>

      <Card variant="soft">
        {hasValidServings ? (
          <Text style={styles.summaryLine}>
            {parsedServings} serving{parsedServings === 1 ? '' : 's'} saved
          </Text>
        ) : (
          <Text style={styles.summaryLine}>Pickup confirmed</Text>
        )}
        {displayClaimId ? <Text style={styles.summaryLine}>Claim ID {displayClaimId}</Text> : null}
        {claimRecordIdParam && claimRecordIdParam.length > 0 ? (
          <Text style={styles.debugLine}>Ref {claimRecordIdParam}</Text>
        ) : null}
        <Text style={styles.summaryLine}>{displayGroup}</Text>
        {foodNameParam && foodNameParam.length > 0 ? (
          <Text style={styles.summaryLine}>{foodNameParam}</Text>
        ) : null}
      </Card>

      <PrimaryButton label="View impact" onPress={() => router.push('/impact')} />
      <SecondaryButton label="Claim more surplus" onPress={() => router.push('/surplus')} />
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
    lineHeight: 22,
  },
  summaryLine: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  debugLine: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '600',
  },
});
