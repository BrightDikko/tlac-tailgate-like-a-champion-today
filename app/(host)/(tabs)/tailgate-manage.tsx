import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { placeholderImages, tailgateImages } from '@/src/assets/images';
import { useGetCurrentGameQuery } from '@/src/api/endpoints/gamesApi';
import { useGetMenuByTailgateIdQuery } from '@/src/api/endpoints/menuApi';
import { useCloseSurplusMutation, useGetSurplusQuery } from '@/src/api/endpoints/surplusApi';
import { useDeleteTailgateMutation, useGetTailgateByIdQuery } from '@/src/api/endpoints/tailgatesApi';
import {
  Card,
  FoodItemCard,
  MetricCard,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionHeader,
  StatusChip,
} from '@/src/components';
import type { SurplusItem, TailgateImageTone } from '@/src/types';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import { isNotFoundError, messageFromUnknownError } from '@/src/utils/errorMessage';
import { paramOne } from '@/src/utils/routeParams';

const IMAGE_TONE_GRADIENT: Record<TailgateImageTone, { bottom: string }> = {
  stadium: { bottom: '#0B2A4A' },
  goldLot: { bottom: '#5C4300' },
  quad: { bottom: '#1A3324' },
  tailgateClassic: { bottom: '#3A4250' },
  southBendSunset: { bottom: '#4A2640' },
};

function heroOverlayBottom(tailgate: { imageTone?: TailgateImageTone }): string {
  const tone = tailgate.imageTone;
  if (tone !== undefined && tone in IMAGE_TONE_GRADIENT) {
    return IMAGE_TONE_GRADIENT[tone].bottom;
  }
  return '#0B2A4A';
}

function heroSource(tailgate: { imageKey?: string }): ImageSourcePropType {
  return (
    (tailgate.imageKey ? (tailgateImages as Record<string, ImageSourcePropType>)[tailgate.imageKey] : undefined) ??
    placeholderImages.tailgate
  );
}

function ManageScreenHeader() {
  return (
    <View style={styles.topRow}>
      <SecondaryButton label="Back" size="md" onPress={() => router.back()} style={styles.backBtn} />
      <Text style={styles.topTitle}>Manage tailgate</Text>
      <View style={styles.topSpacer} />
    </View>
  );
}

export default function TailgateManageScreen() {
  const params = useLocalSearchParams<{ tailgateId?: string | string[] }>();
  const tailgateId = paramOne(params.tailgateId);

  const [deleteTailgate, { isLoading: isDeletingTailgate, error: deleteTailgateErr, reset: resetDeleteTailgateErr }] =
    useDeleteTailgateMutation();
  const [closeSurplus, { isLoading: isClosingSurplus, error: closeSurplusErr, reset: resetCloseSurplusErr }] =
    useCloseSurplusMutation();

  const {
    data: tailgate,
    isLoading: tailgateLoading,
    isError: tailgateError,
    error: tailgateErr,
    refetch: refetchTailgate,
  } = useGetTailgateByIdQuery(tailgateId ?? '', { skip: !tailgateId });

  const {
    data: menuResponse,
    isLoading: menuLoading,
    isError: menuError,
    error: menuErr,
    refetch: refetchMenu,
  } = useGetMenuByTailgateIdQuery({ tailgateId: tailgateId ?? '' }, { skip: !tailgateId });

  const {
    data: currentGame,
    isLoading: gameLoading,
    isError: gameError,
    error: gameErr,
    refetch: refetchGame,
  } = useGetCurrentGameQuery();

  const {
    data: surplusResponse,
    isLoading: surplusLoading,
    isError: surplusError,
    error: surplusErr,
    refetch: refetchSurplus,
  } = useGetSurplusQuery(tailgateId ? { tailgateId } : undefined, { skip: !tailgateId });

  const menuItems = menuResponse?.data ?? [];
  const surplusItems = surplusResponse?.data ?? [];

  const refetchAll = () => {
    void refetchTailgate();
    void refetchMenu();
    void refetchGame();
    void refetchSurplus();
  };

  const confirmDeleteTailgate = (tgId: string, status: 'planned' | 'completed') => {
    const isPlanned = status === 'planned';
    Alert.alert(
      isPlanned ? 'Delete planned tailgate' : 'Archive completed tailgate',
      isPlanned
        ? 'This removes the tailgate, its menu items, and surplus listings from TLAC. This cannot be undone in mock mode.'
        : 'This removes the completed tailgate listing and its related menu and surplus data from TLAC in mock mode.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isPlanned ? 'Delete' : 'Archive',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              resetDeleteTailgateErr();
              try {
                await deleteTailgate(tgId).unwrap();
                router.replace('/dashboard');
              } catch {
                /* surfaced via deleteTailgateErr */
              }
            })();
          },
        },
      ]
    );
  };

  const confirmCloseSurplus = (s: SurplusItem) => {
    if (s.status !== 'available' && s.status !== 'almost_gone') return;
    Alert.alert(
      'Close surplus listing',
      `Close “${s.foodName}”? It will show as expired with zero servings and will no longer accept new claims.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close listing',
          style: 'destructive',
            onPress: () => {
            void (async () => {
              resetCloseSurplusErr();
              try {
                await closeSurplus(s.id).unwrap();
              } catch {
                /* surfaced via closeSurplusErr */
              }
            })();
          },
        },
      ]
    );
  };

  const dataLoading = Boolean(
    tailgateId && (tailgateLoading || menuLoading || gameLoading || surplusLoading)
  );

  const combinedError = tailgateErr ?? menuErr ?? gameErr ?? surplusErr;
  const hasBlockingError =
    tailgateError || menuError || gameError || surplusError;

  if (tailgateId === undefined) {
    return (
      <Screen scroll contentContainerStyle={styles.content}>
        <ManageScreenHeader />
        <Card variant="soft">
          <Text style={styles.muted}>No tailgate selected.</Text>
          <SecondaryButton
            label="Back to dashboard"
            onPress={() => router.replace('/dashboard')}
            style={styles.stackGap}
          />
        </Card>
      </Screen>
    );
  }

  if (dataLoading) {
    return (
      <Screen scroll contentContainerStyle={styles.content}>
        <ManageScreenHeader />
        <Card variant="soft">
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading tailgate" />
          </View>
        </Card>
      </Screen>
    );
  }

  if (tailgateError && isNotFoundError(tailgateErr)) {
    return (
      <Screen scroll contentContainerStyle={styles.content}>
        <ManageScreenHeader />
        <Card variant="soft">
          <Text style={styles.muted}>Tailgate not found.</Text>
          <SecondaryButton
            label="Back to dashboard"
            onPress={() => router.replace('/dashboard')}
            style={styles.stackGap}
          />
        </Card>
      </Screen>
    );
  }

  if (hasBlockingError) {
    return (
      <Screen scroll contentContainerStyle={styles.content}>
        <ManageScreenHeader />
        <Card variant="soft">
          <Text style={styles.muted}>
            {messageFromUnknownError(combinedError, 'Could not load tailgate.')}
          </Text>
          <SecondaryButton label="Try again" onPress={() => void refetchAll()} style={styles.stackGap} />
        </Card>
      </Screen>
    );
  }

  if (tailgate === undefined) {
    return (
      <Screen scroll contentContainerStyle={styles.content}>
        <ManageScreenHeader />
        <Card variant="soft">
          <Text style={styles.muted}>Tailgate not found.</Text>
          <SecondaryButton
            label="Back to dashboard"
            onPress={() => router.replace('/dashboard')}
            style={styles.stackGap}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <ManageScreenHeader />

      <Card noPadding style={styles.heroCard}>
        <ImageBackground source={heroSource(tailgate)} style={styles.manageHero} resizeMode="cover">
          <View style={[styles.manageHeroTint, { backgroundColor: heroOverlayBottom(tailgate) }]} />
          <View style={styles.manageHeroDim} />
          <View style={styles.manageHeroInner}>
            <View style={styles.heroHeader}>
              <StatusChip status={tailgate.status} />
            </View>
            <Text style={styles.manageHeroTitle} numberOfLines={2}>
              {tailgate.groupName}
            </Text>
            <View style={styles.manageHeroRating}>
              <Ionicons name="star" size={16} color="#F4C633" />
              <Text style={styles.manageHeroRatingText}>
                {tailgate.rating.toFixed(1)} · {tailgate.reviewCount} reviews · {tailgate.distance}
              </Text>
            </View>
          </View>
        </ImageBackground>
        <View style={styles.manageHeroBody}>
          <Text style={styles.heroSubtitle}>{tailgate.groupType}</Text>
          <Text style={styles.hostLine}>Hosted by {tailgate.hostName}</Text>
          <View style={styles.manageLocRow}>
            <Ionicons name="location-outline" size={18} color={colors.goldLight} />
            <Text style={[styles.location, styles.manageLocText]}>{tailgate.locationDetail}</Text>
          </View>
          <Text style={styles.description}>{tailgate.description}</Text>
        </View>
      </Card>

      {currentGame ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.contextLabel}>Game context</Text>
          <Text style={styles.contextMatchup}>{currentGame.matchup}</Text>
          <Text style={styles.contextMeta}>Kickoff {currentGame.kickoffTime}</Text>
          <Text style={styles.contextMeta}>{currentGame.location}</Text>
        </Card>
      ) : null}

      <SectionHeader title="Overview" />
      <View style={styles.metricsGrid}>
        <MetricCard label="Menu items" value={String(menuItems.length)} style={styles.metricCard} />
        <MetricCard label="Surplus posts" value={String(surplusItems.length)} style={styles.metricCard} />
        <MetricCard label="Rating" value={tailgate.rating.toFixed(1)} style={styles.metricCard} />
        <MetricCard label="Reviews" value={String(tailgate.reviewCount)} style={styles.metricCard} />
      </View>

      <SectionHeader title="Actions" />
      <View style={styles.actionsCol}>
        <PrimaryButton
          label="Edit tailgate"
          onPress={() =>
            router.push({ pathname: '/edit-tailgate', params: { tailgateId: tailgate.id } })
          }
        />
        <SecondaryButton label="Publish surplus" onPress={() => router.push('/publish')} />
        <SecondaryButton label="Log donation" onPress={() => router.push('/host/log-donation')} />
        <SecondaryButton
          label="Preview as Student / Fan"
          onPress={() =>
            router.push({ pathname: '/student/tailgate-detail', params: { tailgateId: tailgate.id } })
          }
        />
      </View>

      <SectionHeader title="Menu preview" subtitle="Items listed for this tailgate." />
      {menuItems.length > 0 ? (
        <>
          <View style={styles.menuList}>
            {menuItems.map((item) => (
              <FoodItemCard key={item.id} item={item} status={tailgate.status} />
            ))}
          </View>
          <SecondaryButton
            label="Edit menu items"
            onPress={() =>
              router.push({ pathname: '/edit-tailgate', params: { tailgateId: tailgate.id } })
            }
          />
        </>
      ) : (
        <Card variant="soft">
          <Text style={styles.muted}>No menu items yet.</Text>
          <PrimaryButton
            label="Add menu items"
            onPress={() =>
              router.push({ pathname: '/edit-tailgate', params: { tailgateId: tailgate.id } })
            }
            style={styles.stackGap}
          />
        </Card>
      )}

      <SectionHeader title="Surplus" />
      {surplusItems.length > 0 ? (
        <View style={styles.surplusList}>
          {surplusItems.map((s) => (
            <Card key={s.id} style={styles.surplusCard}>
              <View style={styles.surplusTop}>
                <Text style={styles.surplusFood}>{s.foodName}</Text>
                <StatusChip status={s.status} />
              </View>
              <Text style={styles.surplusMeta}>
                {s.servingsRemaining} servings · {s.minutesLeft} min left
              </Text>
              {s.status === 'available' || s.status === 'almost_gone' ? (
                <SecondaryButton
                  label="Close listing"
                  size="md"
                  onPress={() => confirmCloseSurplus(s)}
                  disabled={isClosingSurplus}
                  style={styles.surplusCloseBtn}
                  textStyle={styles.destructiveLabel}
                />
              ) : null}
            </Card>
          ))}
        </View>
      ) : (
        <Card variant="soft">
          <Text style={styles.muted}>No surplus has been published for this tailgate yet.</Text>
        </Card>
      )}

      {closeSurplusErr ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.muted}>
            {messageFromUnknownError(closeSurplusErr, 'Could not close surplus listing.')}
          </Text>
          <SecondaryButton label="Dismiss" size="md" onPress={() => resetCloseSurplusErr()} style={styles.stackGap} />
        </Card>
      ) : null}

      {deleteTailgateErr ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.muted}>
            {messageFromUnknownError(deleteTailgateErr, 'Could not remove tailgate.')}
          </Text>
          <SecondaryButton label="Dismiss" size="md" onPress={() => resetDeleteTailgateErr()} style={styles.stackGap} />
        </Card>
      ) : null}

      <SectionHeader title="Danger zone" />
      {tailgate.status === 'active' ? (
        <Card variant="soft">
          <Text style={styles.muted}>
            Active tailgates cannot be deleted here. Change status to planned or completed first if you need to remove
            this listing.
          </Text>
        </Card>
      ) : null}

      {tailgate.status === 'planned' || tailgate.status === 'completed' ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.destructiveHint}>
            {tailgate.status === 'planned'
              ? 'Deleting removes this planned tailgate and all associated menu and surplus data from TLAC in mock mode.'
              : 'Archiving removes this completed tailgate listing and associated menu and surplus mock data.'}
          </Text>
          <SecondaryButton
            label={tailgate.status === 'planned' ? 'Delete planned tailgate' : 'Archive completed tailgate'}
            size="md"
            onPress={() => {
              const st = tailgate.status;
              if (st === 'planned' || st === 'completed') {
                confirmDeleteTailgate(tailgate.id, st);
              }
            }}
            disabled={isDeletingTailgate}
            textStyle={styles.destructiveLabel}
            style={styles.stackGap}
          />
        </Card>
      ) : null}
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
  backBtn: {
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
  loadingBlock: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  muted: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  destructiveHint: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
    fontWeight: '600',
  },
  destructiveLabel: {
    color: '#B91C1C',
    fontWeight: '800',
  },
  surplusCloseBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  stackGap: {
    marginTop: spacing.md,
  },
  heroCard: {
    borderColor: colors.border,
  },
  manageHero: {
    minHeight: 180,
  },
  manageHeroTint: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  manageHeroDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  manageHeroInner: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  manageHeroTitle: {
    color: colors.white,
    fontSize: typography.heading,
    fontWeight: '900',
    marginTop: spacing.md,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  manageHeroRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  manageHeroRatingText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  manageHeroBody: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.xs,
  },
  manageLocRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  manageLocText: {
    flex: 1,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: colors.goldLight,
    fontSize: typography.body,
    fontWeight: '700',
  },
  hostLine: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  location: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
  description: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 24,
  },
  contextLabel: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contextMatchup: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  contextMeta: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    width: '48%',
    minWidth: 0,
  },
  actionsCol: {
    gap: spacing.sm,
  },
  menuList: {
    gap: spacing.sm,
  },
  surplusList: {
    gap: spacing.sm,
  },
  surplusCard: {
    borderColor: colors.border,
  },
  surplusTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  surplusFood: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  surplusMeta: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '600',
  },
});
