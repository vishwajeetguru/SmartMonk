import { Tabs } from 'expo-router';
import { colors } from '../../constants/colors';
import { BottomTabBar } from '../../components/layout/BottomTabBar';

export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        animation: 'shift',
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarLabel: 'Home' }} />
      <Tabs.Screen name="suppliers" options={{ title: 'Suppliers', tabBarLabel: 'Suppliers' }} />
      <Tabs.Screen name="pumps" options={{ title: 'Pumps', tabBarLabel: 'Pumps' }} />
      <Tabs.Screen name="trips" options={{ title: 'Trips', tabBarLabel: 'Trips' }} />
      <Tabs.Screen name="drivers" options={{ title: 'Drivers', tabBarLabel: 'Drivers' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarLabel: 'Profile' }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
    </Tabs>
  );
}
