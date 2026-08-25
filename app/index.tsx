import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing } from '../constants/spacing';
import { useAuth } from '../hooks/useAuth';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isProfileComplete, isLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const textOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const progressOpacity = useSharedValue(0);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progressOpacity.value,
  }));

  useEffect(() => {
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    logoScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 100 }));

    textOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    taglineOpacity.value = withDelay(900, withTiming(1, { duration: 500 }));
    progressOpacity.value = withDelay(1200, withTiming(1, { duration: 300 }));

    const timer = setTimeout(async () => {
      setIsReady(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady || isLoading) return;
    if (isAuthenticated && isProfileComplete) {
      router.replace('/(app)/home');
    } else if (isAuthenticated && !isProfileComplete) {
      router.replace('/(onboarding)/profile-setup');
    } else {
      router.replace('/(auth)/welcome');
    }
  }, [isReady, isAuthenticated, isProfileComplete, isLoading]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>SM</Text>
          </View>
        </Animated.View>

        <Animated.Text style={[styles.brandName, textAnimatedStyle]}>
          SmartMonk
        </Animated.Text>

        <Animated.Text style={[styles.tagline, taglineAnimatedStyle]}>
          Transport Made Simple
        </Animated.Text>
      </View>

      <Animated.View style={[styles.progressContainer, progressAnimatedStyle]}>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    ...typography.headingLarge,
    color: colors.white,
    fontWeight: '700',
  },
  brandName: {
    ...typography.headingLarge,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 100,
    width: 100,
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 1.5,
  },
});
