import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet } from 'react-native';

import { colors } from './colors';

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.navy900,
    borderTopColor: colors.borderStrong,
    borderTopWidth: 1,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    height: Platform.OS === 'ios' ? 88 : 64,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 16,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  tabItem: {
    paddingTop: 4,
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
};
