import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useConfirmClaimMutation, useGetMyClaimsQuery, useReleaseClaimMutation } from '@/src/api/endpoints/claimsApi';
import { useGetSurplusByIdQuery } from '@/src/api/endpoints/surplusApi';
import { Card, PrimaryButton, Screen, SecondaryButton, SectionHeader } from '@/src/components';
import { useRemoteAuthGate } from '@/src/features/auth/remoteAuthGate';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import type { ClaimRecord } from '@/src/types';
import { messageFromUnknownError } from '@/src/utils/errorMessage';
import { paramOne } from '@/src/utils/routeParams';
import { formatClockTime, formatCountdown, formatDurationMinutes } from '@/src/utils/timeDisplay';

function parseExpiresAtMs(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === '') return null;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : null;
}

function resolveActiveClaim(
  claims: ClaimRecord[] | undefined,
  params: { claimRecordId?: string; claimId?: string; surplusId?: string }
): ClaimRecord | undefined {
  if (!claims || claims.length === 0) return undefined;

  if (params.claimRecordId && params.claimRecordId.length > 0) {
    return claims.find((c) => c.id === params.claimRecordId);
  }

  if (params.claimId && params.claimId.length > 0) {
    return claims.find((c) => c.status === 'reserved' && c.claimId === params.claimId);
  }

  if (params.surplusId && params.surplusId.length > 0) {
    const matchingReserved = claims
      .filter((c) => c.status === 'reserved' && c.surplusId === params.surplusId)
      .sort((a, b) => {
        const aMs = a.createdAt ? Date.parse(a.createdAt) : Number.NaN;
        const bMs = b.createdAt ? Date.parse(b.createdAt) : Number.NaN;
        if (Number.isFinite(aMs) && Number.isFinite(bMs)) {
          return bMs - aMs;
        }
        return 0;
      });
    return matchingReserved[0];
  }

  return undefined;
}

export default function PickupTimerScreen() {
  const { shouldRedirectToLogin } = useRemoteAuthGate();
  const params = useLocalSearchParams<{
    claimRecordId?: string;
    claimId?: string;
    surplusId?: string;
    servingsClaimed?: string;
  }>();

  const claimRecordId = paramOne(params.claimRecordId);
  const claimIdParam = paramOne(params.claimId);
  const surplusIdParam = paramOne(params.surplusId);
  const servingsParam = paramOne(params.servingsClaimed);

  const {
    data: claims,
    isLoading: isClaimsLoading,
    isError: isClaimsError,
    error: claimsError,
    refetch: refetchClaims,
  } = useGetMyClaimsQuery();

  const activeClaim = resolveActiveClaim(claims, {
    claimRecordId,
    claimId: claimIdParam,
    surplusId: surplusIdParam,
  });

  const resolvedClaimRecordId = claimRecordId ?? activeClaim?.id;
  const resolvedClaimId = claimIdParam && claimIdParam.length > 0 ? claimIdParam : (activeClaim?.claimId ?? '');
  const resolvedSurplusId =
    surplusIdParam && surplusIdParam.length > 0 ? surplusIdParam : (activeClaim?.surplusId ?? '');

  const [
    confirmClaim,
    { isLoading: isConfirming, error: confirmError, reset: resetConfirmError },
  ] = useConfirmClaimMutation();
  const [releaseClaim, { isLoading: isReleasing, error: releaseError, reset: resetReleaseError }] =
    useReleaseClaimMutation();
  const [actionGuardError, setActionGuardError] = useState<string | null>(null);

  const {
    data: surplusItem,
    isLoading: isSurplusLoading,
    isError: isSurplusError,
    error: surplusError,
    refetch: refetchSurplus,
  } = useGetSurplusByIdQuery(resolvedSurplusId, { skip: resolvedSurplusId.length === 0 });

  const parsedServings = servingsParam !== undefined ? Number.parseInt(servingsParam, 10) : NaN;
  const servingsCount =
    Number.isFinite(parsedServings) && parsedServings > 0
      ? parsedServings
      : (activeClaim?.servingsClaimed ?? 1);

  const canContinue = Boolean(resolvedClaimRecordId) && Boolean(resolvedSurplusId);
  const hasResolvedClaimRecordId =
    resolvedClaimRecordId !== undefined && resolvedClaimRecordId.length > 0;

  const actionBusy = isConfirming || isReleasing;

  const endMs = useMemo(() => parseExpiresAtMs(activeClaim?.expiresAt), [activeClaim?.expiresAt]);
  const [, setTick] = useState(0);
  useEffect(() => {
    if (endMs === null) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [endMs]);
  const remainingSec = endMs === null ? null : Math.max(0, Math.floor((endMs - Date.now()) / 1000));

  if (shouldRedirectToLogin) {
    return <Redirect href="/login" />;
  }

  const performConfirmPickup = async () => {
    setActionGuardError(null);
    resetConfirmError();
    if (!hasResolvedClaimRecordId || resolvedClaimRecordId === undefined) {
      setActionGuardError('Missing backend claim record id. Go back to Surplus and reopen your claim.');
      return;
    }
    try {
      const confirmed = await confirmClaim({ id: resolvedClaimRecordId }).unwrap();
      router.push({
        pathname: '/student/pickup-success',
        params: {
          claimRecordId: confirmed.id,
          claimId: confirmed.claimId ?? resolvedClaimId,
          surplusId: confirmed.surplusId,
          servingsClaimed: String(confirmed.servingsClaimed),
          foodName: surplusItem?.foodName ?? '',
          groupName: surplusItem?.groupName ?? '',
        },
      });
    } catch {
      // surfaced via confirmError
    }
  };

  const performReleaseClaim = async () => {
    setActionGuardError(null);
    resetReleaseError();
    if (!hasResolvedClaimRecordId || resolvedClaimRecordId === undefined) {
      setActionGuardError('Missing backend claim record id. Go back to Surplus and reopen your claim.');
      return;
    }
    try {
      await releaseClaim({ id: resolvedClaimRecordId }).unwrap();
      router.push('/surplus');
    } catch {
      // surfaced via releaseError
    }
  };

  const detailCard = resolvedSurplusId.length > 0 && isSurplusLoading ? (
    <Card variant="soft">
      <View style={styles.loadingBlock}>
        <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading surplus details" />
      </View>
    </Card>
  ) : resolvedSurplusId.length > 0 && isSurplusError ? (
    <Card variant="soft">
      <Text style={styles.errorText}>
        {messageFromUnknownError(surplusError, 'Could not load surplus details.')}
      </Text>
      <SecondaryButton label="Try again" onPress={() => void refetchSurplus()} style={styles.retryButton} />
    </Card>
  ) : (
    <Card variant="soft">
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Food item</Text>
        <Text style={styles.detailValue}>{surplusItem?.foodName ?? 'Not available'}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Host</Text>
        <Text style={styles.detailValue}>{surplusItem?.groupName ?? 'Not available'}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Location</Text>
        <Text style={styles.detailValue}>{surplusItem?.location ?? 'Not available'}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Pickup note</Text>
        <Text style={styles.detailValue}>{surplusItem?.pickupNote ?? 'Not available'}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Claim ID</Text>
        <Text style={styles.detailValue}>{resolvedClaimId || activeClaim?.id || 'Not available'}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Servings</Text>
        <Text style={styles.detailValue}>
          {servingsCount} serving{servingsCount === 1 ? '' : 's'}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Hold window</Text>
        <Text style={styles.detailValue}>{formatDurationMinutes(surplusItem?.pickupWindowMinutes ?? 30)}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Deadline</Text>
        <Text style={styles.detailValue}>{formatClockTime(activeClaim?.expiresAt)}</Text>
      </View>
    </Card>
  );

  if (isClaimsLoading) {
    return (
      <Screen scroll contentContainerStyle={styles.content}>
        <SectionHeader
          title="Reservation confirmed"
          subtitle={
            servingsCount === 1
              ? 'Your serving is held until the pickup deadline below.'
              : 'Your servings are held until the pickup deadline below.'
          }
        />
        <Card variant="soft">
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading claim" />
          </View>
        </Card>
      </Screen>
    );
  }

  if (isClaimsError) {
    return (
      <Screen scroll contentContainerStyle={styles.content}>
        <SectionHeader
          title="Reservation confirmed"
          subtitle={
            servingsCount === 1
              ? 'Your serving is held until the pickup deadline below.'
              : 'Your servings are held until the pickup deadline below.'
          }
        />
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.errorText}>
            {messageFromUnknownError(claimsError, 'Could not load claims.')}
          </Text>
          <SecondaryButton label="Try again" onPress={() => void refetchClaims()} style={styles.retryButton} />
        </Card>
      </Screen>
    );
  }

  if (!canContinue) {
    return (
      <Screen scroll contentContainerStyle={styles.content}>
        <SectionHeader
          title="Reservation confirmed"
          subtitle={
            servingsCount === 1
              ? 'Your serving is held until the pickup deadline below.'
              : 'Your servings are held until the pickup deadline below.'
          }
        />
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.errorText}>No active claim selected.</Text>
          <SecondaryButton label="Back to surplus" onPress={() => router.push('/surplus')} style={styles.retryButton} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionHeader
        title="Reservation confirmed"
        subtitle={
          servingsCount === 1
            ? 'Your serving is held until the pickup deadline below.'
            : 'Your servings are held until the pickup deadline below.'
        }
      />

      <Card style={styles.timerCard} accentColor={colors.gold}>
        {endMs === null ? (
          <>
            <Text style={styles.timerValue}>Pickup deadline unavailable</Text>
            <Text style={styles.timerLabel}>
              Ask the host to hold your reservation, or refresh your pickup details.
            </Text>
          </>
        ) : (
          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>Pickup window ends in</Text>
            <Text style={styles.timerValue}>{formatCountdown(remainingSec)}</Text>
            <Text style={styles.timerSub}>Pickup Deadline: {formatClockTime(activeClaim?.expiresAt)}</Text>
          </View>
        )}
      </Card>

      {detailCard}

      <Card variant="soft">
        <Text style={styles.reliabilityCopy}>
          This countdown is your reservation hold window after claiming.
        </Text>
      </Card>

      {confirmError ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.errorText}>
            {messageFromUnknownError(confirmError, 'Could not confirm pickup.')}
          </Text>
        </Card>
      ) : null}
      {releaseError ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.errorText}>
            {messageFromUnknownError(releaseError, 'Could not release claim.')}
          </Text>
        </Card>
      ) : null}
      {actionGuardError ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.errorText}>{actionGuardError}</Text>
        </Card>
      ) : null}

      <PrimaryButton
        label={isConfirming ? 'Marking picked up…' : 'I picked it up'}
        onPress={() => void performConfirmPickup()}
        disabled={actionBusy || isSurplusLoading || !hasResolvedClaimRecordId}
      />
      <SecondaryButton
        label={isReleasing ? 'Releasing…' : 'Release claim'}
        onPress={() => void performReleaseClaim()}
        disabled={actionBusy || !hasResolvedClaimRecordId}
      />
      <SecondaryButton
        label="Back to surplus"
        onPress={() => router.push('/surplus')}
        disabled={actionBusy}
      />
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
    fontSize: typography.title,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timerContainer: {
    gap: spacing.md,
    alignItems: 'center',
  },
  timerLabel: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  timerSub: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '900',
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
  loadingBlock: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.muted,
    fontSize: typography.body,
  },
  retryButton: {
    marginTop: spacing.md,
  },
});
