import { colors } from './colors';

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
} as const;

export const radius = {
  md: 12,
  full: 9999,
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

export const shadow = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.24)',
  md: '0 4px 12px rgba(0, 0, 0, 0.18)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.22)',
} as const;

export const layout = {
  headerHeight: 56,
  sidebarWidth: 320,
  maxContentWidth: 1200,
} as const;

export const tokens = {
  colors,
  spacing,
  radius,
  fontWeight,
  fontSize,
  shadow,
  layout,
} as const;

export type Tokens = typeof tokens;
