/**
 * src/theme/colors.ts
 * 
 * Semantic color palette for the Saadawa Fintech UI.
 * Implements a modern Indigo/Violet primary theme with clear Light/Dark mode variants.
 */

export const palette = {
  // Brand Colors
  indigo: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6', // Primary Purple
    600: '#7C3AED', // Primary Dark Purple
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },
  violet: {
    500: '#8B5CF6',
    600: '#7C3AED',
  },
  amber: {
    400: '#FBBF24',
    500: '#F59E0B', // Accent
    600: '#D97706',
  },
  emerald: {
    400: '#34D399',
    500: '#10B981', // Success
    600: '#059669',
  },
  rose: {
    400: '#FB7185',
    500: '#F43F5E', // Error/Danger
    600: '#E11D48',
  },
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B', // Neutral Text
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
};

export const lightTheme = {
  primary: palette.indigo[500],
  primaryLight: palette.indigo[100],
  primaryDark: palette.indigo[700],
  secondary: palette.violet[500],
  accent: palette.amber[500],
  
  success: palette.emerald[500],
  warning: palette.amber[500],
  error: palette.rose[500],
  info: palette.indigo[400],
  
  background: '#FFFFFF',
  surface: palette.slate[50],
  surfaceElevated: '#FFFFFF',
  border: palette.slate[200],
  divider: palette.slate[100],
  
  textPrimary: palette.slate[900],
  textSecondary: palette.slate[600],
  textTertiary: palette.slate[400],
  textInverse: '#FFFFFF',
  textDisabled: palette.slate[300],

  statusSuccessful: palette.emerald[500],
  statusPending: palette.amber[500],
  statusFailed: palette.rose[500],
};

export const darkTheme: typeof lightTheme = {
  primary: palette.indigo[400],
  primaryLight: palette.indigo[900] + '40', // 25% opacity
  primaryDark: palette.indigo[300],
  secondary: palette.violet[500],
  accent: palette.amber[400],
  
  success: palette.emerald[400],
  warning: palette.amber[400],
  error: palette.rose[400],
  info: palette.indigo[300],
  
  background: '#121212',
  surface: '#1E1E1E',
  surfaceElevated: '#2C2C2E',
  border: '#38383A',
  divider: '#2C2C2E',
  
  textPrimary: '#F8FAFC',
  textSecondary: '#A0AEC0',
  textTertiary: '#718096',
  textInverse: '#FFFFFF',
  textDisabled: '#4A5568',

  statusSuccessful: palette.emerald[400],
  statusPending: palette.amber[400],
  statusFailed: palette.rose[400],
};

export type ThemeColors = typeof lightTheme;
