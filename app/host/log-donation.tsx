import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useCreateDonationMutation } from '@/src/api/endpoints/donationsApi';
import { useGetDonationCentersQuery } from '@/src/api/endpoints/donationCentersApi';
import { useGetSurplusQuery } from '@/src/api/endpoints/surplusApi';
import { Card, PrimaryButton, Screen, SecondaryButton } from '@/src/components';
import { useRemoteAuthGate } from '@/src/features/auth/remoteAuthGate';
import type { DonationCategory, SurplusItem } from '@/src/types';
import { colors } from '@/src/theme/colors';
import { radii } from '@/src/theme/radii';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import {
  acceptedCategoriesForCenter,
  allDonationCategories,
  categoryLabel,
  centerAcceptsCategory,
} from '@/src/utils/donationCategories';
import { messageFromUnknownError } from '@/src/utils/errorMessage';
import { paramOne } from '@/src/utils/routeParams';

const DEFAULT_NOTES = 'Kept covered and chilled until drop-off.';
const DEFAULT_PACKAGED_DESCRIPTION = 'Bottled water and sealed soda';

function surplusEligible(s: SurplusItem): boolean {
  return s.status === 'available' || s.status === 'almost_gone';
}

function statusLabel(status: SurplusItem['status']): string {
  if (status === 'almost_gone') return 'Almost gone';
  if (status === 'available') return 'Available';
  if (status === 'claimed') return 'Claimed';
  if (status === 'expired') return 'Expired';
  return 'Donated';
}

export default function LogDonationScreen() {
  const { shouldRedirectToLogin } = useRemoteAuthGate();
  const params = useLocalSearchParams<{
    donationCenterId?: string | string[];
    centerId?: string | string[];
    surplusId?: string | string[];
  }>();
  const centerIdParam = paramOne(params.donationCenterId) ?? paramOne(params.centerId);
  const surplusIdParam = paramOne(params.surplusId);
  const centerLockedFromRoute = centerIdParam !== undefined && centerIdParam.trim() !== '';

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

  const [pickedCenterId, setPickedCenterId] = useState<string | undefined>();
  const [pickedSurplusId, setPickedSurplusId] = useState<string | undefined>();
  const [pickedCategory, setPickedCategory] = useState<DonationCategory>('prepared_food');
  const [itemDescription, setItemDescription] = useState(DEFAULT_PACKAGED_DESCRIPTION);
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const initializedCenter = useRef(false);
  const initializedSurplus = useRef(false);

  const surplusList = useMemo(() => surplusResponse?.data ?? [], [surplusResponse?.data]);
  const centersList = useMemo(() => centersResponse?.data ?? [], [centersResponse?.data]);

  const eligibleSurplus = useMemo(() => surplusList.filter(surplusEligible), [surplusList]);

  const queriesLoading = surplusLoading || centersLoading;
  const queriesError = surplusError || centersError;
  const combinedQueryError = surplusErr ?? centersErr;

  const selectedCenter = useMemo(
    () => centersList.find((c) => c.id === pickedCenterId),
    [centersList, pickedCenterId],
  );

  const selectedSurplus = useMemo(
    () => eligibleSurplus.find((s) => s.id === pickedSurplusId),
    [eligibleSurplus, pickedSurplusId],
  );

  const acceptedCategories = selectedCenter ? acceptedCategoriesForCenter(selectedCenter) : [];
  const centerAcceptsSelectedCategory =
    selectedCenter !== undefined ? centerAcceptsCategory(selectedCenter, pickedCategory) : false;
  const isPreparedDonation = pickedCategory === 'prepared_food';
  const hasEligibleSurplus = eligibleSurplus.length > 0;

  useEffect(() => {
    if (queriesLoading || queriesError || centersList.length === 0) return;
    if (initializedCenter.current) return;

    const routeCenterId =
      centerIdParam !== undefined && centersList.some((c) => c.id === centerIdParam) ? centerIdParam : undefined;
    const nextCenterId = routeCenterId ?? centersList[0]?.id;
    setPickedCenterId(nextCenterId);
    initializedCenter.current = true;
  }, [centerIdParam, centersList, queriesError, queriesLoading]);

  useEffect(() => {
    if (queriesLoading || queriesError) return;
    if (initializedSurplus.current) return;

    let nextSurplusId: string | undefined;
    if (surplusIdParam !== undefined && eligibleSurplus.some((s) => s.id === surplusIdParam)) {
      nextSurplusId = surplusIdParam;
    } else {
      nextSurplusId = eligibleSurplus[0]?.id;
    }
    setPickedSurplusId(nextSurplusId);
    initializedSurplus.current = true;
  }, [eligibleSurplus, queriesError, queriesLoading, surplusIdParam]);

  useEffect(() => {
    if (selectedCenter === undefined) return;
    if (centerAcceptsCategory(selectedCenter, pickedCategory)) return;
    const fallback =
      centerAcceptsCategory(selectedCenter, 'prepared_food')
        ? 'prepared_food'
        : acceptedCategoriesForCenter(selectedCenter)[0];
    if (fallback !== undefined) {
      setPickedCategory(fallback);
    }
  }, [selectedCenter, pickedCategory]);

  if (shouldRedirectToLogin) {
    return <Redirect href="/login" />;
  }

  const refetchAll = () => {
    void refetchSurplus();
    void refetchCenters();
  };

  const handleLogDonation = async () => {
    resetDonationError();
    setValidationMessage(null);

    if (selectedCenter === undefined) {
      setValidationMessage('Choose a donation center.');
      return;
    }

    if (!centerAcceptsSelectedCategory) {
      setValidationMessage(
        `This center does not accept ${categoryLabel(pickedCategory).toLowerCase()}. Choose another category or center.`,
      );
      return;
    }

    if (isPreparedDonation && (selectedSurplus === undefined || !hasEligibleSurplus)) {
      setValidationMessage('Prepared food donations require an available surplus listing.');
      return;
    }

    const trimmedItemDescription = itemDescription.trim();
    if (!isPreparedDonation && trimmedItemDescription === '') {
      setValidationMessage('Add a short description for packaged or produce donations.');
      return;
    }

    try {
      const record = await createDonation({
        donationCenterId: selectedCenter.id,
        donationCategory: pickedCategory,
        approximateWeightLbs: 12,
        ...(isPreparedDonation && selectedSurplus !== undefined ? { surplusId: selectedSurplus.id } : {}),
        itemDescription: isPreparedDonation ? selectedSurplus?.foodName : trimmedItemDescription,
        ...(notes.trim() !== '' ? { notes: notes.trim() } : {}),
      }).unwrap();

      router.push({
        pathname: '/host/donation-success',
        params: {
          donationId: record.id,
          donationCenterId: record.donationCenterId,
          donationCategory: record.donationCategory,
          itemDescription: record.itemDescription ?? '',
          centerName: selectedCenter.name,
          ...(record.surplusId !== undefined ? { surplusId: record.surplusId } : {}),
          approximateWeightLbs: String(record.approximateWeightLbs),
        },
      });
    } catch {
      // surfaced via donationError
    }
  };

  const logDisabled =
    queriesLoading ||
    isLoggingDonation ||
    selectedCenter === undefined ||
    !centerAcceptsSelectedCategory ||
    (isPreparedDonation && (!hasEligibleSurplus || selectedSurplus === undefined));

  const fieldsCard = queriesLoading ? (
    <Card variant="soft">
      <View style={styles.loadingBlock}>
        <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading donation data" />
      </View>
    </Card>
  ) : queriesError ? (
    <Card variant="soft">
      <Text style={styles.errorText}>{messageFromUnknownError(combinedQueryError, 'Could not load donation details.')}</Text>
      <SecondaryButton label="Try again" onPress={() => void refetchAll()} style={styles.retryButton} />
    </Card>
  ) : centersList.length === 0 ? (
    <Card variant="soft" accentColor={colors.navy}>
      <Text style={styles.errorText}>No donation centers are available yet.</Text>
    </Card>
  ) : (
    <>
      <Card variant="soft">
        <Text style={styles.fieldLabel}>Donation center</Text>
        {centerLockedFromRoute && selectedCenter !== undefined ? (
          <View style={[styles.optionRow, styles.optionRowActive, styles.lockedCenterRow]}>
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>{selectedCenter.name}</Text>
              <Text style={styles.optionSub}>{selectedCenter.openStatus}</Text>
              <Text style={styles.optionMeta}>
                {acceptedCategoriesForCenter(selectedCenter).map((category) => categoryLabel(category)).join(' · ')}
              </Text>
              <Text style={styles.lockedHint}>Center locked from previous screen.</Text>
            </View>
          </View>
        ) : (
          <View style={styles.optionList}>
            {centersList.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setPickedCenterId(c.id)}
                style={({ pressed }) => [
                  styles.optionRow,
                  pickedCenterId === c.id && styles.optionRowActive,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.optionCopy}>
                  <Text style={styles.optionTitle}>{c.name}</Text>
                  <Text style={styles.optionSub}>{c.openStatus}</Text>
                  <Text style={styles.optionMeta}>
                    {acceptedCategoriesForCenter(c).map((category) => categoryLabel(category)).join(' · ')}
                  </Text>
                </View>
                <Text style={[styles.optionCheck, pickedCenterId === c.id && styles.optionCheckActive]}>
                  {pickedCenterId === c.id ? 'Selected' : 'Choose'}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Donation category</Text>
        <View style={styles.categoryGrid}>
          {allDonationCategories().map((category) => (
            <Pressable
              key={category}
              style={({ pressed }) => [
                styles.categoryTile,
                pickedCategory === category && styles.categoryTileActive,
                pressed && styles.pressed,
              ]}
              onPress={() => setPickedCategory(category)}
            >
              <Text style={[styles.categoryTileText, pickedCategory === category && styles.categoryTileTextActive]}>
                {categoryLabel(category)}
              </Text>
            </Pressable>
          ))}
        </View>

        {selectedCenter !== undefined && !centerAcceptsSelectedCategory ? (
          <Text style={styles.blockHint}>
            This center does not accept {categoryLabel(pickedCategory).toLowerCase()}. Choose another category or
            center.
          </Text>
        ) : null}

        {selectedCenter !== undefined && acceptedCategories.length > 0 ? (
          <Text style={styles.supportedHint}>
            Accepted here: {acceptedCategories.map((category) => categoryLabel(category)).join(', ')}
          </Text>
        ) : null}

        {isPreparedDonation ? (
          <>
            <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Select surplus item</Text>
            {!hasEligibleSurplus ? (
              <Text style={styles.emptySurplus}>
                No surplus listings are available or almost gone right now. Publish or release surplus first, then log
                a prepared-food donation.
              </Text>
            ) : (
              <View style={styles.optionList}>
                {eligibleSurplus.map((s) => (
                  <Pressable
                    key={s.id}
                    style={({ pressed }) => [
                      styles.optionRow,
                      pickedSurplusId === s.id && styles.optionRowActive,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setPickedSurplusId(s.id)}
                  >
                    <View style={styles.optionCopy}>
                      <Text style={styles.optionTitle}>{s.foodName}</Text>
                      <Text style={styles.optionSub}>
                        {s.groupName} · {s.servingsRemaining} servings left
                      </Text>
                      <Text style={styles.optionMeta}>Status: {statusLabel(s.status)}</Text>
                    </View>
                    <Ionicons
                      name={pickedSurplusId === s.id ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={pickedSurplusId === s.id ? colors.goldLight : colors.muted}
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Item description</Text>
            <TextInput
              value={itemDescription}
              onChangeText={setItemDescription}
              placeholder="Bottled water and sealed soda"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          </>
        )}

        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Approximate weight / volume</Text>
        <View style={styles.readOnlyValueWrap}>
          <Text style={styles.readOnlyValue}>12 lbs</Text>
        </View>

        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Drop-off handling notes"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.notesInput]}
          multiline
        />
      </Card>
    </>
  );

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <SecondaryButton label="Back" size="md" onPress={() => router.back()} style={styles.backButton} />
        <Text style={styles.topTitle}>Log Donation</Text>
        <View style={styles.topSpacer} />
      </View>

      <Card accentColor={colors.gold}>
        <Text style={styles.contextTitle}>Finalizing donation</Text>
        <Text style={styles.contextBody}>
          Choose category, center, and item details so TLAC logs impact accurately.
        </Text>
      </Card>

      {fieldsCard}

      {validationMessage ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.errorText}>{validationMessage}</Text>
        </Card>
      ) : null}

      {donationError ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.errorText}>{messageFromUnknownError(donationError, 'Could not log donation.')}</Text>
        </Card>
      ) : null}

      <PrimaryButton label="Log Donation" onPress={() => void handleLogDonation()} disabled={logDisabled} />
      <SecondaryButton label="Back to Donate" onPress={() => router.push('/donate')} />
    </Screen>
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
  fieldLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldLabelSpaced: {
    marginTop: spacing.lg,
  },
  chipWrap: {
    display: 'none',
  },
  categoryGrid: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryTile: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  categoryTileActive: {
    backgroundColor: colors.gold,
    borderColor: colors.goldLight,
  },
  categoryTileText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  categoryTileTextActive: {
    color: colors.textInverse,
  },
  optionList: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  optionRow: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  optionRowActive: {
    borderColor: colors.gold,
    backgroundColor: colors.surfaceSoft,
  },
  optionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  optionTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
    lineHeight: 21,
  },
  optionSub: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '600',
    lineHeight: 18,
  },
  optionMeta: {
    color: colors.goldLight,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  optionCheck: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  optionCheckActive: {
    color: colors.goldLight,
  },
  lockedCenterRow: {
    marginTop: spacing.sm,
  },
  lockedHint: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  emptySurplus: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  blockHint: {
    marginTop: spacing.md,
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '700',
    lineHeight: 18,
  },
  supportedHint: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  input: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  readOnlyValueWrap: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  readOnlyValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  notesInput: {
    minHeight: 88,
    textAlignVertical: 'top',
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
  pressed: {
    opacity: 0.87,
  },
});
