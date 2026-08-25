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
import { BusinessType, VehicleCount, Vehicle } from '../../types/profile';
import { generateId } from '../../utils/generateId';

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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [exactCount, setExactCount] = useState<number | null>(null);
  const [customCountText, setCustomCountText] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
      const v = profile.vehicles || [];
      setVehicles(v);
      if (profile.vehicleCount === '2-5' || profile.vehicleCount === '6-10') {
        setExactCount(v.length || null);
      } else if (profile.vehicleCount === '10+') {
        setCustomCountText(v.length ? String(v.length) : '');
        setExactCount(null);
      } else {
        setExactCount(null);
        setCustomCountText('');
      }
    }
  }, [profile]);

  const desiredVehicleN = (() => {
    if (!vehicleCount) return 0;
    if (vehicleCount === '1') return 1;
    if (vehicleCount === '10+') {
      const n = parseInt(customCountText, 10);
      if (!isNaN(n) && n > 0) return Math.min(n, 30);
      return 0;
    }
    return exactCount || 0;
  })();

  useEffect(() => {
    if (desiredVehicleN > 0) {
      setVehicles((prev) => {
        if (prev.length === desiredVehicleN) return prev;
        const next: Vehicle[] = [];
        for (let i = 0; i < desiredVehicleN; i++) {
          next.push(prev[i] || { id: generateId(), number: '' });
        }
        return next;
      });
    } else if (desiredVehicleN === 0 && vehicleCount && vehicleCount !== '10+' && vehicleCount !== '1') {
      // keep empty until exact selected
      if (vehicles.length !== 0) setVehicles([]);
    }
    if (vehicleCount === '1' && vehicles.length !== 1) {
      // for '1' ensure one entry
      if (desiredVehicleN === 1 && vehicles.length !== 1) {
        setVehicles((prev) => (prev.length === 1 ? prev : [{ id: generateId(), number: prev[0]?.number || '' }]));
      }
    }
  }, [desiredVehicleN, vehicleCount]);

  const handleVehicleCountSelect = (count: VehicleCount) => {
    setVehicleCount(count);
    setExactCount(null);
    setCustomCountText('');
    setVehicles([]);
    setFieldErrors({});
  };
  const handleExactSelect = (n: number) => {
    setExactCount(n);
    setFieldErrors({});
  };
  const updateVehicleNumber = (index: number, value: string) => {
    setVehicles((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], number: value };
      return copy;
    });
  };

  const validateForm = (): boolean => {
    const nameResult = validation.name(fullName);
    const mobileResult = validation.mobile(mobile);
    const newErrors: Record<string, string> = {};
    if (!nameResult.isValid) newErrors.fullName = nameResult.error!;
    if (!mobileResult.isValid) newErrors.mobile = mobileResult.error!;
    // vehicle validation if count selected
    if (vehicleCount) {
      if (vehicleCount === '10+') {
        const n = parseInt(customCountText, 10);
        if (!n || n <= 0) newErrors.vehicleCount = 'Enter number of vehicles';
      }
      if (['2-5', '6-10'].includes(vehicleCount) && !exactCount) {
        newErrors.vehicleCount = 'Select exact number';
      }
      // check each vehicle number
      for (let i = 0; i < vehicles.length; i++) {
        if (!vehicles[i].number.trim()) {
          newErrors[`vehicle_${i}`] = `Please enter vehicle ${i + 1} number`;
        }
      }
      // uniqueness
      const norm = vehicles.map((v) => v.number.trim().toLowerCase().replace(/\s+/g, ''));
      const seen = new Set<string>();
      for (let i = 0; i < norm.length; i++) {
        if (!norm[i]) continue;
        if (seen.has(norm[i])) newErrors[`vehicle_${i}`] = 'Duplicate number - must be unique';
        else seen.add(norm[i]);
      }
    }
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
      vehicles,
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
            <VehicleCountSelector selected={vehicleCount} onSelect={handleVehicleCountSelect} error={fieldErrors.vehicleCount} />
            {vehicleCount === '10+' && (
              <AppInput
                label="Enter exact number of vehicles"
                value={customCountText}
                onChangeText={(t) => {
                  const cleaned = t.replace(/[^0-9]/g, '');
                  setCustomCountText(cleaned);
                  if (fieldErrors.vehicleCount) setFieldErrors((p) => { const n = { ...p }; delete n.vehicleCount; return n; });
                }}
                placeholder="e.g. 12"
                keyboardType="number-pad"
                error={fieldErrors.vehicleCount}
              />
            )}
            {(vehicleCount === '2-5' || vehicleCount === '6-10') && (
              <View style={{ marginBottom: spacing.base, marginTop: spacing.sm }}>
                <Text style={{ ...typography.label, color: colors.textPrimary, marginBottom: spacing.sm }}>Select exact number</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                  {(vehicleCount === '2-5' ? [2, 3, 4, 5] : [6, 7, 8, 9, 10]).map((n) => (
                    <TouchableOpacity key={n} style={[styles.vehicleChip, exactCount === n && styles.vehicleChipActive]} onPress={() => handleExactSelect(n)}>
                      <Text style={[styles.vehicleChipText, exactCount === n && styles.vehicleChipTextActive]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {fieldErrors.vehicleCount ? <Text style={{ ...typography.caption, color: colors.error, marginTop: spacing.xs }}>{fieldErrors.vehicleCount}</Text> : null}
              </View>
            )}
            {vehicles.length > 0 && (
              <View style={{ marginTop: spacing.base, paddingTop: spacing.base, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
                <Text style={{ ...typography.label, color: colors.textPrimary, marginBottom: 2 }}>Vehicle details ({vehicles.length})</Text>
                <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.base }}>Saved numbers shown — edit as needed</Text>
                {vehicles.map((v, idx) => (
                  <AppInput
                    key={v.id}
                    label={`Vehicle ${idx + 1} *`}
                    value={v.number}
                    onChangeText={(t) => updateVehicleNumber(idx, t)}
                    placeholder={`e.g. MH12 AB 1234 or My Truck ${idx + 1}`}
                    autoCapitalize="characters"
                    error={fieldErrors[`vehicle_${idx}`]}
                    leftIcon={<Ionicons name="car-outline" size={20} color={colors.textSecondary} />}
                  />
                ))}
              </View>
            )}
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
  vehicleChip: {
    minWidth: 56,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  vehicleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  vehicleChipText: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '600' },
  vehicleChipTextActive: { color: colors.white },
});
