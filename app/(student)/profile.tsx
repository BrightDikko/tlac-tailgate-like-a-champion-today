import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { avatarImages } from '@/src/assets/images';
import { AppHeader, Card, PrimaryButton, Screen, SecondaryButton } from '@/src/components';
import { currentGame, currentUser, impact } from '@/src/data/localData';
import type { CurrentUser } from '@/src/types';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

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

function affiliationFor(user: CurrentUser): string {
  return user.affiliationLabel?.trim() || `Student/Fan · ${currentGame.matchup}`;
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
  const name = displayNameFor(currentUser);
  const initials = initialsFor(currentUser);
  const affiliation = affiliationFor(currentUser);
  const streak = pickupStreakFor(currentUser);
  const savedCount = savedTailgateCount(currentUser);
  const avatarImage = currentUser.avatarImageKey
    ? (avatarImages as Record<string, ImageSourcePropType>)[currentUser.avatarImageKey]
    : undefined;

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
            <Text style={styles.statValue}>{impact.servingsClaimed}</Text>
            <Text style={styles.statLabel}>Servings claimed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{savedCount}</Text>
            <Text style={styles.statLabel}>Saved tailgates</Text>
          </View>
        </View>
      </Card>

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
          <Text style={styles.rowValue}>{impact.wasteDivertedPercent}%</Text>
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
          <Text style={styles.rowValue}>{streak}</Text>
        </View>
      </Card>

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
});
