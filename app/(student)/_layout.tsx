import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors } from '@/src/theme/colors';
import { appTabBarScreenOptions } from '@/src/theme/tabBar';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: IconName, focused: boolean) {
  return <Ionicons name={name} size={22} color={focused ? colors.goldLight : colors.muted} />;
}

export default function StudentShellLayout() {
  return (
    <Tabs initialRouteName="discover" screenOptions={appTabBarScreenOptions}>
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ focused }) => tabIcon(focused ? 'compass' : 'compass-outline', focused),
        }}
      />
      <Tabs.Screen
        name="near-me"
        options={{
          title: 'Near Me',
          tabBarIcon: ({ focused }) => tabIcon(focused ? 'map' : 'map-outline', focused),
        }}
      />
      <Tabs.Screen
        name="surplus"
        options={{
          title: 'Surplus',
          tabBarIcon: ({ focused }) =>
            tabIcon(focused ? 'leaf' : 'leaf-outline', focused),
        }}
      />
      <Tabs.Screen
        name="impact"
        options={{
          title: 'Impact',
          tabBarIcon: ({ focused }) =>
            tabIcon(focused ? 'stats-chart' : 'stats-chart-outline', focused),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => tabIcon(focused ? 'person' : 'person-outline', focused),
        }}
      />
    </Tabs>
  );
}
