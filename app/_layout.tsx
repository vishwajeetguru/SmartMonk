import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../constants/colors';
import { LoadingIndicator } from '../components/ui/LoadingIndicator';

export default function RootLayout() {
  const { isAuthenticated, isProfileComplete, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && isProfileComplete) {
      router.replace('/(app)/home');
    } else if (isAuthenticated && !isProfileComplete) {
      router.replace('/(onboarding)/profile-setup');
    } else {
      router.replace('/(auth)/welcome');
    }
  }, [isAuthenticated, isProfileComplete, isLoading]);

  if (isLoading) {
    return <LoadingIndicator fullScreen />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </SafeAreaProvider>
  );
}
