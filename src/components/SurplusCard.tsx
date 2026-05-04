import type { ReactNode } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { foodImages } from '../assets/images';
import type { SurplusItem } from '../types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Card } from './Card';
import { PrimaryButton } from './PrimaryButton';
import { StatusChip } from './StatusChip';

interface SurplusCardProps {
  item: SurplusItem;
  onClaimPress?: () => void;
  claimLabel?: string;
  /** When true, the claim action is disabled (e.g. while a claim request is in flight). */
  claimDisabled?: boolean;
  style?: StyleProp<ViewStyle>;
  showPickupNote?: boolean;
  footerContent?: ReactNode;
  disabledReason?: string;
}

export function SurplusCard({
  item,
  onClaimPress,
  claimLabel = 'Claim Servings',
  claimDisabled = false,
  style,
  showPickupNote = true,
  footerContent,
  disabledReason,
}: SurplusCardProps) {
  const accentColor =
    item.status === 'almost_gone'
      ? colors.gold
      : item.status === 'available'
        ? colors.green
        : item.status === 'expired'
          ? colors.red
          : colors.navy;
  const imageSource = item.imageKey ? (foodImages as Record<string, ImageSourcePropType>)[item.imageKey] : undefined;

  return (
    <Card style={style} accentColor={accentColor}>
      {imageSource ? <Image source={imageSource} resizeMode="cover" style={styles.heroImage} /> : null}
      <View style={styles.headerRow}>
        <Text style={styles.foodName}>{item.foodName}</Text>
        <StatusChip status={item.status} />
      </View>

      <Text style={styles.groupName}>{item.groupName}</Text>
      <Text style={styles.location}>{item.location}</Text>

      <View style={styles.statGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Servings Left</Text>
          <Text style={styles.statValue}>{item.servingsRemaining}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Minutes Left</Text>
          <Text style={styles.statValue}>{item.minutesLeft}</Text>
        </View>
      </View>

      {item.claimId ? (
        <View style={styles.claimIdRow}>
          <Text style={styles.claimIdLabel}>Claim ID</Text>
          <Text style={styles.claimIdValue}>{item.claimId}</Text>
        </View>
      ) : null}

      {showPickupNote ? <Text style={styles.note}>Pickup note: {item.pickupNote}</Text> : null}

      {footerContent ? <View style={styles.footerWrap}>{footerContent}</View> : null}

      {disabledReason ? <Text style={styles.disabledReason}>{disabledReason}</Text> : null}

      {onClaimPress ? (
        <PrimaryButton
          label={claimLabel}
          onPress={onClaimPress}
          disabled={claimDisabled || Boolean(disabledReason)}
          style={styles.button}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  heroImage: {
    width: '100%',
    height: 148,
    borderRadius: 14,
    marginBottom: spacing.lg,
    backgroundColor: colors.cream,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  foodName: {
    flex: 1,
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
    lineHeight: 24,
  },
  groupName: {
    marginTop: spacing.lg,
    color: colors.goldLight,
    fontSize: typography.body,
    fontWeight: '700',
  },
  location: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  statGrid: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  statLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  claimIdRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  claimIdLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  claimIdValue: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  note: {
    marginTop: spacing.md,
    color: colors.text,
    fontSize: typography.caption,
    lineHeight: 20,
  },
  footerWrap: {
    marginTop: spacing.md,
  },
  disabledReason: {
    marginTop: spacing.md,
    color: colors.muted,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  button: {
    marginTop: spacing.xl,
  },
});

