import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useGetMeQuery, useLogoutMutation } from '@/src/api/endpoints/authApi';
import { useGetMyImpactQuery } from '@/src/api/endpoints/impactApi';
import { useGetSurplusQuery } from '@/src/api/endpoints/surplusApi';
import { useGetTailgatesQuery } from '@/src/api/endpoints/tailgatesApi';
import { Card, HostBrandedHeader, PrimaryButton, Screen, SecondaryButton, UserAvatar } from '@/src/components';
import { selectIsAuthenticated } from '@/src/features/auth/authSelectors';
import { useAppSelector } from '@/src/redux/hooks';
import { API_MODE } from '@/src/services/config/env';
import type { CurrentUser } from '@/src/types';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import { messageFromUnknownError } from '@/src/utils/errorMessage';

function displayNameFor(user?: CurrentUser): string {
  const explicit = user?.displayName?.trim();
  if (explicit) return explicit;
  const first = user?.firstName?.trim() ?? '';
  const last = user?.lastName?.trim() ?? '';
  const combined = `${first} ${last}`.trim();
  return combined || 'Host';
}

function roleLineFor(user?: CurrentUser): string {
  const affiliation = user?.affiliationLabel?.trim();
  if (!affiliation) return 'Host · TLAC gameday coordinator';
  const cleaned = affiliation.replace(/student\/fan/gi, '').replace(/student/gi, '').trim();
  return cleaned ? `Host · ${cleaned}` : 'Host · TLAC gameday coordinator';
}

export default function HostProfileTabScreen() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const skipMeQuery = API_MODE === 'remote' && !isAuthenticated;
  const skipImpactQuery = API_MODE === 'remote' && !isAuthenticated;

  const {
    data: currentUser,
    isLoading: meLoading,
    isError: meError,
    error: meErr,
    refetch: refetchMe,
  } = useGetMeQuery(undefined, { skip: skipMeQuery });

  const [logout, { isLoading: logoutLoading }] = useLogoutMutation();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const userId = currentUser?.id;

  const {
    data: tailgatesResponse,
    isLoading: tailgatesLoading,
    isError: tailgatesError,
    error: tailgatesErr,
    refetch: refetchTailgates,
  } = useGetTailgatesQuery(userId ? { hostUserId: userId } : undefined, { skip: !userId });

  const {
    data: surplusResponse,
    isLoading: surplusLoading,
    isError: surplusError,
    error: surplusErr,
    refetch: refetchSurplus,
  } = useGetSurplusQuery();

  const {
    data: impact,
    isLoading: impactLoading,
    isError: impactError,
    error: impactErr,
    refetch: refetchImpact,
  } = useGetMyImpactQuery(undefined, { skip: skipImpactQuery });

  const hostTailgates = tailgatesResponse?.data ?? [];
  const allSurplus = surplusResponse?.data ?? [];

  const hostTailgateIds = new Set(hostTailgates.map((t) => t.id));
  const hostSurplus = allSurplus.filter((s) => hostTailgateIds.has(s.tailgateId));
  const availableHostSurplus = hostSurplus.filter((s) => s.status === 'available' || s.status === 'almost_gone');
  const servingsRemaining = availableHostSurplus.reduce((sum, s) => sum + s.servingsRemaining, 0);

  const activeCount = hostTailgates.filter((t) => t.status === 'active').length;
  const plannedCount = hostTailgates.filter((t) => t.status === 'planned').length;
  const completedCount = hostTailgates.filter((t) => t.status === 'completed').length;

  const queriesLoading =
    (!skipMeQuery && meLoading) ||
    (Boolean(userId) && (tailgatesLoading || surplusLoading || (!skipImpactQuery && impactLoading)));
  const hasQueryError =
    meError || (Boolean(userId) && (tailgatesError || surplusError || (!skipImpactQuery && impactError)));
  const combinedError = meErr ?? tailgatesErr ?? surplusErr ?? (skipImpactQuery ? undefined : impactErr);

  const refetchAll = () => {
    if (!skipMeQuery) {
      void refetchMe();
    }
    if (userId) {
      void refetchTailgates();
    }
    void refetchSurplus();
    if (!skipImpactQuery) {
      void refetchImpact();
    }
  };

  const onLogout = async () => {
    setLogoutError(null);
    try {
      await logout().unwrap();
      router.replace(API_MODE === 'remote' ? '/login' : '/welcome');
    } catch (err) {
      setLogoutError(messageFromUnknownError(err, 'Sign out failed. Please try again.'));
    }
  };

  const name = displayNameFor(currentUser);
  const roleLine = roleLineFor(currentUser);

  return (
    <Screen scroll safeAreaEdges={['top', 'left', 'right']} contentContainerStyle={styles.content}>
      <HostBrandedHeader subtitle="Host · Profile" />

      {queriesLoading ? (
        <Card variant="soft">
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading host profile" />
          </View>
        </Card>
      ) : null}

      {!queriesLoading && hasQueryError ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.errorText}>{messageFromUnknownError(combinedError, 'Could not load host profile data.')}</Text>
          <SecondaryButton label="Try again" onPress={() => void refetchAll()} style={styles.retryButton} />
        </Card>
      ) : null}

      {!queriesLoading && !hasQueryError && !currentUser ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.errorText}>Sign in to view your host profile.</Text>
          {API_MODE === 'remote' ? (
            <PrimaryButton
              label="Sign in"
              onPress={() => router.push({ pathname: '/login', params: { redirectTo: '/dashboard' } })}
              style={styles.retryButton}
            />
          ) : null}
        </Card>
      ) : null}

      {!queriesLoading && !hasQueryError && currentUser ? (
        <>
          <Card style={styles.heroCard} accentColor={colors.navy}>
            <UserAvatar user={currentUser} size={104} borderColor={colors.gold} fallbackInitials="TL" />
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.roleLine}>{roleLine}</Text>
            <View style={styles.statRow}>
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{hostTailgates.length}</Text>
                <Text style={styles.statLabel}>Tailgates hosted</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{activeCount}</Text>
                <Text style={styles.statLabel}>Active today</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{availableHostSurplus.length}</Text>
                <Text style={styles.statLabel}>Surplus listings</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{servingsRemaining}</Text>
                <Text style={styles.statLabel}>Servings available</Text>
              </View>
            </View>
          </Card>

          <Card variant="soft">
            <View style={styles.rowBetween}>
              <View style={styles.rowLeft}>
                <Ionicons name="leaf-outline" size={22} color={colors.green} />
                <View>
                  <Text style={styles.rowTitle}>Donation impact</Text>
                  <Text style={styles.rowSub}>Pounds routed through TLAC donation pathways</Text>
                </View>
              </View>
              <Text style={styles.rowValue}>
                {impact?.poundsDonated !== undefined ? `${impact.poundsDonated} lbs` : 'Not available'}
              </Text>
            </View>
          </Card>

          <Card variant="soft">
            <View style={styles.rowBetween}>
              <View style={styles.rowLeft}>
                <Ionicons name="flag-outline" size={22} color={colors.goldLight} />
                <View>
                  <Text style={styles.rowTitle}>Host readiness</Text>
                  <Text style={styles.rowSub}>Planned, active, and completed tailgate coverage</Text>
                </View>
              </View>
            </View>
            <View style={styles.readinessRow}>
              <Text style={styles.readinessText}>Planned: {plannedCount}</Text>
              <Text style={styles.readinessText}>Active: {activeCount}</Text>
              <Text style={styles.readinessText}>Completed: {completedCount}</Text>
            </View>
          </Card>

          <Card variant="soft">
            <View style={styles.rowLeft}>
              <Ionicons name="eye-outline" size={22} color={colors.goldLight} />
              <View style={styles.flexOne}>
                <Text style={styles.rowTitle}>Student/Fan visibility</Text>
                <Text style={styles.rowSub}>
                  Active tailgates and surplus listings appear in Discover and Surplus feeds for nearby students.
                </Text>
              </View>
            </View>
          </Card>

          <SecondaryButton
            label={logoutLoading ? 'Signing out…' : 'Log out'}
            onPress={() => void onLogout()}
            disabled={logoutLoading}
          />
          {logoutError !== null ? <Text style={styles.logoutError}>{logoutError}</Text> : null}

          <PrimaryButton label="Manage host dashboard" onPress={() => router.push('/dashboard')} />
          <SecondaryButton label="Open Student / Fan Discover" onPress={() => router.push('/discover')} />
          <SecondaryButton label="Donation centers" onPress={() => router.push('/donate')} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
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
  heroCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  name: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  roleLine: {
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    width: '100%',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  statCell: {
    alignItems: 'center',
    minWidth: 120,
  },
  statValue: {
    color: colors.goldLight,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  statLabel: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  rowTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  rowSub: {
    color: colors.muted,
    fontSize: typography.caption,
    marginTop: 2,
    lineHeight: 18,
  },
  rowValue: {
    color: colors.goldLight,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  readinessRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  readinessText: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  flexOne: {
    flex: 1,
  },
  logoutError: {
    color: colors.muted,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
});
