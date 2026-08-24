import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { KeyboardAvoidingContainer } from '../../components/layout/KeyboardAvoidingContainer';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { SuccessModal } from '../../components/ui/SuccessModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { ProfileAvatar } from '../../components/onboarding/ProfileAvatar';
import { BusinessTypeSelector } from '../../components/onboarding/BusinessTypeSelector';
import { VehicleCountSelector } from '../../components/onboarding/VehicleCountSelector';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { validation } from '../../utils/validation';
import { BusinessType, VehicleCount } from '../../types/profile';

export default function ProfileTabScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { profile, isLoading, error, saveProfile, loadProfile, clearError } = useProfile();
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [mobile, setMobile] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [vehicleCount, setVehicleCount] = useState<VehicleCount | null>(null);
  const [location, setLocation] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ fullName?: string; mobile?: string }>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) loadProfile(user.id);
    }, [user?.id])
  );
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setBusinessName(profile.businessName || '');
      setMobile(profile.mobile || '');
      setBusinessType(profile.businessType || null);
      setVehicleCount(profile.vehicleCount || null);
      setLocation(profile.location || '');
      setGstNumber(profile.gstNumber || '');
      setProfileImage(profile.profileImage || null);
    }
  }, [profile]);

  const validateForm = (): boolean => {
    const nameResult = validation.name(fullName);
    const mobileResult = validation.mobile(mobile);
    const newErrors: { fullName?: string; mobile?: string } = {};
    if (!nameResult.isValid) newErrors.fullName = nameResult.error;
    if (!mobileResult.isValid) newErrors.mobile = mobileResult.error;
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    clearError();
    setFieldErrors({});
    if (!validateForm() || !user) return;
    const success = await saveProfile(user.id, {
      fullName,
      businessName,
      mobile,
      countryCode: profile?.countryCode || '+91',
      dob: profile?.dob || null,
      businessType,
      vehicleCount,
      vehicles: profile?.vehicles || [],
      location,
      gstNumber,
      profileImage,
    });
    if (success) setShowSuccess(true);
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/');
  };

  return (
    <ScreenContainer safeArea style={styles.container}>
      <KeyboardAvoidingContainer>
        <View style={styles.header}>
          <Ionicons name="person-circle" size={28} color={colors.primary} />
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={{ width: 28 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            {error && <ErrorMessage message={error} />}
            <ProfileAvatar imageUri={profileImage} name={fullName} onImageSelected={setProfileImage} />
            <AppInput label="Full Name *" value={fullName} onChangeText={setFullName} placeholder="Full name" autoCapitalize="words" error={fieldErrors.fullName} leftIcon={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />} />
            <AppInput label="Business Name" value={businessName} onChangeText={setBusinessName} placeholder="Business name" leftIcon={<Ionicons name="business-outline" size={20} color={colors.textSecondary} />} />
            <AppInput label="Mobile *" value={mobile} onChangeText={setMobile} placeholder="Mobile" keyboardType="phone-pad" error={fieldErrors.mobile} leftIcon={<Ionicons name="call-outline" size={20} color={colors.textSecondary} />} />
            <BusinessTypeSelector selected={businessType} onSelect={setBusinessType} />
            <VehicleCountSelector selected={vehicleCount} onSelect={setVehicleCount} />
            <AppInput label="Location" value={location} onChangeText={setLocation} placeholder="Location" leftIcon={<Ionicons name="location-outline" size={20} color={colors.textSecondary} />} />
            <AppInput label="GST Number" value={gstNumber} onChangeText={setGstNumber} placeholder="GST" leftIcon={<Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />} />
            <View style={styles.saveButtonWrap}>
              <AppButton title="Save Changes" onPress={handleSave} variant="primary" size="large" loading={isLoading} disabled={isLoading} />
            </View>

            <View style={styles.accountSection}>
              <Text style={styles.accountTitle}>Account</Text>
              <TouchableOpacity style={styles.logoutCard} onPress={() => setShowLogoutModal(true)} activeOpacity={0.7}>
                <View style={styles.logoutIcon}>
                  <Ionicons name="log-out-outline" size={20} color={colors.error} />
                </View>
                <View style={styles.logoutTextWrap}>
                  <Text style={styles.logoutTitle}>Sign Out</Text>
                  <Text style={styles.logoutSubtitle}>You’ll need to sign in again</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
              <Text style={styles.accountHint}>Signed in as {user?.email}</Text>
            </View>
            <View style={{ height: 20 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingContainer>
      <SuccessModal visible={showSuccess} title="Profile Updated!" message="Your profile has been saved." onClose={() => setShowSuccess(false)} />
      <ConfirmationModal
        visible={showLogoutModal}
        title="Sign Out"
        message="Are you sure you want to sign out? You’ll need to log in again to access your account."
        confirmText="Sign Out"
        cancelText="Cancel"
        icon="log-out-outline"
        iconColor={colors.error}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  container: { backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { ...typography.headingSmall, color: colors.textPrimary },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 140 },
  form: { flex: 1 },
  saveButtonWrap: { marginTop: spacing.base, marginBottom: spacing.lg },
  accountSection: { marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight },
  accountTitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm, letterSpacing: 0.5 },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  logoutIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.errorLight, alignItems: 'center', justifyContent: 'center' },
  logoutTextWrap: { flex: 1 },
  logoutTitle: { ...typography.body, fontWeight: '600', color: colors.error },
  logoutSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  accountHint: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.sm },
});
