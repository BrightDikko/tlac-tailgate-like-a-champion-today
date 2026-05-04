import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors } from '@/src/theme/colors';
import { appTabBarScreenOptions } from '@/src/theme/tabBar';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: IconName, focused: boolean) {
  return <Ionicons name={name} size={22} color={focused ? colors.goldLight : colors.muted} />;
}

export default function HostShellLayout() {
  return (
    <Tabs initialRouteName="dashboard" screenOptions={appTabBarScreenOptions}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => tabIcon(focused ? 'grid' : 'grid-outline', focused),
        }}
      />
      <Tabs.Screen
        name="publish"
        options={{
          title: 'Publish',
          tabBarIcon: ({ focused }) => tabIcon(focused ? 'leaf' : 'leaf-outline', focused),
        }}
      />
      <Tabs.Screen
        name="donate"
        options={{
          title: 'Donate',
          tabBarIcon: ({ focused }) => tabIcon(focused ? 'heart' : 'heart-outline', focused),
        }}
      />
      <Tabs.Screen
        name="reach"
        options={{
          title: 'Reach',
          tabBarIcon: ({ focused }) => tabIcon(focused ? 'people' : 'people-outline', focused),
        }}
      />
    </Tabs>
  );
}
