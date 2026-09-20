/**
 * FitHub Design Tokens
 *
 * Single source of truth for all visual values.
 * Every StyleSheet in the app MUST reference these tokens — no literal values.
 */

// ─── Spacing Scale ───────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ─── Type Scale ──────────────────────────────────────────────────────────────
export const typography = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
    fontFamily: 'Inter-Bold',
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
    fontFamily: 'Inter-SemiBold',
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600' as const,
    fontFamily: 'Inter-SemiBold',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    fontFamily: 'Inter-Regular',
  },
  bodySm: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    fontFamily: 'Inter-Regular',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    fontFamily: 'Inter-Medium',
  },
} as const;

// ─── Colors ──────────────────────────────────────────────────────────────────
export const colors = {
  // Base
  background: '#0A0A0F',
  surface: '#16161F',
  surfaceElevated: '#1E1E2A',
  border: '#2A2A3A',
  borderFocused: '#4ADE80',

  // Accent (single accent color)
  accent: '#4ADE80',
  accentMuted: 'rgba(74, 222, 128, 0.15)',
  accentPressed: '#3CC070',

  // Text
  textPrimary: '#F0F0F5',
  textSecondary: '#6B6B80',
  textTertiary: '#4A4A5A',
  textInverse: '#0A0A0F',

  // Semantic — progress status
  statusUp: '#4ADE80',
  statusUpBg: 'rgba(74, 222, 128, 0.12)',
  statusDown: '#F87171',
  statusDownBg: 'rgba(248, 113, 113, 0.12)',
  statusFlat: '#FBBF24',
  statusFlatBg: 'rgba(251, 191, 36, 0.12)',
  statusMixed: '#A78BFA',
  statusMixedBg: 'rgba(167, 139, 250, 0.12)',
  statusNew: '#60A5FA',
  statusNewBg: 'rgba(96, 165, 250, 0.12)',

  // Feedback
  error: '#EF4444',
  errorBg: 'rgba(239, 68, 68, 0.12)',
  success: '#4ADE80',
  warning: '#FBBF24',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',
  shimmer: 'rgba(255, 255, 255, 0.05)',
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────
export const radius = {
  input: 8,
  card: 12,
  pill: 999,
  button: 10,
  sheet: 20,
} as const;

// ─── Motion ──────────────────────────────────────────────────────────────────
export const motion = {
  fast: 150,
  normal: 200,
  slow: 250,
  spring: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
  },
} as const;

// ─── Touch Targets ───────────────────────────────────────────────────────────
export const touchTarget = {
  min: 44,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────
export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ─── Tabular Numerals ────────────────────────────────────────────────────────
// Weight and rep numbers MUST use this to prevent digit shifting
export const numericStyle = {
  fontVariant: ['tabular-nums' as const],
} as const;

// ─── Icon Defaults ───────────────────────────────────────────────────────────
export const iconDefaults = {
  size: 22,
  strokeWidth: 1.8,
} as const;

// ─── Progress Thresholds ─────────────────────────────────────────────────────
// Named constants, not magic numbers
export const PROGRESS_E1RM_DEAD_ZONE_PERCENT = 2;
export const PROGRESS_VOLUME_DIVERGENCE_PERCENT = 10;
