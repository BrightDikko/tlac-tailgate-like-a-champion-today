import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { useRemoteAuthGate } from '@/src/features/auth/remoteAuthGate';
import { appTabBarScreenOptions } from '@/src/theme/tabBar';

type IconName = keyof typeof Ionicons.glyphMap;

type TabBarIconProps = {
  focused: boolean;
  color: string;
  size: number;
};

function tabIcon(filled: IconName, outline: IconName, { focused, color, size }: TabBarIconProps) {
  return <Ionicons name={focused ? filled : outline} size={size} color={color} />;
}

export default function StudentShellLayout() {
  /* Student/Fan and host experiences can overlap, so role is not used as a hard frontend gate. */
  const { shouldRedirectToLogin } = useRemoteAuthGate();

  if (shouldRedirectToLogin) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs initialRouteName="discover" screenOptions={appTabBarScreenOptions}>
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: (props) => tabIcon('compass', 'compass-outline', props),
        }}
      />
      <Tabs.Screen
        name="near-me"
        options={{
          title: 'Near Me',
          tabBarIcon: (props) => tabIcon('map', 'map-outline', props),
        }}
      />
      <Tabs.Screen
        name="surplus"
        options={{
          title: 'Surplus',
          tabBarIcon: (props) => tabIcon('leaf', 'leaf-outline', props),
        }}
      />
      <Tabs.Screen
        name="impact"
        options={{
          title: 'Impact',
          tabBarIcon: (props) => tabIcon('stats-chart', 'stats-chart-outline', props),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: (props) => tabIcon('person', 'person-outline', props),
        }}
      />
    </Tabs>
  );
}
