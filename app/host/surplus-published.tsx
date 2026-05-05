import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import {
  Card,
  HostBrandedHeader,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionHeader,
} from '@/src/components';
import { useRemoteAuthGate } from '@/src/features/auth/remoteAuthGate';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import { paramOne } from '@/src/utils/routeParams';

function parsePositiveInt(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === '') return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function SurplusPublishedScreen() {
  const { shouldRedirectToLogin } = useRemoteAuthGate();
  const params = useLocalSearchParams<{
    tailgateId?: string;
    tailgateName?: string;
    itemsPublished?: string;
    totalServings?: string;
    pickupWindowMinutes?: string;
    pickupNote?: string;
  }>();

  const tailgateId = paramOne(params.tailgateId);
  const tailgateName = paramOne(params.tailgateName);
  const itemsCount = parsePositiveInt(paramOne(params.itemsPublished));
  const servingsTotal = parsePositiveInt(paramOne(params.totalServings));
  const windowMinutes = parsePositiveInt(paramOne(params.pickupWindowMinutes));
  const note = paramOne(params.pickupNote);

  const itemsLine =
    itemsCount !== null
      ? `${itemsCount} item${itemsCount === 1 ? '' : 's'} published`
      : 'Surplus listings published';

  const servingsLine =
    servingsTotal !== null
      ? `${servingsTotal} total servings`
      : 'Servings are listed for nearby pickups';

  const windowLine =
    windowMinutes !== null
      ? `${windowMinutes}-minute pickup window`
      : 'Pickup window set for new listings';

  const noteLine =
    note !== undefined && note.length > 0 ? `Pickup note: ${note}` : 'Pickup details were saved with your listings.';

  const subtitleTailgate =
    tailgateName !== undefined && tailgateName.length > 0
      ? `Published under ${tailgateName}.`
      : tailgateId !== undefined && tailgateId.length > 0
        ? `Published for your tailgate listing.`
        : 'Servings are listed for nearby pickups.';

  if (shouldRedirectToLogin) {
    return <Redirect href="/login" />;
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <HostBrandedHeader subtitle="Surplus published" />

      <View style={styles.successWrap}>
        <View style={styles.successCircle}>
          <Text style={styles.successIcon}>✓</Text>
        </View>
        <SectionHeader title="Surplus is live" subtitle={subtitleTailgate} style={styles.header} />
      </View>

      <Card accentColor={colors.green}>
        <Text style={styles.summaryTitle}>Publish Summary</Text>
        <Text style={styles.summaryLine}>{itemsLine}</Text>
        <Text style={styles.summaryLine}>{servingsLine}</Text>
        <Text style={styles.summaryLine}>{windowLine}</Text>
        <Text style={styles.summaryLine}>{noteLine}</Text>
      </Card>

      <Card variant="soft">
        <Text style={styles.reliabilityTitle}>Why this works</Text>
        <Text style={styles.reliabilityCopy}>
          Claims reserve servings for a short pickup window so food is not promised twice.
        </Text>
      </Card>

      <PrimaryButton label="View surplus feed" onPress={() => router.push('/surplus')} />
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
