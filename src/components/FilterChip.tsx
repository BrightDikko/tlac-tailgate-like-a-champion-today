import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function FilterChip({ label, selected = false, onPress, style }: FilterChipProps) {
  const chipStyle = [styles.chip, selected && styles.selected, style];
  const textStyle = [styles.text, selected && styles.selectedText];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [chipStyle, pressed && styles.pressed]}>
        <Text style={textStyle}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <View style={chipStyle}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 40,
    justifyContent: 'center',
  },
  selected: {
    borderColor: colors.goldLight,
    backgroundColor: colors.gold,
  },
  text: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  selectedText: {
    color: colors.textInverse,
  },
  pressed: {
    opacity: 0.87,
  },
});
