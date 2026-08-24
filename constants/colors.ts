export const colors = {
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
} as const;

export type ColorKey = keyof typeof colors;
