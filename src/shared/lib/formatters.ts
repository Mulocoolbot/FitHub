/**
 * Formatting utilities.
 * All presentation-layer formatting lives here — no formatting in components.
 */

/**
 * Calculate estimated 1RM using Epley formula.
 * Sets with is_warmup = true should be excluded before calling this.
 */
export function calculateE1RM(weightKg: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

/**
 * Calculate total volume for a set.
 */
export function calculateVolume(weightKg: number, reps: number): number {
  return weightKg * reps;
}

/**
 * Convert kg to lbs.
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 100) / 100;
}

/**
 * Convert lbs to kg.
 */
export function lbsToKg(lbs: number): number {
  return Math.round(lbs / 2.20462 * 100) / 100;
}

/**
 * Format weight with unit, respecting tabular numerals.
 */
export function formatWeight(kg: number, unit: 'kg' | 'lb'): string {
  const value = unit === 'lb' ? kgToLbs(kg) : kg;
  const formatted = value % 1 === 0 ? String(value) : value.toFixed(1);
  return `${formatted} ${unit}`;
}

/**
 * Format set summary: "80 kg × 8"
 */
export function formatSetSummary(
  weightKg: number,
  reps: number,
  unit: 'kg' | 'lb',
): string {
  const value = unit === 'lb' ? kgToLbs(weightKg) : weightKg;
  const formatted = value % 1 === 0 ? String(value) : value.toFixed(1);
  return `${formatted} ${unit} × ${reps}`;
}

/**
 * Format duration in seconds to "1h 23m" or "45m" format.
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Format e1RM delta as percentage string with sign.
 */
export function formatDelta(current: number, previous: number): string {
  if (previous === 0) return '+∞';
  const delta = ((current - previous) / previous) * 100;
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}
