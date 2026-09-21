/**
 * Exercise Repository
 *
 * Thin data access layer for Exercise feature.
 * Components NEVER call supabase directly.
 */
export {
  getMuscleGroups,
  getExercises,
  searchExercises,
  createExercise,
  updateExercise,
  archiveExercise,
  restoreExercise,
  deleteExercise,
  findSimilarExercises,
  mergeExercises,
  getLastSessionForExercise,
} from '../../workout/api/workoutRepository';
