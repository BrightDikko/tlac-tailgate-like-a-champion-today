import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet } from 'react-native';

import { colors } from './colors';

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.navy900,
    borderTopColor: colors.borderStrong,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
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
    marginTop: 2,
    marginBottom: 0,
  },
  tabItem: {
    paddingTop: 4,
    paddingBottom: 4,
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
