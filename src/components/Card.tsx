import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type CardVariant = 'default' | 'soft' | 'outlined';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  variant?: CardVariant;
  noPadding?: boolean;
  accentColor?: string;
}

function getCardVariantStyles(variant: CardVariant) {
  switch (variant) {
    case 'soft':
      return styles.soft;
    case 'outlined':
      return styles.outlined;
    case 'default':
    default:
      return styles.default;
  }
}

export function Card({
  children,
  style,
  onPress,
  disabled = false,
  variant = 'default',
  noPadding = false,
  accentColor,
}: CardProps) {
  const baseStyles = [styles.base, getCardVariantStyles(variant), !noPadding && styles.padded, style];

  const content = (
    <>
      {accentColor ? <View style={[styles.accent, { backgroundColor: accentColor }]} /> : null}
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [baseStyles, pressed && !disabled && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={baseStyles}>{content}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 18,
    elevation: 8,
    overflow: 'hidden',
  },
  padded: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  default: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  soft: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlined: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    opacity: 0.92,
  },
  accent: {
    height: 4,
    width: '100%',
    marginBottom: spacing.xl,
  },
});
