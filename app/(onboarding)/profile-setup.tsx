import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { KeyboardAvoidingContainer } from '../../components/layout/KeyboardAvoidingContainer';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { ProfileAvatar } from '../../components/onboarding/ProfileAvatar';
import { BusinessTypeSelector } from '../../components/onboarding/BusinessTypeSelector';
import { VehicleCountSelector } from '../../components/onboarding/VehicleCountSelector';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { validation } from '../../utils/validation';
import { BusinessType, VehicleCount } from '../../types/profile';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { saveProfile, isLoading, error, clearError } = useProfile();

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [mobile, setMobile] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [vehicleCount, setVehicleCount] = useState<VehicleCount | null>(null);
  const [location, setLocation] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    mobile?: string;
  }>({});

  useEffect(() => {
    if (user) {
      setFullName(user.name);
    }
  }, [user]);

  const validateForm = (): boolean => {
    const nameResult = validation.name(fullName);
    const mobileResult = validation.mobile(mobile);

    const newErrors: { fullName?: string; mobile?: string } = {};

    if (!nameResult.isValid) newErrors.fullName = nameResult.error;
    if (!mobileResult.isValid) newErrors.mobile = mobileResult.error;

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    clearError();
    setFieldErrors({});

    if (!validateForm()) return;
    if (!user) return;

    const success = await saveProfile(user.id, {
      fullName,
      businessName,
      mobile,
      businessType,
      vehicleCount,
      location,
      gstNumber,
      profileImage,
    });

    if (success) {
      router.replace('/(onboarding)/setup-complete');
    }
  };

  return (
    <ScreenContainer safeArea style={styles.container}>
      <KeyboardAvoidingContainer>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Tell us about your transport business
            </Text>
          </View>

          <View style={styles.form}>
            {error && <ErrorMessage message={error} />}

            <ProfileAvatar
              imageUri={profileImage}
              name={fullName}
              onImageSelected={setProfileImage}
            />

            <AppInput
              label="Full Name *"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              autoCapitalize="words"
              error={fieldErrors.fullName}
              leftIcon={
                <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              }
            />

            <AppInput
              label="Business Name"
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Enter business name (optional)"
              autoCapitalize="words"
              leftIcon={
                <Ionicons name="business-outline" size={20} color={colors.textSecondary} />
              }
            />

            <AppInput
              label="Mobile Number *"
              value={mobile}
              onChangeText={setMobile}
              placeholder="Enter mobile number"
              keyboardType="phone-pad"
              error={fieldErrors.mobile}
              leftIcon={
                <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
              }
            />

            <BusinessTypeSelector
              selected={businessType}
              onSelect={setBusinessType}
            />

            <VehicleCountSelector
              selected={vehicleCount}
              onSelect={setVehicleCount}
            />

            <AppInput
              label="Location"
              value={location}
              onChangeText={setLocation}
              placeholder="Enter your location (optional)"
              autoCapitalize="words"
              leftIcon={
                <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
              }
            />

            <AppInput
              label="GST Number"
              value={gstNumber}
              onChangeText={setGstNumber}
              placeholder="Enter GST number (optional)"
              autoCapitalize="characters"
              leftIcon={
                <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
              }
            />

            <AppButton
              title="Complete Setup"
              onPress={handleSaveProfile}
              variant="primary"
              size="large"
              loading={isLoading}
              disabled={isLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingContainer>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    marginTop: spacing.lg,
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
    flex: 1,
  },
});
