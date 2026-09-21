/**
 * FitHub Design Tokens
 *
 * Single source of truth for all visual values.
 * Every StyleSheet in the app MUST reference these tokens — no literal values.
 *
 * Font: Poppins (4 weights: Regular 400, Medium 500, SemiBold 600, Bold 700)
 * Color palette: see Bagian 9.2 of the spec
 */

// ─── Spacing Scale ───────────────────────────────────────────────────────────
// Only these values are allowed — nothing outside this set.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ─── Type Scale (Poppins, 6 levels) ─────────────────────────────────────────
export const typography = {
  display: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '600' as const,
    fontFamily: 'Poppins-SemiBold',
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600' as const,
    fontFamily: 'Poppins-SemiBold',
  },
  heading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '500' as const,
    fontFamily: 'Poppins-Medium',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
    fontFamily: 'Poppins-Regular',
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    fontFamily: 'Poppins-Medium',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    fontFamily: 'Poppins-Regular',
  },
} as const;

// ─── Colors ──────────────────────────────────────────────────────────────────
// See spec Bagian 9.2 for contrast rules:
// - surfaceMuted (#898B90) ONLY for non-text elements (chips, badges, dividers)
// - surfaceElevated (#3A3E43) for cards that contain text (contrast >11:1 vs white)
// - accent (#000000) must NOT be placed directly on background (#2F3337) as solid fill
//   Use white/textPrimary fill with black icon/text, or outline variant.
export const colors = {
  // Base
  background: '#2F3337',
  surfaceMuted: '#898B90',
  surfaceElevated: '#3A3E43',

  // Accent — see contrast rules above
  accent: '#000000',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#E6E6E6',

  // Semantic — progress status
  // Each status MUST be paired with a distinct icon (not just color) for color-blind accessibility
  statusUp: '#4CAF7C',          // muted forest green, not neon
  statusUpBg: 'rgba(76, 175, 124, 0.14)',
  statusDown: '#E07856',        // warm terracotta, distinct from accent black
  statusDownBg: 'rgba(224, 120, 86, 0.14)',
  statusFlat: '#A8ABB0',        // neutral gray, near textSecondary
  statusFlatBg: 'rgba(168, 171, 176, 0.14)',
  statusMixed: '#E0A832',       // amber/yellow, distinct from up/down for color-blind
  statusMixedBg: 'rgba(224, 168, 50, 0.14)',
  statusNew: '#6BA3D6',         // soft blue
  statusNewBg: 'rgba(107, 163, 214, 0.14)',

  // Feedback
  error: '#E05C5C',
  errorBg: 'rgba(224, 92, 92, 0.14)',
  success: '#4CAF7C',
  warning: '#E0A832',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

// ─── Border Radius (6 levels, differentiated by function) ────────────────────
export const radius = {
  xs: 8,        // Small badges, outline tags
  sm: 12,       // Input fields, list items
  md: 16,       // Buttons, small cards
  lg: 20,       // Main content cards
  xl: 28,       // Bottom sheet, modal (top corners only)
  full: 999,    // Avatar, FAB, pill tags
} as const;

// ─── Motion ──────────────────────────────────────────────────────────────────
// 150–250ms for transitions; spring for gestures.
// No animation that delays user from seeing data.
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
// Minimum 44×44 pt
export const touchTarget = {
  min: 44,
} as const;

// ─── Tabular Numerals ────────────────────────────────────────────────────────
// Weight and rep numbers MUST use this to prevent digit shifting
export const numericStyle = {
  fontVariant: ['tabular-nums'] as ('tabular-nums')[],
} as const;

// ─── Icon Defaults ───────────────────────────────────────────────────────────
// lucide-react-native, uniform size and stroke-width
export const iconDefaults = {
  size: 22,
  strokeWidth: 1.8,
} as const;

// ─── Progress Thresholds ─────────────────────────────────────────────────────
// Named constants, not magic numbers (spec Bagian 6.3)
export const PROGRESS_E1RM_DEAD_ZONE_PERCENT = 2;
export const PROGRESS_VOLUME_DIVERGENCE_PERCENT = 10;
