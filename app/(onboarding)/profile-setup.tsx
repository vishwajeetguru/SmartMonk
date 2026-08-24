import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
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
import { ProfileAvatar } from '../../components/onboarding/ProfileAvatar';
import { BusinessTypeSelector } from '../../components/onboarding/BusinessTypeSelector';
import { VehicleCountSelector } from '../../components/onboarding/VehicleCountSelector';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { validation } from '../../utils/validation';
import { generateId } from '../../utils/generateId';
import { BusinessType, VehicleCount, Vehicle, COUNTRY_CODES } from '../../types/profile';

type Country = (typeof COUNTRY_CODES)[number];

const TOTAL_STEPS = 4;

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { saveProfile, isLoading, error, clearError } = useProfile();

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showDobModal, setShowDobModal] = useState(false);
  const [tempYear, setTempYear] = useState(1995);
  const [tempMonth, setTempMonth] = useState(6);
  const [tempDay, setTempDay] = useState(15);

  // Step 2
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [mobile, setMobile] = useState('');
  const [showCountryModal, setShowCountryModal] = useState(false);

  // Step 3
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);

  // Step 4
  const [vehicleCount, setVehicleCount] = useState<VehicleCount | null>(null);
  const [exactCount, setExactCount] = useState<number | null>(null);
  const [customCountText, setCustomCountText] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) setFullName(user.name);
  }, [user]);

  const openDobPicker = () => {
    if (dob) {
      const parts = dob.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          setTempYear(y);
          setTempMonth(m);
          setTempDay(d);
        }
      }
    }
    setShowDobModal(true);
  };

  const formatDobDisplay = (value: string) => {
    if (!value) return '';
    const [y, m, d] = value.split('-');
    if (!y || !m || !d) return value;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const idx = parseInt(m, 10) - 1;
    return `${d} ${monthNames[idx] || m} ${y}`;
  };

  const confirmDob = () => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const daysInMonth = new Date(tempYear, tempMonth, 0).getDate();
    const safeDay = Math.min(tempDay, daysInMonth);
    const newDob = `${tempYear}-${pad(tempMonth)}-${pad(safeDay)}`;
    setDob(newDob);
    if (fieldErrors.dob) setFieldErrors((p) => ({ ...p, dob: '' }));
    setShowDobModal(false);
  };

  const selectedCountry: Country | undefined = useMemo(
    () => COUNTRY_CODES.find((c) => c.code === countryCode),
    [countryCode]
  );

  // Derive exact N and sync vehicles array
  const desiredVehicleN = useMemo(() => {
    if (!vehicleCount) return 0;
    if (vehicleCount === '1') return 1;
    if (vehicleCount === '10+') {
      const n = parseInt(customCountText, 10);
      if (!isNaN(n) && n > 0) return Math.min(n, 30);
      return 0;
    }
    return exactCount || 0;
  }, [vehicleCount, exactCount, customCountText]);

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
    } else if (desiredVehicleN === 0 && vehicleCount && vehicleCount !== '10+') {
      // keep empty until exact selected
      setVehicles([]);
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
      // real-time duplicate check
      const normalized = copy.map((v) => v.number.trim().toLowerCase().replace(/\s+/g, ''));
      const seen: Record<string, number> = {};
      const dupIndices = new Set<number>();
      normalized.forEach((n, i) => {
        if (!n) return;
        if (seen[n] !== undefined) {
          dupIndices.add(i);
          dupIndices.add(seen[n]);
        } else {
          seen[n] = i;
        }
      });
      // clear previous vehicle errors and set new ones
      setFieldErrors((prevErrors) => {
        const next = { ...prevErrors };
        // remove old vehicle errors
        Object.keys(next).forEach((k) => {
          if (k.startsWith('vehicle_')) delete next[k];
        });
        dupIndices.forEach((idx) => {
          next[`vehicle_${idx}`] = 'Duplicate number - must be unique';
        });
        return next;
      });
      return copy;
    });
  };

  const validateCurrentStep = (): boolean => {
    let result;
    if (currentStep === 1) {
      result = validation.step1({ fullName, dob: dob || null });
    } else if (currentStep === 2) {
      result = validation.step2({ mobile });
    } else if (currentStep === 3) {
      result = validation.step3({ businessType });
    } else {
      // step 4: need vehicles filled only if desiredVehicleN >0, but vehicleCount itself validated
      // For 10+ with no custom number yet, still error on count
      // If custom count not entered, let validation handle empty vehicles? We handle separately
      if (vehicleCount === '10+') {
        const n = parseInt(customCountText, 10);
        if (!n || n <= 0) {
          setFieldErrors({ vehicleCount: 'Enter number of vehicles' });
          return false;
        }
      }
      if (vehicleCount && ['2-5', '6-10'].includes(vehicleCount) && !exactCount) {
        setFieldErrors({ vehicleCount: 'Select exact number' });
        return false;
      }
      result = validation.step4({ vehicleCount, vehicles });
    }

    if (!result!.isValid) {
      const key = result!.field || 'general';
      // map field names to our error keys
      const mapped: Record<string, string> = {};
      if (result!.field === 'name') mapped.fullName = result!.error!;
      else if (result!.field === 'dob') mapped.dob = result!.error!;
      else if (result!.field === 'mobile') mapped.mobile = result!.error!;
      else if (result!.field === 'businessType') mapped.businessType = result!.error!;
      else if (result!.field === 'vehicleCount') mapped.vehicleCount = result!.error!;
      else if (result!.field?.startsWith('vehicle_')) mapped[result!.field] = result!.error!;
      else mapped[key] = result!.error!;
      setFieldErrors(mapped);
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const handleNext = () => {
    clearError();
    if (!validateCurrentStep()) return;
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      setFieldErrors({});
      clearError();
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    const success = await saveProfile(user.id, {
      fullName,
      businessName: '',
      mobile,
      countryCode,
      dob: dob || null,
      businessType,
      vehicleCount,
      vehicles,
      location: '',
      gstNumber: '',
      profileImage,
    });
    if (success) router.replace('/(onboarding)/setup-complete');
  };

  const renderProgress = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${(currentStep / TOTAL_STEPS) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>
        Step {currentStep} of {TOTAL_STEPS}
      </Text>
      <View style={styles.dotsRow}>
        {[1, 2, 3, 4].map((s) => (
          <View
            key={s}
            style={[
              styles.dot,
              s === currentStep && styles.dotActive,
              s < currentStep && styles.dotCompleted,
            ]}
          />
        ))}
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Add your personal details</Text>
      <Text style={styles.stepSubtitle}>Let's get to know you better</Text>

      <ProfileAvatar imageUri={profileImage} name={fullName} onImageSelected={setProfileImage} />

      <AppInput
        label="Full Name *"
        value={fullName}
        onChangeText={(t) => {
          setFullName(t);
          if (fieldErrors.fullName) setFieldErrors((p) => ({ ...p, fullName: '' }));
        }}
        placeholder="Enter your full name"
        autoCapitalize="words"
        error={fieldErrors.fullName}
        leftIcon={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />}
      />

      <Text style={styles.label}>Date of Birth *</Text>
      <TouchableOpacity
        style={[
          styles.dobButton,
          fieldErrors.dob ? styles.dobButtonError : null,
        ]}
        onPress={openDobPicker}
        activeOpacity={0.7}
      >
        <View style={styles.dobButtonLeft}>
          <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.dobButtonText, !dob && styles.dobPlaceholder]}>
            {dob ? formatDobDisplay(dob) : 'Select your date of birth'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {fieldErrors.dob ? <Text style={styles.errorText}>{fieldErrors.dob}</Text> : null}
      <Text style={styles.helperText}>We use this to personalize your experience • Tap to pick date</Text>

      <Modal visible={showDobModal} transparent animationType="fade" onRequestClose={() => setShowDobModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.dobModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date of Birth</Text>
              <TouchableOpacity onPress={() => setShowDobModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {(() => {
              const now = new Date();
              const minYear = now.getFullYear() - 100;
              const maxYear = now.getFullYear() - 10;
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
              const daysInMonth = new Date(tempYear, tempMonth, 0).getDate();
              const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
              // ensure tempDay valid
              const safeDay = Math.min(tempDay, daysInMonth);
              return (
                <View style={styles.dobPickerRow}>
                  <View style={styles.dobPickerCol}>
                    <Text style={styles.dobPickerLabel}>Day</Text>
                    <ScrollView style={styles.dobPickerScroll} showsVerticalScrollIndicator={false}>
                      {days.map((d) => (
                        <TouchableOpacity
                          key={d}
                          style={[styles.dobPickerItem, safeDay === d && styles.dobPickerItemActive]}
                          onPress={() => setTempDay(d)}
                        >
                          <Text style={[styles.dobPickerItemText, safeDay === d && styles.dobPickerItemTextActive]}>{String(d).padStart(2, '0')}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={styles.dobPickerCol}>
                    <Text style={styles.dobPickerLabel}>Month</Text>
                    <ScrollView style={styles.dobPickerScroll} showsVerticalScrollIndicator={false}>
                      {months.map((m, idx) => (
                        <TouchableOpacity
                          key={m}
                          style={[styles.dobPickerItem, tempMonth === idx + 1 && styles.dobPickerItemActive]}
                          onPress={() => setTempMonth(idx + 1)}
                        >
                          <Text style={[styles.dobPickerItemText, tempMonth === idx + 1 && styles.dobPickerItemTextActive]}>{m}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={styles.dobPickerCol}>
                    <Text style={styles.dobPickerLabel}>Year</Text>
                    <ScrollView style={styles.dobPickerScroll} showsVerticalScrollIndicator={false}>
                      {years.map((y) => (
                        <TouchableOpacity
                          key={y}
                          style={[styles.dobPickerItem, tempYear === y && styles.dobPickerItemActive]}
                          onPress={() => setTempYear(y)}
                        >
                          <Text style={[styles.dobPickerItemText, tempYear === y && styles.dobPickerItemTextActive]}>{y}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              );
            })()}

            <View style={styles.dobModalFooter}>
              <TouchableOpacity style={styles.dobCancelButton} onPress={() => setShowDobModal(false)}>
                <Text style={styles.dobCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dobConfirmButton} onPress={confirmDob}>
                <Text style={styles.dobConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>What's your mobile number?</Text>
      <Text style={styles.stepSubtitle}>We'll use this to keep you updated</Text>

      <Text style={styles.label}>Mobile Number *</Text>
      <View style={styles.mobileRow}>
        <TouchableOpacity
          style={styles.countryButton}
          onPress={() => setShowCountryModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.countryFlag}>{selectedCountry?.flag}</Text>
          <Text style={styles.countryCode}>{selectedCountry?.code}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.mobileInputWrapper}>
          <AppInput
            value={mobile}
            onChangeText={(t) => {
              setMobile(t);
              if (fieldErrors.mobile) setFieldErrors((p) => ({ ...p, mobile: '' }));
            }}
            placeholder="Enter mobile number"
            keyboardType="phone-pad"
            error={fieldErrors.mobile}
            containerStyle={{ marginBottom: 0, flex: 1 }}
          />
        </View>
      </View>
      {fieldErrors.mobile ? <Text style={styles.errorText}>{fieldErrors.mobile}</Text> : null}

      <Modal visible={showCountryModal} transparent animationType="fade" onRequestClose={() => setShowCountryModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCountryModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRY_CODES as unknown as Country[]}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.countryRow, item.code === countryCode && styles.countryRowActive]}
                  onPress={() => {
                    setCountryCode(item.code);
                    setShowCountryModal(false);
                  }}
                >
                  <Text style={styles.countryFlagLarge}>{item.flag}</Text>
                  <View style={styles.countryInfo}>
                    <Text style={styles.countryName}>{item.name}</Text>
                    <Text style={styles.countryCodeSmall}>{item.code}</Text>
                  </View>
                  {item.code === countryCode && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.stepTitle}>What describes you best?</Text>
      <Text style={styles.stepSubtitle}>Choose your business type</Text>
      <BusinessTypeSelector selected={businessType} onSelect={(t) => { setBusinessType(t); setFieldErrors({}); }} error={fieldErrors.businessType} />
    </View>
  );

  const renderExactSelector = () => {
    if (!vehicleCount || vehicleCount === '1' || vehicleCount === '10+') return null;
    const options = vehicleCount === '2-5' ? [2, 3, 4, 5] : [6, 7, 8, 9, 10];
    return (
      <View style={styles.exactContainer}>
        <Text style={styles.exactLabel}>Select exact number</Text>
        <View style={styles.exactRow}>
          {options.map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.exactChip, exactCount === n && styles.exactChipActive]}
              onPress={() => handleExactSelect(n)}
              activeOpacity={0.7}
            >
              <Text style={[styles.exactChipText, exactCount === n && styles.exactChipTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {fieldErrors.vehicleCount && <Text style={styles.errorText}>{fieldErrors.vehicleCount}</Text>}
      </View>
    );
  };

  const renderStep4 = () => (
    <View>
      <Text style={styles.stepTitle}>How many vehicles do you run?</Text>
      <Text style={styles.stepSubtitle}>We'll set up your fleet</Text>

      <VehicleCountSelector selected={vehicleCount} onSelect={handleVehicleCountSelect} error={fieldErrors.vehicleCount} />

      {vehicleCount === '10+' && (
        <View style={{ marginBottom: spacing.base }}>
          <AppInput
            label="Enter exact number of vehicles"
            value={customCountText}
            onChangeText={(t) => {
              const cleaned = t.replace(/[^0-9]/g, '');
              setCustomCountText(cleaned);
              if (fieldErrors.vehicleCount) setFieldErrors({});
              if (cleaned) {
                const n = parseInt(cleaned, 10);
                if (n > 0 && n <= 30) {
                  // vehicles will sync via effect
                }
              } else {
                setVehicles([]);
              }
            }}
            placeholder="e.g. 12"
            keyboardType="number-pad"
            error={fieldErrors.vehicleCount}
          />
        </View>
      )}

      {renderExactSelector()}

      {vehicles.length > 0 && (
        <View style={styles.vehiclesContainer}>
          <Text style={styles.vehiclesTitle}>Vehicle details ({vehicles.length})</Text>
          <Text style={styles.vehiclesSubtitle}>Add vehicle number or nickname</Text>
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
    </View>
  );

  return (
    <ScreenContainer safeArea style={styles.container}>
      <KeyboardAvoidingContainer>
        <View style={styles.topBar}>
          {currentStep > 1 ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={12}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}
          <Text style={styles.topStepText}>
            {currentStep}/{TOTAL_STEPS}
          </Text>
          <View style={styles.backButton} />
        </View>

        {renderProgress()}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            {error && <ErrorMessage message={error} />}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <AppButton
            title={currentStep === TOTAL_STEPS ? 'Complete Setup' : 'Next'}
            onPress={handleNext}
            variant="primary"
            size="large"
            loading={isLoading}
            disabled={isLoading}
          />
          {currentStep < TOTAL_STEPS && (
            <Text style={styles.bottomHint}>Step {currentStep} of {TOTAL_STEPS} • {['Personal', 'Mobile', 'Business', 'Fleet'][currentStep - 1]}</Text>
          )}
        </View>
      </KeyboardAvoidingContainer>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topStepText: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '600' },
  progressContainer: { paddingHorizontal: spacing.xl, marginBottom: spacing.base },
  progressBarBg: { height: 6, backgroundColor: colors.borderLight, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
  progressText: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 24 },
  dotCompleted: { backgroundColor: colors.success },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  form: { flex: 1 },
  stepTitle: { ...typography.headingMedium, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.xs },
  stepSubtitle: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  label: { ...typography.label, color: colors.textPrimary, marginBottom: spacing.xs },
  helperText: { ...typography.caption, color: colors.textSecondary, marginTop: -spacing.sm, marginBottom: spacing.base },
  errorText: { ...typography.caption, color: colors.error, marginTop: spacing.xs, marginBottom: spacing.sm },
  mobileRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    minHeight: 52,
    gap: 6,
  },
  countryFlag: { fontSize: 20 },
  countryCode: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '600' },
  mobileInputWrapper: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '60%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { ...typography.headingSmall, color: colors.textPrimary },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  countryRowActive: { backgroundColor: colors.primarySurface },
  countryFlagLarge: { fontSize: 28, marginRight: spacing.md },
  countryInfo: { flex: 1 },
  countryName: { ...typography.body, color: colors.textPrimary },
  countryCodeSmall: { ...typography.caption, color: colors.textSecondary },
  exactContainer: { marginBottom: spacing.base, marginTop: spacing.sm },
  exactLabel: { ...typography.label, color: colors.textPrimary, marginBottom: spacing.sm },
  exactRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  exactChip: {
    minWidth: 56,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  exactChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  exactChipText: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '600' },
  exactChipTextActive: { color: colors.white },
  vehiclesContainer: { marginTop: spacing.base, paddingTop: spacing.base, borderTopWidth: 1, borderTopColor: colors.borderLight },
  vehiclesTitle: { ...typography.label, color: colors.textPrimary, marginBottom: 2 },
  vehiclesSubtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.base },
  bottomBar: { paddingHorizontal: spacing.xl, paddingVertical: spacing.base, borderTopWidth: 1, borderTopColor: colors.borderLight, backgroundColor: colors.white },
  bottomHint: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.xs },
  dobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    minHeight: 52,
  },
  dobButtonError: { borderColor: colors.error },
  dobButtonLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dobButtonText: { ...typography.body, color: colors.textPrimary },
  dobPlaceholder: { color: colors.textTertiary },
  dobModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '70%',
    paddingBottom: spacing.xl,
  },
  dobPickerRow: { flexDirection: 'row', paddingHorizontal: spacing.base, gap: spacing.sm, height: 260 },
  dobPickerCol: { flex: 1, borderWidth: 1, borderColor: colors.borderLight, borderRadius: radius.md, overflow: 'hidden' },
  dobPickerLabel: { ...typography.labelSmall, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.xs, backgroundColor: colors.backgroundSecondary, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  dobPickerScroll: { flex: 1 },
  dobPickerItem: { paddingVertical: spacing.sm, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  dobPickerItemActive: { backgroundColor: colors.primary },
  dobPickerItemText: { ...typography.bodySmall, color: colors.textPrimary },
  dobPickerItemTextActive: { color: colors.white, fontWeight: '700' },
  dobModalFooter: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.base, paddingTop: spacing.base, marginTop: spacing.base, borderTopWidth: 1, borderTopColor: colors.borderLight },
  dobCancelButton: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  dobCancelText: { ...typography.button, color: colors.textPrimary },
  dobConfirmButton: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center' },
  dobConfirmText: { ...typography.button, color: colors.white },
});
