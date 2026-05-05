import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useGetDonationByIdQuery } from '@/src/api/endpoints/donationsApi';
import { useGetDonationCenterByIdQuery } from '@/src/api/endpoints/donationCentersApi';
import { useGetSurplusByIdQuery } from '@/src/api/endpoints/surplusApi';
import { Card, PrimaryButton, Screen, SecondaryButton, SectionHeader } from '@/src/components';
import { useRemoteAuthGate } from '@/src/features/auth/remoteAuthGate';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import { categoryLabel } from '@/src/utils/donationCategories';
import { paramOne } from '@/src/utils/routeParams';

function formatWhen(iso: string | undefined): string {
  if (iso === undefined || iso === '') return 'Not recorded yet';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function DonationSuccessScreen() {
  const { shouldRedirectToLogin } = useRemoteAuthGate();
  const params = useLocalSearchParams<{
    donationId?: string | string[];
    donationCenterId?: string | string[];
    centerName?: string | string[];
    surplusId?: string | string[];
    donationCategory?: string | string[];
    itemDescription?: string | string[];
    approximateWeightLbs?: string | string[];
  }>();

  const donationId = paramOne(params.donationId);
  const centerIdParam = paramOne(params.donationCenterId);
  const centerNameParam = paramOne(params.centerName);
  const surplusIdParam = paramOne(params.surplusId);
  const categoryParam = paramOne(params.donationCategory);
  const itemDescriptionParam = paramOne(params.itemDescription);
  const weightParam = paramOne(params.approximateWeightLbs);

  const {
    data: donation,
    isLoading: donationLoading,
    isError: donationIsError,
  } = useGetDonationByIdQuery(donationId ?? '', { skip: !donationId });

  const centerIdForQuery =
    donation?.donationCenterId ?? (centerIdParam !== undefined && centerIdParam !== '' ? centerIdParam : '');
  const surplusIdForQuery =
    donation?.surplusId ?? (surplusIdParam !== undefined && surplusIdParam !== '' ? surplusIdParam : '');

  const { data: center, isLoading: centerLoading } = useGetDonationCenterByIdQuery(centerIdForQuery, {
    skip: centerIdForQuery === '',
  });

  const { data: surplus, isLoading: surplusLoading } = useGetSurplusByIdQuery(surplusIdForQuery, {
    skip: surplusIdForQuery === '',
  });

  if (shouldRedirectToLogin) {
    return <Redirect href="/login" />;
  }

  const weightDisplay =
    donation !== undefined
      ? String(donation.approximateWeightLbs)
      : weightParam !== undefined && weightParam !== ''
        ? weightParam
        : '';

  const centerName =
    center?.name ?? centerNameParam ?? (centerIdForQuery !== '' ? 'Donation center' : 'Not specified');
  const donationCategoryLabel =
    donation?.donationCategory !== undefined
      ? categoryLabel(donation.donationCategory)
      : categoryParam === 'prepared_food' ||
          categoryParam === 'packaged_drinks' ||
          categoryParam === 'packaged_food' ||
          categoryParam === 'produce'
        ? categoryLabel(categoryParam)
        : undefined;
  const itemDescription =
    donation?.itemDescription ??
    itemDescriptionParam ??
    (surplus !== undefined ? `${surplus.foodName} · ${surplus.groupName}` : undefined);
  const surplusLine =
    surplus !== undefined
      ? `${surplus.foodName} · ${surplus.groupName}`
      : surplusIdForQuery !== ''
        ? 'Linked surplus'
        : 'No surplus item linked';

  const createdLine = formatWhen(donation?.createdAt);
  const notesLine =
    donation?.notes !== undefined && donation.notes.trim() !== '' ? donation.notes.trim() : undefined;

  const showLoading = Boolean(donationId) && donationLoading;
  const showDonationError = Boolean(donationId) && donationIsError && !donationLoading;

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

      {!donationId ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.summaryLine}>We couldn’t load this confirmation (missing donation id).</Text>
          {weightParam !== undefined && weightParam !== '' ? (
            <Text style={styles.summaryLine}>Approximate weight (from link): {weightParam} lbs</Text>
          ) : null}
        </Card>
      ) : showLoading ? (
        <Card variant="soft">
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading donation" />
          </View>
        </Card>
      ) : showDonationError ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.summaryLine}>Couldn’t load donation details. You can still review impact or donate again.</Text>
        </Card>
      ) : (
        <Card accentColor={colors.green}>
          <Text style={styles.summaryTitle}>Donation summary</Text>
          <Text style={styles.summaryLine}>
            {!weightDisplay ? 'Approximate weight unavailable' : `${weightDisplay} lbs saved`}
          </Text>
          {donationCategoryLabel ? (
            <Text style={styles.summaryLine}>Category: {donationCategoryLabel}</Text>
          ) : null}
          {itemDescription ? (
            <Text style={styles.summaryLine}>Item: {itemDescription}</Text>
          ) : null}
          <Text style={styles.summaryLine}>
            {centerLoading ? 'Loading center…' : `Center: ${centerName}`}
          </Text>
          <Text style={styles.summaryLine}>
            {surplusLoading ? 'Loading surplus…' : `Surplus: ${surplusLine}`}
          </Text>
          <Text style={styles.summaryLine}>Logged at: {createdLine}</Text>
          {notesLine !== undefined ? <Text style={styles.summaryNotes}>Notes: {notesLine}</Text> : null}
        </Card>
      )}

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
    fontWeight: '600',
    lineHeight: 22,
  },
  summaryNotes: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: typography.caption,
    lineHeight: 20,
  },
  loadingBlock: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
});
