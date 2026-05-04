import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Card } from './Card';

interface MetricCardProps {
  label?: string;
  value: string | number;
  helperText?: string;
  icon?: ReactNode;
  title?: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
  emphasize?: boolean;
}

export function MetricCard({
  label,
  value,
  helperText,
  icon,
  title,
  subtitle,
  style,
  emphasize = false,
}: MetricCardProps) {
  const resolvedLabel = label ?? title ?? '';
  const resolvedHelperText = helperText ?? subtitle;

  return (
    <Card style={style} variant={emphasize ? 'outlined' : 'default'} accentColor={emphasize ? colors.gold : undefined}>
      <View style={styles.headerRow}>
        {resolvedLabel ? <Text style={styles.label}>{resolvedLabel}</Text> : <View />}
        {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      </View>
      <Text style={styles.value}>{value}</Text>
      {resolvedHelperText ? <Text style={styles.helperText}>{resolvedHelperText}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: {
    marginTop: spacing.md,
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '800',
  },
  helperText: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
