import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { color } from '@kadin/design-tokens';

import { TABS } from '@/navigation/tabs';

const TabsLayout = () => (
  <Tabs
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: color.primary,
      tabBarInactiveTintColor: color.textSecondary,
    }}
  >
    {TABS.map((tab) => (
      <Tabs.Screen
        key={tab.name}
        name={tab.name}
        options={{
          title: tab.label,
          // Derive the tint from `focused` with the same tokens as the tab bar; the navigator's
          // `color` arg is an opaque ColorValue in RN 0.88 that Ionicons' types do not accept.
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={tab.icon}
              color={focused ? color.primary : color.textSecondary}
              size={size}
            />
          ),
        }}
      />
    ))}
  </Tabs>
);

export default TabsLayout;
