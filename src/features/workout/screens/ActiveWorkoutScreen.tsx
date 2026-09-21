import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Alert,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Trash2, ArrowLeft, Clock, Dumbbell } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Button, Card, Input } from '../../../shared/ui/components';
import { colors, typography, spacing, radius, iconDefaults, numericStyle } from '../../../shared/ui/tokens';
import { useAuth } from '../../auth/hooks/useAuth';
import { useActiveWorkout } from '../hooks/useActiveWorkout';
import { SetRow } from '../components/SetRow';
import { RestTimer } from '../components/RestTimer';
import { ExercisePickerModal } from '../../exercises/components/ExercisePickerModal';
import { saveCompleteWorkout, getLastSessionForExercise } from '../api/workoutRepository';
import type { Exercise } from '../../../shared/types/database';

export function ActiveWorkoutScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const {
    exercises,
    startedAt,
    isActive,
    addExercise,
    removeExercise,
    addSet,
    updateSet,
    removeSet,
    endWorkout,
    reset,
  } = useActiveWorkout();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [note, setNote] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);

  // Undo state for set deletion
  const [deletedSetInfo, setDeletedSetInfo] = useState<{
    exercisePosition: number;
    setIndex: number;
    setData: {
      weight_kg: number;
      reps: number;
      is_warmup: boolean;
      rpe: number | null;
    };
  } | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Elapsed timer
  useEffect(() => {
    const start = startedAt ? new Date(startedAt).getTime() : Date.now();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  const formatElapsed = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Add exercise from picker
  const handleSelectExercise = async (exercise: Exercise) => {
    setShowPicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Fetch defaults from last session for this exercise
    let defaultWeight = 20;
    let defaultReps = 10;

    if (user) {
      try {
        const lastSession = await getLastSessionForExercise(user.id, exercise.id);
        const lastSets = lastSession?.sets as Array<{ weight_kg: number; reps: number }> | undefined;
        if (lastSets && lastSets.length > 0) {
          defaultWeight = Number(lastSets[0].weight_kg) || 20;
          defaultReps = Number(lastSets[0].reps) || 10;
        }
      } catch (e) {
        // Fallback to initial defaults
      }
    }

    addExercise({
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      muscle_group_id: exercise.muscle_group_id,
    });

    // Add first set automatically with defaults
    addSet(exercises.length, {
      weight_kg: defaultWeight,
      reps: defaultReps,
      rpe: null,
      is_warmup: false,
    });
  };

  // Add set to exercise (inherits previous set values)
  const handleAddSet = (exercisePosition: number) => {
    const ex = exercises.find((e) => e.position === exercisePosition);
    let weight = 20;
    let reps = 10;

    if (ex && ex.sets.length > 0) {
      const lastSet = ex.sets[ex.sets.length - 1];
      weight = lastSet.weight_kg;
      reps = lastSet.reps;
    }

    addSet(exercisePosition, {
      weight_kg: weight,
      reps: reps,
      rpe: null,
      is_warmup: false,
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Start rest timer automatically per spec Bagian 9.3
    setShowRestTimer(true);
  };

  // Delete set with Undo mechanism (spec Bagian 9.3)
  const handleDeleteSet = (exercisePosition: number, setIndex: number) => {
    const ex = exercises.find((e) => e.position === exercisePosition);
    if (!ex) return;
    const targetSet = ex.sets[setIndex];
    if (!targetSet) return;

    // Save for undo
    setDeletedSetInfo({
      exercisePosition,
      setIndex,
      setData: {
        weight_kg: targetSet.weight_kg,
        reps: targetSet.reps,
        is_warmup: targetSet.is_warmup,
        rpe: targetSet.rpe,
      },
    });

    removeSet(exercisePosition, setIndex);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Auto-clear undo toast after 5s
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setDeletedSetInfo(null);
    }, 5000);
  };

  const handleUndoDelete = () => {
    if (!deletedSetInfo) return;
    addSet(deletedSetInfo.exercisePosition, deletedSetInfo.setData);
    setDeletedSetInfo(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Save workout session mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      if (exercises.length === 0) throw new Error('Tambahkan minimal 1 gerakan sebelum menyimpan');

      const payload = {
        user_id: user.id,
        performed_at: startedAt ? startedAt.toISOString() : new Date().toISOString(),
        duration_sec: elapsedSeconds,
        note: note.trim() || undefined,
        exercises: exercises.map((ex, idx) => ({
          exercise_id: ex.exercise_id,
          position: idx,
          sets: ex.sets.map((s, sIdx) => ({
            set_no: sIdx + 1,
            weight_kg: s.weight_kg,
            reps: s.reps,
            rpe: s.rpe,
            is_warmup: s.is_warmup,
          })),
        })),
      };

      return saveCompleteWorkout(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['exercise_progress'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      endWorkout();
      reset();
      router.replace('/(tabs)');
    },
    onError: (err: any) => {
      Alert.alert('Gagal Menyimpan Sesi', err?.message || 'Terjadi kesalahan');
    },
  });

  const handleFinish = () => {
    if (exercises.length === 0) {
      Alert.alert('Sesi Kosong', 'Tambahkan gerakan terlebih dahulu.');
      return;
    }

    Alert.alert(
      'Selesaikan Sesi Latihan',
      'Apakah kamu yakin ingin menyelesaikan dan menyimpan sesi latihan ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Selesaikan',
          style: 'default',
          onPress: () => saveMutation.mutate(),
        },
      ],
    );
  };

  const handleDiscard = () => {
    Alert.alert(
      'Batalkan Sesi',
      'Semua data latihan sesi ini akan dihapus. Yakin?',
      [
        { text: 'Lanjut Latihan', style: 'cancel' },
        {
          text: 'Hapus Sesi',
          style: 'destructive',
          onPress: () => {
            endWorkout();
            reset();
            router.back();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={handleDiscard} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={iconDefaults.size} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.timerBadge}>
          <Clock size={16} color={colors.accent} strokeWidth={2.2} />
          <Text style={styles.timerText}>{formatElapsed(elapsedSeconds)}</Text>
        </View>

        <Button
          label="Selesai"
          variant="primary"
          size="sm"
          loading={saveMutation.isPending}
          onPress={handleFinish}
        />
      </View>

      {/* Floating Rest Timer */}
      {showRestTimer && (
        <View style={styles.restTimerWrapper}>
          <RestTimer
            initialSeconds={90}
            onFinish={() => setShowRestTimer(false)}
            onDismiss={() => setShowRestTimer(false)}
          />
        </View>
      )}

      {/* Undo Toast */}
      {deletedSetInfo && (
        <View style={styles.undoToast}>
          <Text style={styles.undoText}>Set dihapus</Text>
          <Pressable onPress={handleUndoDelete} style={styles.undoBtn}>
            <Text style={styles.undoBtnText}>BATALKAN</Text>
          </Pressable>
        </View>
      )}

      {/* Main Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Exercises List */}
        {exercises.map((ex, exIdx) => (
          <View key={`${ex.exercise_id}-${exIdx}`} style={styles.exerciseCard}>
            {/* Exercise Header */}
            <View style={styles.exHeader}>
              <View style={styles.exTitleRow}>
                <Dumbbell size={18} color={colors.textPrimary} />
                <Text style={styles.exTitle}>{ex.exercise_name}</Text>
              </View>
              <Pressable
                onPress={() => removeExercise(ex.position)}
                hitSlop={8}
              >
                <Trash2 size={16} color={colors.surfaceMuted} />
              </Pressable>
            </View>

            {/* Sets list */}
            <View style={styles.setsList}>
              {ex.sets.map((set, setIdx) => (
                <SetRow
                  key={setIdx}
                  setNo={setIdx + 1}
                  weightKg={set.weight_kg}
                  reps={set.reps}
                  isWarmup={set.is_warmup}
                  unit="kg"
                  onWeightChange={(val) =>
                    updateSet(ex.position, setIdx, { weight_kg: val })
                  }
                  onRepsChange={(val) =>
                    updateSet(ex.position, setIdx, { reps: val })
                  }
                  onToggleWarmup={() =>
                    updateSet(ex.position, setIdx, { is_warmup: !set.is_warmup })
                  }
                  onDelete={() => handleDeleteSet(ex.position, setIdx)}
                />
              ))}
            </View>

            {/* + Add Set Button */}
            <Pressable
              style={styles.addSetBtn}
              onPress={() => handleAddSet(ex.position)}
            >
              <Plus size={16} color={colors.textPrimary} strokeWidth={2.2} />
              <Text style={styles.addSetText}>Tambah Set</Text>
            </Pressable>
          </View>
        ))}

        {/* Empty state if no exercises */}
        {exercises.length === 0 && (
          <View style={styles.emptyCard}>
            <Dumbbell size={48} color={colors.surfaceMuted} />
            <Text style={styles.emptyTitle}>Mulai Sesi Latihan</Text>
            <Text style={styles.emptySubtitle}>
              Pilih atau buat gerakan pertama untuk dicatat
            </Text>
          </View>
        )}

        {/* Add Exercise CTA */}
        <Button
          label="Tambah Gerakan"
          variant="outline"
          icon={<Plus size={18} color={colors.textPrimary} strokeWidth={2.2} />}
          onPress={() => setShowPicker(true)}
        />

        {/* Notes Input */}
        <View style={styles.notesSection}>
          <Input
            label="Catatan Sesi (Opsional)"
            placeholder="Kondisi fisik, fokus hari ini, dll."
            value={note}
            onChangeText={setNote}
            multiline
          />
        </View>
      </ScrollView>

      {/* Exercise Picker Modal */}
      <ExercisePickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleSelectExercise}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } satisfies ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  } satisfies ViewStyle,
  backBtn: {
    padding: spacing.xs,
  } satisfies ViewStyle,
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.textPrimary,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    gap: 6,
  } satisfies ViewStyle,
  timerText: {
    ...typography.label,
    color: colors.accent,
    fontWeight: '700',
    ...numericStyle,
  } satisfies TextStyle,
  restTimerWrapper: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  } satisfies ViewStyle,
  undoToast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.statusMixed,
  } satisfies ViewStyle,
  undoText: {
    ...typography.body,
    color: colors.textPrimary,
  } satisfies TextStyle,
  undoBtn: {
    padding: spacing.xs,
  } satisfies ViewStyle,
  undoBtnText: {
    ...typography.label,
    color: colors.statusMixed,
    fontWeight: '700',
  } satisfies TextStyle,
  scroll: {
    flex: 1,
  } satisfies ViewStyle,
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  } satisfies ViewStyle,
  exerciseCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.md,
  } satisfies ViewStyle,
  exHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } satisfies ViewStyle,
  exTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  } satisfies ViewStyle,
  exTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    flex: 1,
  } satisfies TextStyle,
  setsList: {
    gap: spacing.sm,
  } satisfies ViewStyle,
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
  } satisfies ViewStyle,
  addSetText: {
    ...typography.label,
    color: colors.textPrimary,
  } satisfies TextStyle,
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  } satisfies ViewStyle,
  emptyTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  } satisfies TextStyle,
  emptySubtitle: {
    ...typography.body,
    color: colors.surfaceMuted,
    textAlign: 'center',
  } satisfies TextStyle,
  notesSection: {
    marginTop: spacing.sm,
  } satisfies ViewStyle,
});
