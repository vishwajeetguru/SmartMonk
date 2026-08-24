import { LoginCredentials, SignupCredentials } from '../types/auth';
import { ProfileFormData } from '../types/profile';

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

    const mobileRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
    if (!mobileRegex.test(value) || value.replace(/\D/g, '').length < 10) {
      return { isValid: false, error: 'Please enter a valid mobile number.', field: 'mobile' };
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
};
