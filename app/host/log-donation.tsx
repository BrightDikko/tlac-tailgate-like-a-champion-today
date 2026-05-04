import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useCreateDonationMutation } from '@/src/api/endpoints/donationsApi';
import { useGetDonationCentersQuery } from '@/src/api/endpoints/donationCentersApi';
import { useGetSurplusQuery } from '@/src/api/endpoints/surplusApi';
import { Card, PrimaryButton, Screen, SecondaryButton } from '@/src/components';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

function donationErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const d = (err as { data: unknown }).data;
    if (d && typeof d === 'object' && d !== null && 'message' in d) {
      return String((d as { message: string }).message);
    }
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return 'Could not log donation.';
}

function queryErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const d = (err as { data: unknown }).data;
    if (d && typeof d === 'object' && d !== null && 'message' in d) {
      return String((d as { message: string }).message);
    }
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return 'Could not load donation details.';
}

export default function LogDonationScreen() {
  const {
    data: surplusResponse,
    isLoading: surplusLoading,
    isError: surplusError,
    error: surplusErr,
    refetch: refetchSurplus,
  } = useGetSurplusQuery();

  const {
    data: centersResponse,
    isLoading: centersLoading,
    isError: centersError,
    error: centersErr,
    refetch: refetchCenters,
  } = useGetDonationCentersQuery();

  const [createDonation, { isLoading: isLoggingDonation, error: donationError, reset: resetDonationError }] =
    useCreateDonationMutation();

  const surplusList = surplusResponse?.data ?? [];
  const centersList = centersResponse?.data ?? [];

  const selectedSurplus = surplusList[0];
  const selectedCenter =
    centersList.find((item) => item.acceptsPreparedFood) ?? centersList[0];

  const queriesLoading = surplusLoading || centersLoading;
  const queriesError = surplusError || centersError;
  const combinedQueryError = surplusErr ?? centersErr;

  const refetchAll = () => {
    void refetchSurplus();
    void refetchCenters();
  };

  const handleLogDonation = async () => {
    resetDonationError();
    if (selectedCenter === undefined) return;
    try {
      await createDonation({
        surplusId: selectedSurplus?.id,
        donationCenterId: selectedCenter.id,
        approximateWeightLbs: 12,
        notes: 'Kept covered and chilled until drop-off.',
      }).unwrap();
      router.push('/host/donation-success');
    } catch {
      // surfaced via donationError
    }
  };

  const logDisabled = queriesLoading || isLoggingDonation || selectedCenter === undefined;

  const fieldsCard = queriesLoading ? (
    <Card variant="soft">
      <View style={styles.loadingBlock}>
        <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading donation data" />
      </View>
    </Card>
  ) : queriesError ? (
    <Card variant="soft">
      <Text style={styles.errorText}>{queryErrorMessage(combinedQueryError)}</Text>
      <SecondaryButton label="Try again" onPress={() => void refetchAll()} style={styles.retryButton} />
    </Card>
  ) : selectedSurplus === undefined || selectedCenter === undefined ? (
    <Card variant="soft" accentColor={colors.navy}>
      <Text style={styles.errorText}>
        Donation logging needs at least one surplus item and a donation center. Open Surplus and Donate tabs
        first, then try again.
      </Text>
    </Card>
  ) : (
    <Card variant="soft">
      <Field label="Select surplus item" value={selectedSurplus.foodName} />
      <Field label="Select donation center" value={selectedCenter.name} />
      <Field label="Approximate weight" value="12 lbs" />
      <Field label="Notes" value="Kept covered and chilled until drop-off." />
    </Card>
  );

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

      {fieldsCard}

      <Text style={styles.disclaimer}>All donations are logged with local demo data for this prototype.</Text>

      {donationError ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.errorText}>{donationErrorMessage(donationError)}</Text>
        </Card>
      ) : null}

      <PrimaryButton
        label="Log Donation"
        onPress={() => void handleLogDonation()}
        disabled={logDisabled}
      />
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
  loadingBlock: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  errorText: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: spacing.md,
  },
});
