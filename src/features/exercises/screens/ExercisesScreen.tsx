import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Alert,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Dumbbell,
  Archive,
  RotateCcw,
  Edit2,
  GitMerge,
  Trash2,
  ChevronDown,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, iconDefaults } from '../../../shared/ui/tokens';
import { Button, Input, Card } from '../../../shared/ui/components';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  getExercises,
  getMuscleGroups,
  archiveExercise,
  restoreExercise,
  deleteExercise,
  updateExercise,
  mergeExercises,
} from '../api/exerciseRepository';
import { CreateExerciseModal } from '../components/CreateExerciseModal';
import type { Exercise } from '../../../shared/types/database';

export function ExercisesScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Merge modal state
  const [mergingSourceExercise, setMergingSourceExercise] = useState<Exercise | null>(null);

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => getExercises(),
  });

  const { data: muscleGroups = [] } = useQuery({
    queryKey: ['muscleGroups'],
    queryFn: getMuscleGroups,
  });

  const muscleGroupMap = useMemo(() => {
    const map = new Map<string, string>();
    muscleGroups.forEach((mg) => map.set(mg.id, mg.name));
    return map;
  }, [muscleGroups]);

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        ex.name.toLowerCase().includes(searchTerm.toLowerCase().trim());
      const matchesMuscle =
        selectedMuscleGroupId === null || ex.muscle_group_id === selectedMuscleGroupId;
      return matchesSearch && matchesMuscle;
    });
  }, [exercises, searchTerm, selectedMuscleGroupId]);

  // Mutations
  const archiveMutation = useMutation({
    mutationFn: archiveExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => Alert.alert('Gagal Mengarsipkan', err?.message),
  });

  const restoreMutation = useMutation({
    mutationFn: restoreExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => Alert.alert('Gagal Mengembalikan', err?.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      // If error (e.g. foreign key constraint because it was used in workout), offer archive instead
      Alert.alert(
        'Gerakan Sudah Memiliki Riwayat',
        'Gerakan ini sudah pernah digunakan dalam sesi latihan. Gerakan akan diarsipkan agar riwayat latihan tetap tersimpan.',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Arsipkan',
            onPress: () => {
              // Archive handler
            },
          },
        ],
      );
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateExercise(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => Alert.alert('Gagal Mengganti Nama', err?.message),
  });

  const mergeMutation = useMutation({
    mutationFn: ({ sourceId, targetId }: { sourceId: string; targetId: string }) =>
      mergeExercises(sourceId, targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setMergingSourceExercise(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Berhasil Digabungkan', 'Semua riwayat gerakan telah dipindahkan.');
    },
    onError: (err: any) => Alert.alert('Gagal Menggabungkan', err?.message),
  });

  const handleRename = (exercise: Exercise) => {
    Alert.prompt(
      'Ganti Nama Gerakan',
      `Masukkan nama baru untuk "${exercise.name}":`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Simpan',
          onPress: (newName?: string) => {
            if (newName && newName.trim() && newName.trim() !== exercise.name) {
              renameMutation.mutate({ id: exercise.id, name: newName.trim() });
            }
          },
        },
      ],
      'plain-text',
      exercise.name,
    );
  };

  const handleArchiveOrDelete = (exercise: Exercise) => {
    Alert.alert(
      'Kelola Gerakan',
      `Pilih tindakan untuk "${exercise.name}":`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Arsipkan Gerakan',
          onPress: () => archiveMutation.mutate(exercise.id),
        },
        {
          text: 'Hapus Permanen',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(exercise.id),
        },
      ],
    );
  };

  const handleStartMerge = (sourceEx: Exercise) => {
    setMergingSourceExercise(sourceEx);
  };

  const handleConfirmMerge = (targetEx: Exercise) => {
    if (!mergingSourceExercise) return;
    Alert.alert(
      'Konfirmasi Penggabungan',
      `Gabungkan riwayat "${mergingSourceExercise.name}" ke dalam "${targetEx.name}"? Gerakan "${mergingSourceExercise.name}" akan diarsipkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Gabungkan',
          onPress: () =>
            mergeMutation.mutate({
              sourceId: mergingSourceExercise.id,
              targetId: targetEx.id,
            }),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Gerakan</Text>
          <Text style={styles.subtitle}>
            {exercises.length} gerakan dalam katalog
          </Text>
        </View>
        <Button
          label="Buat"
          variant="primary"
          icon={<Plus size={18} color={colors.accent} strokeWidth={2.5} />}
          onPress={() => setShowCreateModal(true)}
        />
      </View>

      {/* Merging Banner Mode */}
      {mergingSourceExercise && (
        <View style={styles.mergeBanner}>
          <Text style={styles.mergeBannerText}>
            Pilih gerakan tujuan untuk menggabungkan "{mergingSourceExercise.name}":
          </Text>
          <Pressable
            onPress={() => setMergingSourceExercise(null)}
            style={styles.cancelMergeBtn}
          >
            <Text style={styles.cancelMergeText}>Batal</Text>
          </Pressable>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchBox}>
        <Input
          placeholder="Cari nama gerakan..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          leftIcon={<Search size={18} color={colors.surfaceMuted} />}
        />
      </View>

      {/* Muscle group filter chips */}
      <View style={styles.filterScrollWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: null, name: 'Semua' }, ...muscleGroups]}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => {
            const isSelected = selectedMuscleGroupId === item.id;
            return (
              <Pressable
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => {
                  setSelectedMuscleGroupId(item.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const mgName = muscleGroupMap.get(item.muscle_group_id) || 'Gerakan';
          const isSourceOfMerge = mergingSourceExercise?.id === item.id;

          if (isSourceOfMerge) return null;

          return (
            <Card>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleInfo}>
                    <Text style={styles.exerciseName}>{item.name}</Text>
                    <Text style={styles.exerciseMeta}>
                      {mgName}
                      {item.equipment ? ` • ${item.equipment}` : ''}
                    </Text>
                  </View>

                  {/* Actions */}
                  {mergingSourceExercise ? (
                    <Button
                      label="Pilih Ini"
                      variant="primary"
                      size="sm"
                      onPress={() => handleConfirmMerge(item)}
                    />
                  ) : (
                    <View style={styles.actionBtns}>
                      <Pressable
                        onPress={() => handleRename(item)}
                        hitSlop={8}
                        style={styles.actionIcon}
                      >
                        <Edit2 size={16} color={colors.textSecondary} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleStartMerge(item)}
                        hitSlop={8}
                        style={styles.actionIcon}
                      >
                        <GitMerge size={16} color={colors.textSecondary} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleArchiveOrDelete(item)}
                        hitSlop={8}
                        style={styles.actionIcon}
                      >
                        <Archive size={16} color={colors.surfaceMuted} />
                      </Pressable>
                    </View>
                  )}
                </View>

                {item.note && (
                  <Text style={styles.exerciseNote} numberOfLines={2}>
                    {item.note}
                  </Text>
                )}
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Dumbbell size={48} color={colors.surfaceMuted} />
            <Text style={styles.emptyTitle}>Belum ada gerakan</Text>
            <Text style={styles.emptySubtitle}>
              Klik tombol "Buat" di atas untuk menambahkan gerakan pertama kamu.
            </Text>
          </View>
        }
      />

      {/* Create Modal */}
      <CreateExerciseModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
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
    paddingTop: spacing.base,
    paddingBottom: spacing.base,
  } satisfies ViewStyle,
  title: {
    ...typography.title,
    color: colors.textPrimary,
  } satisfies TextStyle,
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  } satisfies TextStyle,
  mergeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.statusMixedBg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.statusMixed,
  } satisfies ViewStyle,
  mergeBannerText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  } satisfies TextStyle,
  cancelMergeBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  } satisfies ViewStyle,
  cancelMergeText: {
    ...typography.label,
    color: colors.statusMixed,
    fontWeight: '700',
  } satisfies TextStyle,
  searchBox: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  } satisfies ViewStyle,
  filterScrollWrapper: {
    paddingBottom: spacing.sm,
  } satisfies ViewStyle,
  filterRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  } satisfies ViewStyle,
  filterChip: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  } satisfies ViewStyle,
  filterChipActive: {
    backgroundColor: colors.textPrimary,
  } satisfies ViewStyle,
  filterChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  } satisfies TextStyle,
  filterChipTextActive: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  } satisfies TextStyle,
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  } satisfies ViewStyle,
  cardContent: {
    gap: spacing.xs,
  } satisfies ViewStyle,
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } satisfies ViewStyle,
  cardTitleInfo: {
    flex: 1,
  } satisfies ViewStyle,
  exerciseName: {
    ...typography.heading,
    color: colors.textPrimary,
  } satisfies TextStyle,
  exerciseMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  } satisfies TextStyle,
  exerciseNote: {
    ...typography.caption,
    color: colors.surfaceMuted,
    marginTop: spacing.xs,
  } satisfies TextStyle,
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  } satisfies ViewStyle,
  actionIcon: {
    padding: 4,
  } satisfies ViewStyle,
  empty: {
    alignItems: 'center',
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
    paddingHorizontal: spacing.xl,
  } satisfies TextStyle,
});
