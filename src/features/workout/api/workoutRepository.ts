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
  MuscleGroupRowSchema,
  SessionExerciseSchema,
  ExerciseSetSchema,
} from '../../../shared/lib/schemas';
import { z } from 'zod';

// ─── Muscle Groups ───────────────────────────────────────────────────────────

export async function getMuscleGroups() {
  const { data, error } = await supabase
    .from('muscle_groups')
    .select('*')
    .order('sort_order');

  if (error) throw error;
  return z.array(MuscleGroupRowSchema).parse(data);
}

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

export async function saveCompleteWorkout(payload: {
  user_id: string;
  performed_at: string;
  duration_sec?: number;
  note?: string;
  exercises: Array<{
    exercise_id: string;
    position: number;
    sets: Array<{
      set_no: number;
      weight_kg: number;
      reps: number;
      rpe?: number | null;
      is_warmup: boolean;
    }>;
  }>;
}) {
  const { data: session, error: sessionErr } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: payload.user_id,
      performed_at: payload.performed_at,
      duration_sec: payload.duration_sec,
      note: payload.note,
    })
    .select()
    .single();

  if (sessionErr) throw sessionErr;

  for (const ex of payload.exercises) {
    const { data: sessionEx, error: exErr } = await supabase
      .from('session_exercises')
      .insert({
        session_id: session.id,
        exercise_id: ex.exercise_id,
        position: ex.position,
      })
      .select()
      .single();

    if (exErr) throw exErr;

    if (ex.sets.length > 0) {
      const setsToInsert = ex.sets.map((s) => ({
        session_exercise_id: sessionEx.id,
        set_no: s.set_no,
        weight_kg: s.weight_kg,
        reps: s.reps,
        rpe: s.rpe ?? null,
        is_warmup: s.is_warmup,
      }));

      const { error: setsErr } = await supabase
        .from('exercise_sets')
        .insert(setsToInsert);

      if (setsErr) throw setsErr;
    }
  }

  return session;
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

// ─── Exercises (user-owned only) ─────────────────────────────────────────────

export async function getExercises(muscleGroupId?: string) {
  let query = supabase
    .from('exercises')
    .select('*')
    .is('archived_at', null)
    .order('name');

  if (muscleGroupId) {
    query = query.eq('muscle_group_id', muscleGroupId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return z.array(ExerciseSchema).parse(data);
}

export async function searchExercises(searchTerm: string) {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .is('archived_at', null)
    .ilike('name', `%${searchTerm}%`)
    .order('name')
    .limit(20);

  if (error) throw error;
  return z.array(ExerciseSchema).parse(data);
}

export async function createExercise(exercise: {
  owner_id: string;
  name: string;
  muscle_group_id: string;
  equipment?: string;
  note?: string;
}) {
  const { data, error } = await supabase
    .from('exercises')
    .insert(exercise)
    .select()
    .single();

  if (error) throw error;
  return ExerciseSchema.parse(data);
}

export async function updateExercise(
  exerciseId: string,
  updates: {
    name?: string;
    muscle_group_id?: string;
    equipment?: string | null;
    note?: string | null;
  },
) {
  const { data, error } = await supabase
    .from('exercises')
    .update(updates)
    .eq('id', exerciseId)
    .select()
    .single();

  if (error) throw error;
  return ExerciseSchema.parse(data);
}

/**
 * Archive an exercise (soft delete). Used when the exercise has workout history.
 */
export async function archiveExercise(exerciseId: string) {
  const { error } = await supabase
    .from('exercises')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', exerciseId);

  if (error) throw error;
}

/**
 * Restore an archived exercise.
 */
export async function restoreExercise(exerciseId: string) {
  const { error } = await supabase
    .from('exercises')
    .update({ archived_at: null })
    .eq('id', exerciseId);

  if (error) throw error;
}

/**
 * Hard delete — only for exercises that have never been used in a session.
 */
export async function deleteExercise(exerciseId: string) {
  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', exerciseId);

  if (error) throw error;
}

/**
 * Check for similar exercise names (fuzzy match) using pg_trgm similarity.
 * Returns exercises with similarity > 0.4.
 */
export async function findSimilarExercises(userId: string, name: string) {
  const { data, error } = await supabase
    .rpc('find_similar_exercises', {
      p_user_id: userId,
      p_name: name,
    });

  if (error) throw error;
  return data as Array<{ id: string; name: string; similarity: number }>;
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

/**
 * Merge duplicate exercise into a target exercise in a single transaction.
 */
export async function mergeExercises(sourceId: string, targetId: string) {
  const { error } = await supabase.rpc('merge_exercises', {
    p_source_id: sourceId,
    p_target_id: targetId,
  });

  if (error) throw error;
}

/**
 * Get exercise progress (e1RM, volume, status: up/down/flat/mixed/new)
 */
export async function getExerciseProgress(
  userId: string,
  period: 'day' | 'week' | 'month' = 'week',
) {
  const { data, error } = await supabase.rpc('get_exercise_progress', {
    p_user_id: userId,
    p_period: period,
  });

  if (error) throw error;
  return data;
}
