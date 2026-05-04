import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../theme/colors';
import { AppHeader } from './AppHeader';

type HostBrandedHeaderProps = {
  subtitle: string;
  rightAction?: ReactNode;
};

/**
 * Host shell header aligned with Student/Fan Discover: TLAC brand, menu, optional right slot.
 */
export function HostBrandedHeader({ subtitle, rightAction }: HostBrandedHeaderProps) {
  return (
    <AppHeader
      title="TLAC"
      subtitle={subtitle}
      rightAction={
        rightAction ?? (
          <Pressable accessibilityRole="button" hitSlop={12} style={styles.iconHit}>
            <View style={styles.avatarRing}>
              <Ionicons name="person" size={18} color={colors.text} />
            </View>
          </Pressable>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  iconHit: {
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  avatarRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
