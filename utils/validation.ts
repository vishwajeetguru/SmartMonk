import { LoginCredentials, SignupCredentials } from '../types/auth';
import { ProfileFormData, Vehicle } from '../types/profile';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  field?: string;
}

export const validation = {
  email(value: string): ValidationResult {
    if (!value.trim()) {
      return { isValid: false, error: 'Please enter your email address.', field: 'email' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { isValid: false, error: 'Please enter a valid email address.', field: 'email' };
    }

    return { isValid: true };
  },

  mobile(value: string): ValidationResult {
    if (!value.trim()) {
      return { isValid: false, error: 'Please enter your mobile number.', field: 'mobile' };
    }

    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 10) {
      return { isValid: false, error: 'Please enter a valid mobile number.', field: 'mobile' };
    }

    return { isValid: true };
  },

  dob(value: string | null): ValidationResult {
    if (!value || !value.trim()) {
      return { isValid: false, error: 'Please enter your date of birth.', field: 'dob' };
    }
    // Expect YYYY-MM-DD
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(value)) {
      return { isValid: false, error: 'Use YYYY-MM-DD format.', field: 'dob' };
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { isValid: false, error: 'Please enter a valid date.', field: 'dob' };
    }
    const now = new Date();
    if (date > now) {
      return { isValid: false, error: 'Date of birth cannot be in future.', field: 'dob' };
    }
    const age = now.getFullYear() - date.getFullYear();
    if (age < 10 || age > 100) {
      return { isValid: false, error: 'Please enter a valid date of birth.', field: 'dob' };
    }
    return { isValid: true };
  },

  vehicleNumber(value: string): ValidationResult {
    if (!value.trim()) {
      return { isValid: false, error: 'Please enter vehicle number.', field: 'vehicleNumber' };
    }
    if (value.trim().length < 2) {
      return { isValid: false, error: 'Vehicle number too short.', field: 'vehicleNumber' };
    }
    return { isValid: true };
  },

  password(value: string): ValidationResult {
    if (!value) {
      return { isValid: false, error: 'Please enter a password.', field: 'password' };
    }

    if (value.length < 6) {
      return {
        isValid: false,
        error: 'Password must be at least 6 characters long.',
        field: 'password',
      };
    }

    return { isValid: true };
  },

  confirmPassword(password: string, confirmPassword: string): ValidationResult {
    if (!confirmPassword) {
      return {
        isValid: false,
        error: 'Please confirm your password.',
        field: 'confirmPassword',
      };
    }

    if (password !== confirmPassword) {
      return { isValid: false, error: 'Passwords do not match.', field: 'confirmPassword' };
    }

    return { isValid: true };
  },

  name(value: string): ValidationResult {
    if (!value.trim()) {
      return { isValid: false, error: 'Please enter your name.', field: 'name' };
    }

    if (value.trim().length < 2) {
      return {
        isValid: false,
        error: 'Name must be at least 2 characters long.',
        field: 'name',
      };
    }

    return { isValid: true };
  },

  required(value: string | null | undefined, fieldName: string): ValidationResult {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return {
        isValid: false,
        error: `Please enter ${fieldName.toLowerCase()}.`,
        field: fieldName.toLowerCase(),
      };
    }

    return { isValid: true };
  },

  loginCredentials(credentials: LoginCredentials): ValidationResult {
    const emailResult = this.email(credentials.email);
    if (!emailResult.isValid) return emailResult;

    const passwordResult = this.password(credentials.password);
    if (!passwordResult.isValid) return passwordResult;

    return { isValid: true };
  },

  signupCredentials(credentials: SignupCredentials): ValidationResult {
    const nameResult = this.name(credentials.name);
    if (!nameResult.isValid) return nameResult;

    const emailResult = this.email(credentials.email);
    if (!emailResult.isValid) return emailResult;

    const passwordResult = this.password(credentials.password);
    if (!passwordResult.isValid) return passwordResult;

    const confirmResult = this.confirmPassword(credentials.password, credentials.confirmPassword);
    if (!confirmResult.isValid) return confirmResult;

    return { isValid: true };
  },

  profileForm(data: ProfileFormData): ValidationResult {
    const nameResult = this.name(data.fullName);
    if (!nameResult.isValid) return nameResult;

    const mobileResult = this.mobile(data.mobile);
    if (!mobileResult.isValid) return mobileResult;

    return { isValid: true };
  },

  step1(data: { fullName: string; dob: string | null }): ValidationResult {
    const nameResult = this.name(data.fullName);
    if (!nameResult.isValid) return nameResult;
    const dobResult = this.dob(data.dob);
    if (!dobResult.isValid) return dobResult;
    return { isValid: true };
  },

  step2(data: { mobile: string }): ValidationResult {
    return this.mobile(data.mobile);
  },

  step3(data: { businessType: string | null }): ValidationResult {
    if (!data.businessType) {
      return { isValid: false, error: 'Please select your business type.', field: 'businessType' };
    }
    return { isValid: true };
  },

  step4(data: { vehicleCount: string | null; vehicles: Vehicle[] }): ValidationResult {
    if (!data.vehicleCount) {
      return { isValid: false, error: 'Please select number of vehicles.', field: 'vehicleCount' };
    }
    for (let i = 0; i < data.vehicles.length; i++) {
      const v = data.vehicles[i];
      if (!v.number.trim()) {
        return { isValid: false, error: `Please enter vehicle ${i + 1} number.`, field: `vehicle_${i}` };
      }
    }
    // uniqueness check (case-insensitive, ignore spaces)
    const normalized = data.vehicles.map((v) => v.number.trim().toLowerCase().replace(/\s+/g, ''));
    const seen = new Set<string>();
    for (let i = 0; i < normalized.length; i++) {
      const n = normalized[i];
      if (seen.has(n)) {
        return {
          isValid: false,
          error: `Duplicate vehicle number: "${data.vehicles[i].number.trim()}" already used.`,
          field: `vehicle_${i}`,
        };
      }
      seen.add(n);
    }
    return { isValid: true };
  },
};
