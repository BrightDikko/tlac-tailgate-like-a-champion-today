import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import type { SurplusStatus, TailgateStatus } from '../types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type StatusValue = TailgateStatus | SurplusStatus;

interface StatusChipProps {
  status: StatusValue;
  label?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  showDot?: boolean;
}

type ChipAppearance = {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  dotColor: string;
  label: string;
};

const STATUS_APPEARANCE: Record<StatusValue, ChipAppearance> = {
  planned: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    textColor: '#FFD28A',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    dotColor: colors.orange,
    label: 'Planned',
  },
  active: {
    backgroundColor: 'rgba(62, 209, 111, 0.16)',
    textColor: '#9CF0BA',
    borderColor: 'rgba(62, 209, 111, 0.42)',
    dotColor: colors.green,
    label: 'Active',
  },
  completed: {
    backgroundColor: 'rgba(170, 183, 198, 0.18)',
    textColor: colors.text,
    borderColor: 'rgba(170, 183, 198, 0.38)',
    dotColor: colors.muted,
    label: 'Completed',
  },
  available: {
    backgroundColor: 'rgba(62, 209, 111, 0.16)',
    textColor: '#9CF0BA',
    borderColor: 'rgba(62, 209, 111, 0.42)',
    dotColor: colors.green,
    label: 'Available',
  },
  almost_gone: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    textColor: '#FFD28A',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    dotColor: colors.gold,
    label: 'Almost Gone',
  },
  claimed: {
    backgroundColor: 'rgba(67, 106, 168, 0.24)',
    textColor: '#D2E4FF',
    borderColor: 'rgba(122, 164, 232, 0.42)',
    dotColor: '#9EC4FF',
    label: 'Claimed',
  },
  expired: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    textColor: '#FFB4B4',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    dotColor: colors.red,
    label: 'Expired',
  },
  donated: {
    backgroundColor: 'rgba(170, 183, 198, 0.18)',
    textColor: colors.text,
    borderColor: 'rgba(170, 183, 198, 0.38)',
    dotColor: colors.muted,
    label: 'Donated',
  },
};

export function StatusChip({ status, label, style, textStyle, showDot = true }: StatusChipProps) {
  const appearance = STATUS_APPEARANCE[status];

  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: appearance.backgroundColor, borderColor: appearance.borderColor },
        style,
      ]}
    >
      {showDot ? <View style={[styles.dot, { backgroundColor: appearance.dotColor }]} /> : null}
      <Text style={[styles.text, { color: appearance.textColor }, textStyle]}>{label ?? appearance.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  text: {
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
