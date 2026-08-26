export const lightColors = {
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  primarySurface: '#EFF6FF',

  secondary: '#10B981',
  secondaryLight: '#34D399',
  secondaryDark: '#059669',

  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC',
  backgroundTertiary: '#F1F5F9',

  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#2563EB',

  error: '#EF4444',
  errorLight: '#FEE2E2',
  errorDark: '#DC2626',

  success: '#10B981',
  successLight: '#D1FAE5',
  successDark: '#059669',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningDark: '#D97706',

  muted: '#94A3B8',
  mutedLight: '#CBD5E1',

  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',

  white: '#FFFFFF',
  black: '#000000',

  gradient: {
    primary: ['#2563EB', '#3B82F6'] as const,
    secondary: ['#10B981', '#34D399'] as const,
    dark: ['#0F172A', '#1E293B'] as const,
  },
};

export type Palette = typeof lightColors;

export const darkColors = {
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',
  primarySurface: '#1E3A8A',

  secondary: '#34D399',
  secondaryLight: '#6EE7B7',
  secondaryDark: '#059669',

  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  backgroundTertiary: '#273449',

  surface: '#1E293B',
  surfaceElevated: '#273449',

  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textInverse: '#0F172A',

  border: '#334155',
  borderLight: '#273449',
  borderFocus: '#3B82F6',

  error: '#F87171',
  errorLight: 'rgba(239, 68, 68, 0.15)',
  errorDark: '#FCA5A5',

  success: '#34D399',
  successLight: 'rgba(16, 185, 129, 0.15)',
  successDark: '#6EE7B7',

  warning: '#FBBF24',
  warningLight: 'rgba(245, 158, 11, 0.15)',
  warningDark: '#FCD34D',

  muted: '#64748B',
  mutedLight: '#475569',

  overlay: 'rgba(0, 0, 0, 0.65)',
  shadow: 'rgba(0, 0, 0, 0.4)',

  white: '#FFFFFF',
  black: '#000000',

  gradient: {
    primary: ['#3B82F6', '#60A5FA'] as const,
    secondary: ['#10B981', '#34D399'] as const,
    dark: ['#1E293B', '#0F172A'] as const,
  },
} as unknown as Palette;

// Legacy static export (light palette). Prefer useTheme() from theme/ThemeContext.
export const colors = lightColors;

export type ColorKey = keyof Palette;
