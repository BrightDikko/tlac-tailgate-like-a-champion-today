import { router } from 'expo-router';
import { ActivityIndicator, Image, ImageBackground, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { useGetCurrentGameQuery } from '@/src/api/endpoints/gamesApi';
import { useGetMenuByTailgateIdQuery } from '@/src/api/endpoints/menuApi';
import { useGetTailgateByIdQuery } from '@/src/api/endpoints/tailgatesApi';
import { avatarImages, placeholderImages, tailgateImages } from '@/src/assets/images';
import {
  Card,
  FoodItemCard,
  MetricCard,
  Screen,
  SecondaryButton,
  SectionHeader,
  StatusChip,
} from '@/src/components';
import { reviews } from '@/src/data/demoData';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

const DETAIL_TAILGATE_ID = 'event-1';

function detailErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const d = (err as { data: unknown }).data;
    if (d && typeof d === 'object' && d !== null && 'message' in d) {
      return String((d as { message: string }).message);
    }
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return 'Could not load tailgate details.';
}

export default function TailgateDetailScreen() {
  const {
    data: tailgate,
    isLoading: tailgateLoading,
    isError: tailgateError,
    error: tailgateErr,
    refetch: refetchTailgate,
  } = useGetTailgateByIdQuery(DETAIL_TAILGATE_ID);

  const {
    data: menuResponse,
    isLoading: menuLoading,
    isError: menuError,
    error: menuErr,
    refetch: refetchMenu,
  } = useGetMenuByTailgateIdQuery({ tailgateId: DETAIL_TAILGATE_ID });

  const {
    data: currentGame,
    isLoading: gameLoading,
    isError: gameError,
    error: gameErr,
    refetch: refetchGame,
  } = useGetCurrentGameQuery();

  const tailgateMenu = menuResponse?.data ?? [];
  const topReview = reviews[0];

  const isLoading = tailgateLoading || menuLoading || gameLoading;
  const isError = tailgateError || menuError || gameError;
  const combinedError = tailgateErr ?? menuErr ?? gameErr;

  const refetchAll = () => {
    void refetchTailgate();
    void refetchMenu();
    void refetchGame();
  };

  const heroImage =
    (tailgate?.imageKey
      ? (tailgateImages as Record<string, ImageSourcePropType>)[tailgate.imageKey]
      : undefined) ?? placeholderImages.tailgate;
  const hostAvatar = tailgate?.hostAvatarKey
    ? (avatarImages as Record<string, ImageSourcePropType>)[tailgate.hostAvatarKey]
    : undefined;

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <SecondaryButton label="Back" size="md" onPress={() => router.back()} style={styles.backButton} />
        <Text style={styles.topTitle}>Tailgate Detail</Text>
        <View style={styles.topSpacer} />
      </View>

      {isLoading ? (
        <Card variant="soft">
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading tailgate" />
          </View>
        </Card>
      ) : isError ? (
        <Card variant="soft">
          <Text style={styles.errorText}>{detailErrorMessage(combinedError)}</Text>
          <SecondaryButton label="Try again" onPress={() => void refetchAll()} style={styles.retryButton} />
        </Card>
      ) : tailgate === undefined ? (
        <Card variant="soft">
          <Text style={styles.errorText}>This tailgate could not be found.</Text>
        </Card>
      ) : (
        <>
          <Card noPadding style={styles.heroCard}>
            <ImageBackground source={heroImage} resizeMode="cover" style={styles.heroWrap}>
              <View style={styles.heroOverlay} />
              <StatusChip status={tailgate.status} style={styles.heroStatus} />
              <Text style={styles.heroTitle}>{tailgate.groupName}</Text>
              <Text style={styles.heroSubtitle}>{tailgate.groupType}</Text>
            </ImageBackground>

            <View style={styles.heroContent}>
              <View style={styles.hostRow}>
                {hostAvatar ? <Image source={hostAvatar} resizeMode="cover" style={styles.hostAvatar} /> : null}
                <Text style={styles.hostText}>Hosted by {tailgate.hostName}</Text>
              </View>
              <Text style={styles.location}>{tailgate.locationDetail}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>★ {tailgate.rating.toFixed(1)}</Text>
                <Text style={styles.metaText}>{tailgate.reviewCount} reviews</Text>
                <Text style={styles.metaText}>{tailgate.attendeeEstimate}+ attending</Text>
                <Text style={styles.metaText}>{tailgate.distance}</Text>
              </View>
              <View style={styles.tagsRow}>
                {tailgate.tags.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.description}>{tailgate.description}</Text>
            </View>
          </Card>

          <Card variant="soft">
            <Text style={styles.gameContextTitle}>Game Context</Text>
            <Text style={styles.gameContextText}>
              {currentGame?.matchup ?? ''} • Kickoff {currentGame?.kickoffTime ?? ''}
            </Text>
          </Card>

          <View style={styles.metricsRow}>
            <MetricCard
              label="Rating"
              value={tailgate.rating.toFixed(1)}
              helperText={`${tailgate.reviewCount} reviews`}
              style={styles.metricCard}
            />
            <MetricCard
              label="Distance"
              value={tailgate.distance}
              helperText="From your current area"
              style={styles.metricCard}
            />
          </View>

          <SectionHeader title="Menu" subtitle="What Domer Grill Crew is preparing today." />
          <View style={styles.menuList}>
            {tailgateMenu.map((item) => (
              <FoodItemCard key={item.id} item={item} status="active" />
            ))}
          </View>

          <SectionHeader title="Top Review" />
          <Card variant="soft">
            <Text style={styles.reviewAuthor}>
              {topReview.author} • {topReview.score}/5
            </Text>
            <Text style={styles.reviewComment}>{topReview.comment}</Text>
          </Card>

          <SecondaryButton label="Get directions" disabled />
          <SecondaryButton label="Open host dashboard" onPress={() => router.push('/dashboard')} />
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    minWidth: 84,
  },
  topSpacer: {
    minWidth: 84,
  },
  topTitle: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
    textAlign: 'center',
    flex: 1,
  },
  heroCard: {
    borderColor: '#C9D6E5',
  },
  heroWrap: {
    minHeight: 188,
    padding: spacing.xl,
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 42, 74, 0.42)',
  },
  heroStatus: {
    marginBottom: spacing.sm,
    zIndex: 1,
  },
  heroTitle: {
    color: colors.white,
    fontSize: typography.heading,
    fontWeight: '800',
    zIndex: 1,
  },
  heroSubtitle: {
    marginTop: spacing.xs,
    color: '#DFE7F3',
    fontSize: typography.body,
    fontWeight: '600',
    zIndex: 1,
  },
  heroContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hostAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hostText: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  location: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tagChip: {
    borderRadius: 999,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  tagText: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  description: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 24,
  },
  gameContextTitle: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gameContextText: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: 0,
  },
  menuList: {
    gap: spacing.md,
  },
  reviewAuthor: {
    color: colors.goldLight,
    fontSize: typography.body,
    fontWeight: '800',
  },
  reviewComment: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
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
