/**
 * Database types for Supabase tables.
 * These types mirror the SQL schema exactly.
 */

export type UnitPreference = 'kg' | 'lb';

export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';

export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight';

export type ProgressStatus = 'up' | 'down' | 'flat' | 'mixed' | 'new';

export type ProgressPeriod = 'day' | 'week' | 'month';

export interface Profile {
  id: string;
  display_name: string | null;
  unit_pref: UnitPreference;
  timezone: string;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  equipment: Equipment | null;
  parent_id: string | null;
  owner_id: string | null;
  created_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  performed_at: string;
  duration_sec: number | null;
  note: string | null;
  created_at: string;
}

export interface SessionExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  position: number;
}

export interface ExerciseSet {
  id: string;
  session_exercise_id: string;
  set_no: number;
  weight_kg: number;
  reps: number;
  rpe: number | null;
  is_warmup: boolean;
}

// ─── Joined / Enriched Types ─────────────────────────────────────────────────

export interface SessionExerciseWithSets extends SessionExercise {
  exercise: Exercise;
  sets: ExerciseSet[];
}

export interface WorkoutSessionFull extends WorkoutSession {
  exercises: SessionExerciseWithSets[];
}

export interface ExerciseProgress {
  exercise_id: string;
  exercise_name: string;
  muscle_group: MuscleGroup;
  period_label: string;
  current_best_e1rm: number;
  previous_best_e1rm: number | null;
  current_total_volume: number;
  previous_total_volume: number | null;
  current_session_count: number;
  status: ProgressStatus;
  previous_period_label: string | null;
}
