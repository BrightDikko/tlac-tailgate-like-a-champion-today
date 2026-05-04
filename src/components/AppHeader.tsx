import type { ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { brandImages } from '../assets/images';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
};

export function AppHeader({ title, subtitle, leftAction, rightAction }: AppHeaderProps) {
  const sideSlotWidth = 58;
  const resolvedLeftAction = leftAction ?? <Image source={brandImages.logo} resizeMode="contain" style={styles.logo} />;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.side, { minWidth: sideSlotWidth }]}>{resolvedLeftAction}</View>
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={[styles.side, styles.sideRight, { minWidth: sideSlotWidth }]}>{rightAction}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  side: {
    justifyContent: 'center',
    minHeight: 44,
  },
  logo: {
    width: 42,
    height: 42,
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  title: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
});
