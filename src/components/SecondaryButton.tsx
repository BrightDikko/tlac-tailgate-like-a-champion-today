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

interface SecondaryButtonProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: ButtonSize;
}

export function SecondaryButton({
  label,
  onPress,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  size = 'lg',
}: SecondaryButtonProps) {
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
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  lg: {
    minHeight: 52,
    paddingVertical: 2,
  },
  md: {
    minHeight: 46,
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
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  pressed: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.gold,
  },
  disabled: {
    opacity: 0.5,
  },
});
