import { useEffect } from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { BottomTabBar } from '../../components/layout/BottomTabBar';
import { useSubscription } from '../../hooks/useSubscription';

export default function AppLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const { status, loading } = useSubscription();

  // Gate: once the trial is over and unpaid, force the paywall.
  useEffect(() => {
    if (loading) return;
    const inPaywall = segments[segments.length - 1] === 'paywall';
    if (status === 'expired' && !inPaywall) {
      router.replace('/(app)/paywall');
    }
  }, [status, loading, segments]);

  const hideTabs = segments[segments.length - 1] === 'paywall';

  return (
    <Tabs
      tabBar={(props) => (hideTabs ? null : <BottomTabBar {...props} />)}
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
      <Tabs.Screen name="paywall" options={{ href: null }} />
      <Tabs.Screen name="documents" options={{ href: null }} />
    </Tabs>
  );
}
