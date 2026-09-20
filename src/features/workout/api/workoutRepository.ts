/**
 * Workout Repository
 *
 * Thin data access layer. Components NEVER call supabase.from() directly.
 * All responses are validated with Zod before returning.
 */
import { supabase } from '../../../shared/lib/supabase';
import {
  WorkoutSessionSchema,
  ExerciseSchema,
  SessionExerciseSchema,
  ExerciseSetSchema,
} from '../../../shared/lib/schemas';
import { z } from 'zod';

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function getSessions(userId: string, limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('performed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return z.array(WorkoutSessionSchema).parse(data);
}

export async function getSessionById(sessionId: string) {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      session_exercises:session_exercises(
        *,
        exercise:exercises(*),
        sets:exercise_sets(*)
      )
    `)
    .eq('id', sessionId)
    .single();

  if (error) throw error;
  return data;
}

export async function createSession(session: {
  user_id: string;
  performed_at: string;
  note?: string;
}) {
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert(session)
    .select()
    .single();

  if (error) throw error;
  return WorkoutSessionSchema.parse(data);
}

export async function updateSession(
  sessionId: string,
  updates: { note?: string; duration_sec?: number },
) {
  const { data, error } = await supabase
    .from('workout_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return WorkoutSessionSchema.parse(data);
}

export async function deleteSession(sessionId: string) {
  const { error } = await supabase
    .from('workout_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw error;
}

// ─── Session Exercises ───────────────────────────────────────────────────────

export async function addExerciseToSession(sessionExercise: {
  session_id: string;
  exercise_id: string;
  position: number;
}) {
  const { data, error } = await supabase
    .from('session_exercises')
    .insert(sessionExercise)
    .select()
    .single();

  if (error) throw error;
  return SessionExerciseSchema.parse(data);
}

export async function removeExerciseFromSession(sessionExerciseId: string) {
  const { error } = await supabase
    .from('session_exercises')
    .delete()
    .eq('id', sessionExerciseId);

  if (error) throw error;
}

// ─── Sets ────────────────────────────────────────────────────────────────────

export async function addSet(set: {
  session_exercise_id: string;
  set_no: number;
  weight_kg: number;
  reps: number;
  rpe?: number;
  is_warmup?: boolean;
}) {
  const { data, error } = await supabase
    .from('exercise_sets')
    .insert({
      ...set,
      is_warmup: set.is_warmup ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  return ExerciseSetSchema.parse(data);
}

export async function updateSet(
  setId: string,
  updates: {
    weight_kg?: number;
    reps?: number;
    rpe?: number | null;
    is_warmup?: boolean;
  },
) {
  const { data, error } = await supabase
    .from('exercise_sets')
    .update(updates)
    .eq('id', setId)
    .select()
    .single();

  if (error) throw error;
  return ExerciseSetSchema.parse(data);
}

export async function deleteSet(setId: string) {
  const { error } = await supabase
    .from('exercise_sets')
    .delete()
    .eq('id', setId);

  if (error) throw error;
}

// ─── Exercises catalog ───────────────────────────────────────────────────────

export async function getExercises(muscleGroup?: string) {
  let query = supabase
    .from('exercises')
    .select('*')
    .order('name');

  if (muscleGroup) {
    query = query.eq('muscle_group', muscleGroup);
  }

  const { data, error } = await query;
  if (error) throw error;
  return z.array(ExerciseSchema).parse(data);
}

export async function searchExercises(searchTerm: string) {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .ilike('name', `%${searchTerm}%`)
    .order('name')
    .limit(20);

  if (error) throw error;
  return z.array(ExerciseSchema).parse(data);
}

/**
 * Get the last session data for an exercise (for pre-filling defaults).
 */
export async function getLastSessionForExercise(
  userId: string,
  exerciseId: string,
) {
  const { data, error } = await supabase
    .from('session_exercises')
    .select(`
      *,
      sets:exercise_sets(*),
      session:workout_sessions!inner(*)
    `)
    .eq('exercise_id', exerciseId)
    .eq('session.user_id', userId)
    .order('session(performed_at)', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}
