import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { useGetCurrentGameQuery } from '@/src/api/endpoints/gamesApi';
import { useGetTailgatesQuery } from '@/src/api/endpoints/tailgatesApi';
import { placeImages } from '@/src/assets/images';
import { AppHeader, Card, Screen, SectionHeader, SecondaryButton, TailgateCard } from '@/src/components';
import { menuItems } from '@/src/data/demoData';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

function nearMeErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const d = (err as { data: unknown }).data;
    if (d && typeof d === 'object' && d !== null && 'message' in d) {
      return String((d as { message: string }).message);
    }
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return 'Could not load nearby tailgates.';
}

function distanceValue(distance: string) {
  const match = distance.match(/[\d.]+/);
  if (!match) return Number.POSITIVE_INFINITY;
  const n = parseFloat(match[0]);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

export default function NearMeTabScreen() {
  const {
    data: currentGame,
    isLoading: gameLoading,
    isError: gameError,
    error: gameErr,
    refetch: refetchGame,
  } = useGetCurrentGameQuery();
  const {
    data: tailgatesResponse,
    isLoading: tailgatesLoading,
    isError: tailgatesError,
    error: tailgatesErr,
    refetch: refetchTailgates,
  } = useGetTailgatesQuery();

  const tailgatesList = tailgatesResponse?.data ?? [];
  const isLoading = gameLoading || tailgatesLoading;
  const isError = gameError || tailgatesError;
  const combinedError = gameErr ?? tailgatesErr;

  const sorted = [...tailgatesList].sort((a, b) => distanceValue(a.distance) - distanceValue(b.distance));
  const anchor = sorted[0];

  const refetchNearMe = () => {
    void refetchGame();
    void refetchTailgates();
  };

  return (
    <Screen scroll safeAreaEdges={['top', 'left', 'right']} contentContainerStyle={styles.content}>
      <AppHeader
        title="Near me"
        subtitle="Walking distance from Notre Dame Stadium"
        rightAction={
          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => router.push('/discover')}
            style={styles.iconHit}
          >
            <Ionicons name="compass-outline" size={22} color={colors.text} />
          </Pressable>
        }
      />

      <Card style={styles.mapCard} variant="soft" accentColor={colors.navy}>
        <ImageBackground source={placeImages['notre-dame-stadium']} resizeMode="cover" style={styles.placeHero}>
          <View style={styles.placeHeroOverlay} />
          <View style={styles.mapHeader}>
            <Ionicons name="location" size={22} color={colors.white} />
            <View style={styles.mapHeaderText}>
              <Text style={styles.mapTitle}>Stadium lots & quads</Text>
              <Text style={styles.mapBody}>
                You are browsing the gameday footprint around {currentGame?.location ?? 'campus'}. Distances are
                estimates for this build.
              </Text>
            </View>
          </View>
        </ImageBackground>
      </Card>

      {isLoading ? (
        <Card variant="soft">
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading near me" />
          </View>
        </Card>
      ) : isError ? (
        <Card variant="soft">
          <Text style={styles.errorText}>{nearMeErrorMessage(combinedError)}</Text>
          <SecondaryButton label="Try again" onPress={() => void refetchNearMe()} style={styles.retryButton} />
        </Card>
      ) : (
        <>
          <SectionHeader
            title="Results near you"
            subtitle="Closest tailgates first — same cards as Discover."
          />

          <View style={styles.list}>
            {sorted.map((tg) => (
              <TailgateCard
                key={tg.id}
                tailgate={tg}
                menuItems={menuItems}
                onViewPress={() => router.push('/student/tailgate-detail')}
                viewLabel="View tailgate"
              />
            ))}
          </View>

          {sorted.length === 0 ? (
            <Card variant="soft" accentColor={colors.navy}>
              <Text style={styles.errorText}>No tailgates to show yet.</Text>
            </Card>
          ) : null}

          {anchor ? (
            <Card style={styles.tipCard} accentColor={colors.gold}>
              <Text style={styles.tipTitle}>Nearest pick</Text>
              <Text style={styles.tipBody}>
                {anchor.groupName} is about {anchor.distance} away — open a card for full menu and host
                details.
              </Text>
            </Card>
          ) : null}
        </>
      )}
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
  mapCard: {
    overflow: 'hidden',
  },
  placeHero: {
    minHeight: 164,
    justifyContent: 'flex-end',
  },
  placeHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 42, 74, 0.45)',
  },
  mapHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    padding: spacing.lg,
  },
  mapHeaderText: {
    flex: 1,
    gap: spacing.sm,
  },
  mapTitle: {
    color: colors.white,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  mapBody: {
    color: '#EEF3FA',
    fontSize: typography.body,
    lineHeight: 22,
  },
  list: {
    gap: spacing.lg,
  },
  tipCard: {
    gap: spacing.md,
  },
  tipTitle: {
    color: colors.goldLight,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  tipBody: {
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
    lineHeight: 22,
  },
  retryButton: {
    marginTop: spacing.md,
  },
});
