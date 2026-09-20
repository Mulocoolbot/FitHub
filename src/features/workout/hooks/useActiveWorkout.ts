/**
 * Active Workout Store (Zustand)
 *
 * Manages the in-progress workout session state.
 * This is UI state (local), not server state (TanStack Query handles that).
 * Data is persisted to server only when user saves.
 */
import { create } from 'zustand';

interface ActiveSet {
  id?: string; // undefined = not yet saved to server
  set_no: number;
  weight_kg: number;
  reps: number;
  rpe: number | null;
  is_warmup: boolean;
}

interface ActiveExercise {
  id?: string;
  exercise_id: string;
  exercise_name: string;
  muscle_group: string;
  position: number;
  sets: ActiveSet[];
}

interface ActiveWorkoutState {
  // State
  sessionId: string | null;
  isActive: boolean;
  startedAt: Date | null;
  exercises: ActiveExercise[];
  note: string;

  // Actions
  startWorkout: () => void;
  endWorkout: () => void;
  setSessionId: (id: string) => void;
  addExercise: (exercise: {
    exercise_id: string;
    exercise_name: string;
    muscle_group: string;
  }) => void;
  removeExercise: (position: number) => void;
  addSet: (exercisePosition: number, set: Omit<ActiveSet, 'set_no'>) => void;
  updateSet: (
    exercisePosition: number,
    setIndex: number,
    updates: Partial<ActiveSet>,
  ) => void;
  removeSet: (exercisePosition: number, setIndex: number) => void;
  setNote: (note: string) => void;
  reset: () => void;
}

const initialState = {
  sessionId: null,
  isActive: false,
  startedAt: null,
  exercises: [] as ActiveExercise[],
  note: '',
};

export const useActiveWorkout = create<ActiveWorkoutState>((set, get) => ({
  ...initialState,

  startWorkout: () =>
    set({ isActive: true, startedAt: new Date() }),

  endWorkout: () =>
    set({ isActive: false }),

  setSessionId: (id) =>
    set({ sessionId: id }),

  addExercise: (exercise) =>
    set((state) => ({
      exercises: [
        ...state.exercises,
        {
          ...exercise,
          position: state.exercises.length,
          sets: [],
        },
      ],
    })),

  removeExercise: (position) =>
    set((state) => ({
      exercises: state.exercises
        .filter((e) => e.position !== position)
        .map((e, i) => ({ ...e, position: i })),
    })),

  addSet: (exercisePosition, setData) =>
    set((state) => ({
      exercises: state.exercises.map((e) =>
        e.position === exercisePosition
          ? {
              ...e,
              sets: [
                ...e.sets,
                { ...setData, set_no: e.sets.length + 1 },
              ],
            }
          : e,
      ),
    })),

  updateSet: (exercisePosition, setIndex, updates) =>
    set((state) => ({
      exercises: state.exercises.map((e) =>
        e.position === exercisePosition
          ? {
              ...e,
              sets: e.sets.map((s, i) =>
                i === setIndex ? { ...s, ...updates } : s,
              ),
            }
          : e,
      ),
    })),

  removeSet: (exercisePosition, setIndex) =>
    set((state) => ({
      exercises: state.exercises.map((e) =>
        e.position === exercisePosition
          ? {
              ...e,
              sets: e.sets
                .filter((_, i) => i !== setIndex)
                .map((s, i) => ({ ...s, set_no: i + 1 })),
            }
          : e,
      ),
    })),

  setNote: (note) => set({ note }),

  reset: () => set(initialState),
}));
