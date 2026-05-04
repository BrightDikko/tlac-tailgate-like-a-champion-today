import { Ionicons } from '@expo/vector-icons';
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { avatarImages, placeholderImages, tailgateImages } from '../assets/images';
import type { FoodItem, Tailgate, TailgateImageTone } from '../types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Card } from './Card';
import { PrimaryButton } from './PrimaryButton';
import { StatusChip } from './StatusChip';

type HeroTone = 'navy' | 'gold' | 'cream';

interface TailgateCardProps {
  tailgate: Tailgate;
  menuItems?: FoodItem[];
  onPress?: () => void;
  onViewPress?: () => void;
  viewLabel?: string;
  style?: StyleProp<ViewStyle>;
  highlightLabel?: string;
  /** Used when `tailgate.imageTone` is absent */
  heroTone?: HeroTone;
}

const IMAGE_TONE_GRADIENT: Record<TailgateImageTone, { top: string; bottom: string }> = {
  stadium: { top: '#2A5588', bottom: '#0B2A4A' },
  goldLot: { top: '#B8890F', bottom: '#5C4300' },
  quad: { top: '#3D7A52', bottom: '#1A3324' },
  tailgateClassic: { top: '#6B7587', bottom: '#3A4250' },
  southBendSunset: { top: '#A85E88', bottom: '#4A2640' },
};

const HERO_TONE_FALLBACK: Record<HeroTone, { top: string; bottom: string }> = {
  navy: { top: '#2A5588', bottom: '#0B2A4A' },
  gold: { top: '#B8890F', bottom: '#5C4300' },
  cream: { top: '#6B7587', bottom: '#3A4250' },
};

function heroGradientPair(tailgate: Tailgate, heroTone: HeroTone): { top: string; bottom: string } {
  const tone = tailgate.imageTone;
  if (tone && tone in IMAGE_TONE_GRADIENT) {
    return IMAGE_TONE_GRADIENT[tone];
  }
  return HERO_TONE_FALLBACK[heroTone];
}

function hostInitials(tailgate: Tailgate): string {
  const fromData = tailgate.avatarInitials?.trim();
  if (fromData) return fromData.toUpperCase().slice(0, 3);
  const parts = tailgate.hostName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0]?.charAt(0) ?? '';
    const last = parts[parts.length - 1]?.charAt(0) ?? '';
    return `${first}${last}`.toUpperCase();
  }
  return tailgate.hostName.slice(0, 2).toUpperCase();
}

function menuPreviewLines(tailgate: Tailgate, menuItems?: FoodItem[]): string[] {
  if (tailgate.featuredMenuItems && tailgate.featuredMenuItems.length > 0) {
    return tailgate.featuredMenuItems.slice(0, 4);
  }
  const fromMenu =
    menuItems?.filter((item) => item.tailgateId === tailgate.id).slice(0, 3).map((item) => item.name) ?? [];
  return fromMenu;
}

export function TailgateCard({
  tailgate,
  menuItems,
  onPress,
  onViewPress,
  viewLabel = 'View tailgate',
  style,
  highlightLabel,
  heroTone = 'navy',
}: TailgateCardProps) {
  const previewLines = menuPreviewLines(tailgate, menuItems);
  const { bottom: overlayTint } = heroGradientPair(tailgate, heroTone);
  const cardPress = onViewPress ?? onPress;
  const heroImage =
    (tailgate.imageKey ? (tailgateImages as Record<string, ImageSourcePropType>)[tailgate.imageKey] : undefined) ??
    placeholderImages.tailgate;
  const hostAvatarImage = tailgate.hostAvatarKey
    ? (avatarImages as Record<string, ImageSourcePropType>)[tailgate.hostAvatarKey]
    : undefined;

  return (
    <Card onPress={cardPress} style={style} noPadding>
      <ImageBackground source={heroImage} resizeMode="cover" style={styles.hero}>
        <View style={[styles.heroTint, { backgroundColor: overlayTint }]} />
        <View style={styles.heroOverlay} />
        <View style={styles.heroInner}>
          <View style={styles.heroTopRow}>
            <StatusChip status={tailgate.status} />
            <View style={styles.distancePill}>
              <Ionicons name="navigate-outline" size={14} color={colors.goldLight} />
              <Text style={styles.distancePillText}>{tailgate.distance}</Text>
            </View>
          </View>

          <View style={styles.heroMid}>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {tailgate.groupName}
            </Text>
            {highlightLabel ? (
              <View style={styles.highlightPill}>
                <Text style={styles.highlightText}>{highlightLabel}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.heroRatingRow}>
            <Ionicons name="star" size={16} color="#F4C633" />
            <Text style={styles.heroRatingText}>
              {tailgate.rating.toFixed(1)} · {tailgate.reviewCount} reviews
            </Text>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.content}>
        <View style={styles.hostRow}>
          {hostAvatarImage ? (
            <Image source={hostAvatarImage} style={styles.hostAvatarImage} resizeMode="cover" />
          ) : (
            <View style={styles.hostAvatar}>
              <Text style={styles.hostAvatarText}>{hostInitials(tailgate)}</Text>
            </View>
          )}
          <View style={styles.hostCopy}>
            <Text style={styles.hostName}>{tailgate.hostName}</Text>
            <Text style={styles.groupType}>{tailgate.groupType}</Text>
          </View>
        </View>

        {tailgate.campusZone ? (
          <View style={styles.metaLine}>
            <Ionicons name="business-outline" size={16} color={colors.muted} />
            <Text style={styles.metaLineText}>{tailgate.campusZone}</Text>
          </View>
        ) : null}

        {tailgate.servingWindow ? (
          <View style={styles.metaLine}>
            <Ionicons name="time-outline" size={16} color={colors.muted} />
            <Text style={styles.metaLineText}>{tailgate.servingWindow}</Text>
          </View>
        ) : null}

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={18} color={colors.goldLight} style={styles.locationIcon} />
          <Text style={styles.locationText}>{tailgate.locationDetail}</Text>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statPill}>{tailgate.attendeeEstimate}+ around the tent</Text>
          <Text style={styles.statPill}>Buzz {tailgate.trendingScore}</Text>
        </View>

        <Text style={styles.description} numberOfLines={4}>
          {tailgate.description}
        </Text>

        <View style={styles.tagsRow}>
          {tailgate.tags.map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {previewLines.length > 0 ? (
          <View style={styles.menuPreview}>
            <Text style={styles.menuPreviewTitle}>Featured on the menu</Text>
            {previewLines.map((name) => (
              <View key={name} style={styles.menuPreviewRow}>
                <View style={styles.menuBullet} />
                <Text style={styles.menuPreviewItem}>{name}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {cardPress ? <PrimaryButton label={viewLabel} onPress={cardPress} style={styles.cta} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 196,
    overflow: 'hidden',
  },
  heroTint: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  heroInner: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  heroTopRow: {
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(2, 11, 21, 0.76)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  distancePillText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  heroMid: {
    zIndex: 1,
    gap: spacing.sm,
  },
  heroTitle: {
    color: colors.white,
    fontSize: typography.heading,
    fontWeight: '800',
    lineHeight: 30,
  },
  highlightPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: colors.goldLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
  },
  highlightText: {
    color: colors.textInverse,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  heroRatingRow: {
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroRatingText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cream,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.cream,
  },
  hostAvatarText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  hostCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  hostName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  groupType: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaLine: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaLineText: {
    flex: 1,
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '600',
    lineHeight: 18,
  },
  locationRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  locationIcon: {
    marginTop: 2,
  },
  locationText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
    lineHeight: 22,
  },
  statsRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statPill: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '700',
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  description: {
    marginTop: spacing.lg,
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 24,
  },
  tagsRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tagChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
  },
  tagText: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  menuPreview: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  menuPreviewTitle: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  menuPreviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  menuBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
    marginTop: 7,
  },
  menuPreviewItem: {
    flex: 1,
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
    fontWeight: '600',
  },
  cta: {
    marginTop: spacing.xl,
  },
});
