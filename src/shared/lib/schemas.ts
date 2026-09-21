/**
 * Zod schemas for validating all Supabase responses.
 * No raw data enters the app without passing through these.
 */
import { z } from 'zod';

// ─── Enums ───────────────────────────────────────────────────────────────────
export const UnitPreferenceSchema = z.enum(['kg', 'lb']);
export const MuscleGroupRegionSchema = z.enum([
  'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'other',
]);
export const ProgressStatusSchema = z.enum(['up', 'down', 'flat', 'mixed', 'new']);
export const ProgressPeriodSchema = z.enum(['day', 'week', 'month']);

// ─── Table Schemas ───────────────────────────────────────────────────────────
export const ProfileSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string().nullable(),
  unit_pref: UnitPreferenceSchema,
  timezone: z.string(),
  created_at: z.string(),
});

export const MuscleGroupRowSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  region: MuscleGroupRegionSchema,
  sort_order: z.number().int(),
});

export const ExerciseSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  name: z.string(),
  muscle_group_id: z.string().uuid(),
  secondary_group_ids: z.array(z.string().uuid()).default([]),
  equipment: z.string().nullable(),
  note: z.string().nullable(),
  archived_at: z.string().nullable(),
  created_at: z.string(),
});

export const WorkoutSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  performed_at: z.string(),
  duration_sec: z.number().int().nullable(),
  note: z.string().nullable(),
  created_at: z.string(),
});

export const SessionExerciseSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  position: z.number().int(),
});

export const ExerciseSetSchema = z.object({
  id: z.string().uuid(),
  session_exercise_id: z.string().uuid(),
  set_no: z.number().int(),
  weight_kg: z.number().nonnegative(),
  reps: z.number().int().positive(),
  rpe: z.number().min(1).max(10).nullable(),
  is_warmup: z.boolean(),
});

// ─── Joined schemas ──────────────────────────────────────────────────────────
export const SessionExerciseWithSetsSchema = SessionExerciseSchema.extend({
  exercise: ExerciseSchema,
  sets: z.array(ExerciseSetSchema),
});

export const WorkoutSessionFullSchema = WorkoutSessionSchema.extend({
  exercises: z.array(SessionExerciseWithSetsSchema),
});

// ─── Progress schemas ────────────────────────────────────────────────────────
export const ExerciseProgressSchema = z.object({
  exercise_id: z.string().uuid(),
  exercise_name: z.string(),
  muscle_group_id: z.string().uuid(),
  period_label: z.string(),
  current_best_e1rm: z.number(),
  previous_best_e1rm: z.number().nullable(),
  current_total_volume: z.number(),
  previous_total_volume: z.number().nullable(),
  current_session_count: z.number().int(),
  status: ProgressStatusSchema,
  previous_period_label: z.string().nullable(),
});

// ─── Input schemas (for user input validation) ───────────────────────────────
export const SetInputSchema = z.object({
  weight_kg: z.number().nonnegative(),
  reps: z.number().int().positive(),
  rpe: z.number().min(1).max(10).optional(),
  is_warmup: z.boolean().default(false),
});

export const SessionInputSchema = z.object({
  performed_at: z.string(),
  note: z.string().optional(),
});

export const ExerciseInputSchema = z.object({
  name: z.string().min(1).max(200),
  muscle_group_id: z.string().uuid(),
  equipment: z.string().max(100).optional(),
  note: z.string().max(500).optional(),
});
