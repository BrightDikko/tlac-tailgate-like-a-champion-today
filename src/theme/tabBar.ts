import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet } from 'react-native';

import { colors } from './colors';

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.navy900,
    borderTopColor: colors.borderStrong,
    borderTopWidth: 1,
    paddingTop: Platform.OS === 'web' ? 4 : 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : Platform.OS === 'web' ? 16 : 12,
    minHeight: (Platform.OS === 'web' ? 86 : undefined) as unknown as number,
    /** Let content + safe area define height; fixed heights misalign across devices. */
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 14,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginTop: Platform.OS === 'web' ? 3 : 2,
    marginBottom: Platform.OS === 'web' ? 2 : 0,
    paddingBottom: Platform.OS === 'web' ? 2 : 0,
  },
  tabItem: {
    paddingTop: Platform.OS === 'web' ? 2 : 4,
    paddingBottom: Platform.OS === 'web' ? 8 : 4,
  },
});

/** Shared tab bar styling for Student/Fan and Host shells. */
export const appTabBarScreenOptions: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.goldLight,
  tabBarInactiveTintColor: colors.muted,
  tabBarStyle: styles.tabBar,
  tabBarLabelStyle: styles.tabLabel,
  tabBarItemStyle: styles.tabItem,
  tabBarLabelPosition: 'below-icon',
};
