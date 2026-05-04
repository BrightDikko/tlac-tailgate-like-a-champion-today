import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type ButtonSize = 'md' | 'lg';

interface PrimaryButtonProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: ButtonSize;
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  size = 'lg',
}: PrimaryButtonProps) {
  const isDisabled = disabled || !onPress;
  const sizeStyle = size === 'md' ? styles.md : styles.lg;

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        sizeStyle,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      <View style={styles.content}>
        {leftIcon ? <View style={styles.iconWrap}>{leftIcon}</View> : null}
        <Text style={[styles.label, textStyle]}>{label}</Text>
        {rightIcon ? <View style={styles.iconWrap}>{rightIcon}</View> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(244, 197, 66, 0.42)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 6,
  },
  lg: {
    minHeight: 54,
    paddingVertical: 2,
  },
  md: {
    minHeight: 48,
    paddingVertical: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.textInverse,
    fontSize: typography.body,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
});
