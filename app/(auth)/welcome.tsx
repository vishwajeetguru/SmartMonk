import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
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
  const [showMonk, setShowMonk] = useState(() => Math.random() > 0.5);
  const monkOpacity = useSharedValue(showMonk ? 1 : 0);
  const carOpacity = useSharedValue(showMonk ? 0 : 1);
  const scale = useSharedValue(1);

  useFocusEffect(
    React.useCallback(() => {
      setShowMonk(Math.random() > 0.5);
      return undefined;
    }, [])
  );

  useEffect(() => {
    monkOpacity.value = withTiming(showMonk ? 1 : 0, { duration: 600 });
    carOpacity.value = withTiming(showMonk ? 0 : 1, { duration: 600 });
    scale.value = withSpring(showMonk ? 1 : 0.98, { damping: 12, stiffness: 200 });
  }, [showMonk]);

  useEffect(() => {
    const id = setInterval(() => {
      setShowMonk((p) => !p);
    }, 3500);
    return () => clearInterval(id);
  }, []);

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
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));
  const monkStyle = useAnimatedStyle(() => ({ opacity: monkOpacity.value }));
  const carStyle = useAnimatedStyle(() => ({ opacity: carOpacity.value }));

  return (
    <ScreenContainer safeArea style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.illustrationContainer, animatedStyle]}>
          <View style={styles.illustrationStack}>
            <Animated.View style={[styles.illustrationLayer, monkStyle]}>
              <Image
                source={require('../../assets/images/monk.png')}
                style={styles.monkImage}
                resizeMode="contain"
              />
            </Animated.View>
            <Animated.View style={[styles.illustrationLayer, carStyle]}>
              <TruckIllustration size={220} />
            </Animated.View>
          </View>
          <View style={styles.dotsRow}>
            <View style={[styles.dot, showMonk && styles.dotActive]} />
            <View style={[styles.dot, !showMonk && styles.dotActive]} />
          </View>
          <TouchableOpacity onPress={() => setShowMonk((p) => !p)} activeOpacity={0.7} style={styles.toggleHint}>
            <Text style={styles.toggleText}>{showMonk ? 'Monk • Tap to see Truck' : 'Truck • Tap to see Monk'}</Text>
          </TouchableOpacity>
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
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  illustrationStack: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationLayer: {
    position: 'absolute',
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monkImage: {
    width: 220,
    height: 220,
    borderRadius: 20,
  },
  dotsRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 18 },
  toggleHint: { marginTop: 6, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: colors.primarySurface, borderRadius: radius.full },
  toggleText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  textContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
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
