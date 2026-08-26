import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { LanguageProvider } from '../i18n/LanguageContext';

// Keep splash visible while auth loads - single source of truth per Expo v57 docs
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { isAuthenticated, isProfileComplete, isLoading } = useAuth();
  const { isDark, colors } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    // Hide native splash once auth resolved
    SplashScreen.hideAsync().catch(() => {});
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';
    const inApp = segments[0] === '(app)';

    // Single guarded navigation - no duplicate router in app/index.tsx
    if (isAuthenticated && isProfileComplete) {
      if (!inApp) router.replace('/(app)/home');
    } else if (isAuthenticated && !isProfileComplete) {
      if (!inOnboarding) router.replace('/(onboarding)/profile-setup');
    } else {
      if (!inAuth) router.replace('/(auth)/welcome');
    }
  }, [isAuthenticated, isProfileComplete, isLoading, segments]);

  // Keep splash screen visible while loading - don't flash LoadingIndicator
  // SplashScreen is controlled natively
  if (isLoading) return null;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
