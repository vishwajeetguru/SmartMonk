import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppButton } from '../../components/ui/AppButton';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';

export default function SetupCompleteScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = makeStyles(colors);

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  React.useEffect(() => {
    opacity.value = withDelay(300, withTiming(1, { duration: 300 }));
    scale.value = withDelay(300, withSpring(1, { damping: 10, stiffness: 100 }));
  }, []);

  const handleContinue = () => {
    router.replace('/(app)/home');
  };

  return (
    <ScreenContainer safeArea padded={false} style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.successContainer, animatedStyle]}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={60} color={colors.white} />
          </View>
        </Animated.View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{t('onboarding.setupCompleteTitle')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.setupCompleteSubtitle')}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <AppButton
            title={t('onboarding.continueToDashboard')}
            onPress={handleContinue}
            variant="primary"
            size="large"
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
  },
  successContainer: {
    marginBottom: spacing.xxl,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
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
  buttonContainer: {
    width: '100%',
  },
});
