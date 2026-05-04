import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { appTabBarScreenOptions } from '@/src/theme/tabBar';

type IconName = keyof typeof Ionicons.glyphMap;

type TabBarIconProps = {
  focused: boolean;
  color: string;
  size: number;
};

/**
 * Filled when selected, outline when not. Uses `size` and `color` from the tab bar so glyphs
 * sit correctly inside React Navigation’s fixed icon wrapper (cross-fade layers).
 */
function tabIcon(filled: IconName, outline: IconName, { focused, color, size }: TabBarIconProps) {
  return <Ionicons name={focused ? filled : outline} size={size} color={color} />;
}

export default function HostShellLayout() {
  return (
    <Tabs initialRouteName="dashboard" screenOptions={appTabBarScreenOptions}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: (props) => tabIcon('grid', 'grid-outline', props),
        }}
      />
      <Tabs.Screen
        name="publish"
        options={{
          title: 'Publish',
          tabBarIcon: (props) => tabIcon('leaf', 'leaf-outline', props),
        }}
      />
      <Tabs.Screen
        name="donate"
        options={{
          title: 'Donate',
          tabBarIcon: (props) => tabIcon('heart', 'heart-outline', props),
        }}
      />
      <Tabs.Screen
        name="reach"
        options={{
          title: 'Reach',
          tabBarIcon: (props) => tabIcon('people', 'people-outline', props),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: (props) => tabIcon('person', 'person-outline', props),
        }}
      />
      <Tabs.Screen
        name="tailgate-manage"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="create-tailgate"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-tailgate"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
