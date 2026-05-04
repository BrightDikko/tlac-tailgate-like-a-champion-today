import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

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
