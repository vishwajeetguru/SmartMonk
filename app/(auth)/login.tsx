import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { KeyboardAvoidingContainer } from '../../components/layout/KeyboardAvoidingContainer';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { useAuth } from '../../hooks/useAuth';
import { validation } from '../../utils/validation';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = makeStyles(colors);
  const { login, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateForm = (): boolean => {
    const emailResult = validation.email(email);
    const passwordResult = validation.password(password);

    const newErrors: { email?: string; password?: string } = {};

    if (!emailResult.isValid) {
      newErrors.email = emailResult.error;
    }
    if (!passwordResult.isValid) {
      newErrors.password = passwordResult.error;
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    clearError();
    setFieldErrors({});

    if (!validateForm()) return;

    const success = await login({ email, password });

    if (success) {
      router.replace('/(app)/home');
    }
  };

  return (
    <ScreenContainer safeArea padded={false} style={styles.container}>
      <KeyboardAvoidingContainer>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>SM</Text>
              </View>
            </View>
            <Text style={styles.title}>{t('auth.loginTitle')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.loginSubtitle')}
            </Text>
          </View>

          <View style={styles.form}>
            {error && <ErrorMessage message={error.message} />}

            <AppInput
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={fieldErrors.email}
              leftIcon={
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              }
            />

            <PasswordInput
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              error={fieldErrors.password}
            />

            <AppButton
              title={t('auth.signIn')}
              onPress={handleLogin}
              variant="primary"
              size="large"
              loading={isLoading}
              disabled={isLoading}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Text
              style={styles.footerLink}
              onPress={() => router.push('/(auth)/signup')}
            >
              Sign Up
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingContainer>
    </ScreenContainer>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.base,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    ...typography.headingMedium,
    color: colors.white,
    fontWeight: '700',
  },
  title: {
    ...typography.headingLarge,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.link,
    color: colors.primary,
    fontWeight: '600',
  },
});
