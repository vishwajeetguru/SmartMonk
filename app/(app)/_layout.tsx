import { Tabs } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { BottomTabBar } from '../../components/layout/BottomTabBar';

export default function AppLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        animation: 'shift',
      }}
    >
      {/* 5 main tabs — Home | Trips | Expense | Reminder | More */}
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarLabel: 'Home' }} />
      <Tabs.Screen name="trips" options={{ title: 'Trips', tabBarLabel: 'Trips' }} />
      <Tabs.Screen name="expense" options={{ title: 'Expense', tabBarLabel: 'Expense' }} />
      <Tabs.Screen name="reminder" options={{ title: 'Reminder', tabBarLabel: 'Reminder' }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarLabel: 'More' }} />

      {/* Hidden — inside More sheet */}
      <Tabs.Screen name="suppliers" options={{ href: null }} />
      <Tabs.Screen name="pumps" options={{ href: null }} />
      <Tabs.Screen name="drivers" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="payments" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
    </Tabs>
  );
}
