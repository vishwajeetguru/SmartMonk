import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppButton } from '../../components/ui/AppButton';
import { TruckIllustration } from '../../components/illustrations/TruckIllustration';

export default function WelcomeScreen() {
  const router = useRouter();
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-10, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <ScreenContainer safeArea style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.illustrationContainer, animatedStyle]}>
          <TruckIllustration size={220} />
        </Animated.View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Welcome to{'\n'}SmartMonk</Text>
          <Text style={styles.subtitle}>
            Your complete transport business management solution. Track vehicles,
            manage drivers, and grow your business — all in one place.
          </Text>

          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>Works Offline</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <AppButton
            title="Get Started"
            onPress={() => router.push('/(auth)/signup')}
            variant="primary"
            size="large"
          />
          <AppButton
            title="I Already Have an Account"
            onPress={() => router.push('/(auth)/login')}
            variant="ghost"
            size="medium"
            style={styles.secondaryButton}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  illustrationContainer: {
    marginBottom: spacing.xxl,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.headingLarge,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
  },
  offlineBadge: {
    marginTop: spacing.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.successLight,
    borderRadius: radius.full,
  },
  offlineText: {
    ...typography.caption,
    color: colors.successDark,
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
  },
  secondaryButton: {
    marginTop: spacing.sm,
  },
});
