import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { useGetMeQuery, useLogoutMutation } from '@/src/api/endpoints/authApi';
import { useGetCurrentGameQuery } from '@/src/api/endpoints/gamesApi';
import { useGetMyImpactQuery } from '@/src/api/endpoints/impactApi';
import { avatarImages } from '@/src/assets/images';
import { AppHeader, Card, PrimaryButton, Screen, SecondaryButton } from '@/src/components';
import { selectIsAuthenticated } from '@/src/features/auth/authSelectors';
import { useAppSelector } from '@/src/redux/hooks';
import { API_MODE } from '@/src/services/config/env';
import type { CurrentUser } from '@/src/types';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import { messageFromUnknownError } from '@/src/utils/errorMessage';

function displayNameFor(user: CurrentUser): string {
  const d = user.displayName?.trim();
  if (d) return d;
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'TLAC member';
}

function initialsFor(user: CurrentUser): string {
  const i = user.avatarInitials?.trim();
  if (i) return i.toUpperCase().slice(0, 3);
  const a = (user.firstName?.charAt(0) ?? '').toUpperCase();
  const b = (user.lastName?.charAt(0) ?? '').toUpperCase();
  const pair = `${a}${b}`;
  return pair || 'TL';
}

function affiliationFor(user: CurrentUser, gameMatchup?: string): string {
  const label = user.affiliationLabel?.trim();
  if (label) return label;
  const m = gameMatchup?.trim();
  if (m) return `Student/Fan · ${m}`;
  return 'Student/Fan · Gameday';
}

function pickupStreakFor(user: CurrentUser): number {
  if (typeof user.pickupStreak === 'number' && user.pickupStreak >= 0) {
    return user.pickupStreak;
  }
  return 0;
}

function savedTailgateCount(user: CurrentUser): number {
  return Array.isArray(user.savedTailgateIds) ? user.savedTailgateIds.length : 0;
}

export default function ProfileTabScreen() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const skipMeQuery = API_MODE === 'remote' && !isAuthenticated;

  const {
    data: me,
    isLoading: meLoading,
    isError: meError,
    error: meErr,
    refetch: refetchMe,
  } = useGetMeQuery(undefined, { skip: skipMeQuery });

  const [logout, { isLoading: logoutLoading }] = useLogoutMutation();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const { data: currentGame } = useGetCurrentGameQuery();
  const {
    data: impact,
    isLoading: impactLoading,
    isError: impactError,
    error: impactErr,
    refetch: refetchImpact,
  } = useGetMyImpactQuery();

  const queryError = meErr ?? impactErr;
  const queryErrorFlag = meError || impactError;

  const refetchProfileData = () => {
    if (!skipMeQuery) {
      void refetchMe();
    }
    void refetchImpact();
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

  const name = me !== undefined ? displayNameFor(me) : '';
  const initials = me !== undefined ? initialsFor(me) : 'TL';
  const affiliation = me !== undefined ? affiliationFor(me, currentGame?.matchup) : '';
  const streak = me !== undefined ? pickupStreakFor(me) : 0;
  const savedCount = me !== undefined ? savedTailgateCount(me) : 0;
  const avatarImage =
    me?.avatarImageKey !== undefined
      ? (avatarImages as Record<string, ImageSourcePropType>)[me.avatarImageKey]
      : undefined;

  const servingsDisplay =
    impactLoading || impact === undefined ? null : impact.servingsClaimed;
  const wasteDisplay = impactLoading || impact === undefined ? null : impact.wasteDivertedPercent;

  return (
    <Screen scroll safeAreaEdges={['top', 'left', 'right']} contentContainerStyle={styles.content}>
      <AppHeader
        title="Profile"
        subtitle="Your TLAC gameday passport"
        rightAction={
          <Pressable accessibilityRole="button" hitSlop={12} style={styles.iconHit}>
            <Ionicons name="settings-outline" size={22} color={colors.text} />
          </Pressable>
        }
      />

      {API_MODE === 'remote' && !isAuthenticated ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.errorText}>Sign in to view your profile and saved activity.</Text>
          <PrimaryButton label="Sign in" onPress={() => router.push('/login')} style={styles.retryButton} />
        </Card>
      ) : null}

      {queryErrorFlag ? (
        <Card variant="soft">
          <Text style={styles.errorText}>
            {messageFromUnknownError(queryError, 'Could not load profile data.')}
          </Text>
          <SecondaryButton label="Try again" onPress={() => void refetchProfileData()} style={styles.retryButton} />
        </Card>
      ) : null}

      {!skipMeQuery && meLoading && me === undefined ? (
        <Card style={styles.heroCard} accentColor={colors.navy}>
          <View style={styles.heroLoading}>
            <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading profile" />
          </View>
        </Card>
      ) : me !== undefined ? (
        <Card style={styles.heroCard} accentColor={colors.navy}>
          {avatarImage ? (
            <Image source={avatarImage} resizeMode="cover" style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.roleLine}>{affiliation}</Text>
          <View style={styles.statRow}>
            <View style={styles.statCell}>
              {impactLoading ? (
                <ActivityIndicator size="small" color={colors.goldLight} />
              ) : (
                <Text style={styles.statValue}>{servingsDisplay ?? 0}</Text>
              )}
              <Text style={styles.statLabel}>Servings claimed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{savedCount}</Text>
              <Text style={styles.statLabel}>Saved tailgates</Text>
            </View>
          </View>
        </Card>
      ) : null}

      <Text style={styles.sectionLabel}>Gameday activity</Text>
      <Card variant="soft">
        <View style={styles.rowBetween}>
          <View style={styles.rowLeft}>
            <Ionicons name="leaf-outline" size={22} color={colors.green} />
            <View>
              <Text style={styles.rowTitle}>Waste diverted</Text>
              <Text style={styles.rowSub}>Your share of today’s network total</Text>
            </View>
          </View>
          {impactLoading ? (
            <ActivityIndicator size="small" color={colors.goldLight} />
          ) : (
            <Text style={styles.rowValue}>{wasteDisplay ?? 0}%</Text>
          )}
        </View>
      </Card>

      <Card variant="soft">
        <View style={styles.rowBetween}>
          <View style={styles.rowLeft}>
            <Ionicons name="ribbon-outline" size={22} color={colors.gold} />
            <View>
              <Text style={styles.rowTitle}>Pickup streak</Text>
              <Text style={styles.rowSub}>Surplus reservations honored on time</Text>
            </View>
          </View>
          <Text style={styles.rowValue}>{me !== undefined ? streak : '—'}</Text>
        </View>
      </Card>

      {!skipMeQuery && API_MODE === 'remote' && !meLoading && me === undefined && !queryErrorFlag ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.errorText}>We could not load your account. Try signing in again.</Text>
          <PrimaryButton label="Sign in" onPress={() => router.push('/login')} style={styles.retryButton} />
        </Card>
      ) : null}

      <SecondaryButton
        label={logoutLoading ? 'Signing out…' : 'Log out'}
        onPress={() => void onLogout()}
        disabled={logoutLoading}
      />
      {logoutError !== null ? <Text style={styles.logoutError}>{logoutError}</Text> : null}

      <PrimaryButton label="Browse tailgates" onPress={() => router.push('/discover')} />
      <SecondaryButton label="Open host dashboard" onPress={() => router.push('/dashboard')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  iconHit: {
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    alignItems: 'flex-end',
  },
  heroCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  heroLoading: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    width: '100%',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: colors.cream,
  },
  avatarText: {
    color: colors.textInverse,
    fontSize: typography.subheading,
    fontWeight: '900',
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
  sectionLabel: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
  },
  rowValue: {
    color: colors.goldLight,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  errorText: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: spacing.md,
  },
  logoutError: {
    color: colors.muted,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
});
