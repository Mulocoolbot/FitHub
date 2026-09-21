import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  Pressable,
  StyleSheet,
  SafeAreaView,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { X, Search, Plus, Dumbbell, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, iconDefaults } from '../../../shared/ui/tokens';
import { Input, Card } from '../../../shared/ui/components';
import { getExercises, getMuscleGroups } from '../api/exerciseRepository';
import { CreateExerciseModal } from './CreateExerciseModal';
import type { Exercise } from '../../../shared/types/database';

interface ExercisePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export function ExercisePickerModal({
  visible,
  onClose,
  onSelect,
}: ExercisePickerModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: exercises = [], isLoading: isLoadingExercises } = useQuery({
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

  const showInlineCreate = useMemo(() => {
    if (!searchTerm.trim()) return false;
    const cleanSearch = searchTerm.trim().toLowerCase();
    return !exercises.some((e) => e.name.trim().toLowerCase() === cleanSearch);
  }, [exercises, searchTerm]);

  const handleSelect = (exercise: Exercise) => {
    Haptics.selectionAsync();
    onSelect(exercise);
    handleClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedMuscleGroupId(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Pilih Gerakan</Text>
          <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
            <X size={iconDefaults.size} color={colors.textPrimary} strokeWidth={iconDefaults.strokeWidth} />
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Input
            placeholder="Cari atau buat gerakan..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            leftIcon={<Search size={18} color={colors.surfaceMuted} />}
            autoFocus={false}
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

        {/* Exercise List */}
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            showInlineCreate ? (
              <Pressable
                style={styles.inlineCreateRow}
                onPress={() => setShowCreateModal(true)}
              >
                <View style={styles.inlineCreateIcon}>
                  <Plus size={18} color={colors.accent} strokeWidth={2.5} />
                </View>
                <View style={styles.inlineCreateContent}>
                  <Text style={styles.inlineCreateTitle}>
                    + Buat "{searchTerm.trim()}"
                  </Text>
                  <Text style={styles.inlineCreateSubtitle}>
                    Tambahkan ke daftar gerakan kamu
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.surfaceMuted} />
              </Pressable>
            ) : null
          }
          renderItem={({ item }) => {
            const mgName = muscleGroupMap.get(item.muscle_group_id) || 'Gerakan';
            return (
              <Pressable
                style={styles.exerciseItem}
                onPress={() => handleSelect(item)}
              >
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  <Text style={styles.exerciseMeta}>
                    {mgName}
                    {item.equipment ? ` • ${item.equipment}` : ''}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.surfaceMuted} />
              </Pressable>
            );
          }}
          ListEmptyComponent={
            !showInlineCreate ? (
              <View style={styles.emptyContainer}>
                <Dumbbell size={40} color={colors.surfaceMuted} />
                <Text style={styles.emptyTitle}>Belum ada gerakan</Text>
                <Text style={styles.emptySubtitle}>
                  Ketik nama gerakan di atas untuk menambahkannya
                </Text>
              </View>
            ) : null
          }
        />

        {/* Create modal when + Buat is tapped */}
        <CreateExerciseModal
          visible={showCreateModal}
          initialName={searchTerm.trim()}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newEx) => {
            setShowCreateModal(false);
            handleSelect(newEx);
          }}
        />
      </SafeAreaView>
    </Modal>
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
  title: {
    ...typography.title,
    color: colors.textPrimary,
  } satisfies TextStyle,
  closeBtn: {
    padding: spacing.xs,
  } satisfies ViewStyle,
  searchBox: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
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
    gap: spacing.sm,
  } satisfies ViewStyle,
  inlineCreateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.textPrimary,
    marginBottom: spacing.sm,
    gap: spacing.md,
  } satisfies ViewStyle,
  inlineCreateIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  } satisfies ViewStyle,
  inlineCreateContent: {
    flex: 1,
  } satisfies ViewStyle,
  inlineCreateTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  } satisfies TextStyle,
  inlineCreateSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  } satisfies TextStyle,
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: radius.md,
  } satisfies ViewStyle,
  exerciseInfo: {
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
  emptyContainer: {
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
