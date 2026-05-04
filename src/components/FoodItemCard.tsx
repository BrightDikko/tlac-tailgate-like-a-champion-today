import { Ionicons } from '@expo/vector-icons';
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
import type { FoodItem, SurplusStatus, TailgateStatus } from '../types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Card } from './Card';
import { StatusChip } from './StatusChip';

type FoodItemCardStatus = TailgateStatus | SurplusStatus;

interface FoodItemCardProps {
  item: FoodItem;
  status?: FoodItemCardStatus;
  quantityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function FoodItemCard({
  item,
  status,
  quantityLabel = 'Prepared',
  style,
}: FoodItemCardProps) {
  const imageSource = item.imageKey ? (foodImages as Record<string, ImageSourcePropType>)[item.imageKey] : undefined;

  return (
    <Card style={style} variant="soft">
      <View style={styles.headerRow}>
        {imageSource ? (
          <Image source={imageSource} resizeMode="cover" style={styles.thumbImage} />
        ) : (
          <View style={styles.thumbFallback}>
            <Ionicons name="restaurant-outline" size={16} color={colors.goldLight} />
          </View>
        )}
        <View style={styles.titleWrap}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.category}>{item.category}</Text>
        </View>
        {status ? <StatusChip status={status} showDot={false} /> : null}
      </View>
      <Text style={styles.description}>{item.description}</Text>
      <View style={styles.footerRow}>
        <Text style={styles.quantityLabel}>{quantityLabel}</Text>
        <Text style={styles.quantityValue}>{item.quantityPrepared}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  thumbImage: {
    width: 54,
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cream,
  },
  thumbFallback: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  titleWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  category: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  description: {
    marginTop: spacing.md,
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
  },
  footerRow: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  quantityValue: {
    color: colors.goldLight,
    fontSize: typography.body,
    fontWeight: '800',
  },
});

