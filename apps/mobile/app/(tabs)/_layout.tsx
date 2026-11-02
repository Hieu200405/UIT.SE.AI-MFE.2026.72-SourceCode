import { Tabs } from 'expo-router';
import { Icon } from '../../src/ui/Icon';
import { C } from '../../src/theme';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: C.tealDark, tabBarInactiveTintColor: C.faint }}>
      <Tabs.Screen name="index" options={{ title: 'Practice', tabBarIcon: ({ color }) => <Icon name="speech" color={color} size={22} /> }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: ({ color }) => <Icon name="chart" color={color} size={22} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Icon name="profile" color={color} size={22} /> }} />
    </Tabs>
  );
}
