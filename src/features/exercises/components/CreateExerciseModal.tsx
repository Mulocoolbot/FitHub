import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Alert,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Check, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Button, Input } from '../../../shared/ui/components';
import { colors, typography, spacing, radius, iconDefaults } from '../../../shared/ui/tokens';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  getMuscleGroups,
  createExercise,
  findSimilarExercises,
} from '../api/exerciseRepository';
import type { Exercise, MuscleGroupRegion, MuscleGroupRow } from '../../../shared/types/database';

const REGIONS: Array<{ id: MuscleGroupRegion; label: string }> = [
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'arms', label: 'Arms' },
  { id: 'legs', label: 'Legs' },
  { id: 'core', label: 'Core' },
  { id: 'other', label: 'Other' },
];

interface CreateExerciseModalProps {
  visible: boolean;
  initialName?: string;
  initialRegion?: MuscleGroupRegion;
  onClose: () => void;
  onSuccess: (exercise: Exercise) => void;
}

export function CreateExerciseModal({
  visible,
  initialName = '',
  initialRegion = 'chest',
  onClose,
  onSuccess,
}: CreateExerciseModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedRegion, setSelectedRegion] = useState<MuscleGroupRegion>(initialRegion);
  const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState<string | null>(null);
  const [name, setName] = useState(initialName);
  const [equipment, setEquipment] = useState('');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Duplicate warning state
  const [similarMatch, setSimilarMatch] = useState<{ id: string; name: string } | null>(null);

  const { data: allMuscleGroups } = useQuery({
    queryKey: ['muscleGroups'],
    queryFn: getMuscleGroups,
    staleTime: Infinity,
  });

  const muscleGroupsInRegion = (allMuscleGroups ?? []).filter(
    (mg) => mg.region === selectedRegion,
  );

  // Update initialName if provided
  useEffect(() => {
    if (visible) {
      setName(initialName);
      setSelectedRegion(initialRegion);
      setErrorMsg(null);
      setSimilarMatch(null);
    }
  }, [visible, initialName, initialRegion]);

  // Select first muscle group when region changes if not already in region
  useEffect(() => {
    if (muscleGroupsInRegion.length > 0) {
      const exists = muscleGroupsInRegion.some((mg) => mg.id === selectedMuscleGroupId);
      if (!exists) {
        setSelectedMuscleGroupId(muscleGroupsInRegion[0].id);
      }
    }
  }, [selectedRegion, muscleGroupsInRegion, selectedMuscleGroupId]);

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      owner_id: string;
      name: string;
      muscle_group_id: string;
      equipment?: string;
      note?: string;
    }) => {
      return createExercise(payload);
    },
    onSuccess: (newEx) => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess(newEx);
      handleClose();
    },
    onError: (err: any) => {
      if (err?.message?.includes('uniq_exercise_name_per_user') || err?.code === '23505') {
        setErrorMsg('Kamu sudah punya gerakan dengan nama ini di perpustakaan.');
      } else {
        setErrorMsg(err?.message || 'Gagal membuat gerakan. Coba lagi.');
      }
    },
  });

  const handleClose = () => {
    setName('');
    setEquipment('');
    setNote('');
    setErrorMsg(null);
    setSimilarMatch(null);
    onClose();
  };

  const handleCheckAndSubmit = async (bypassDuplicate = false) => {
    if (!name.trim()) {
      setErrorMsg('Nama gerakan tidak boleh kosong');
      return;
    }
    if (!selectedMuscleGroupId) {
      setErrorMsg('Pilih grup otot terlebih dahulu');
      return;
    }
    if (!user) return;

    setErrorMsg(null);

    // Fuzzy match check (ambang 0.4) per spec Bagian 4.2
    if (!bypassDuplicate) {
      try {
        const similar = await findSimilarExercises(user.id, name.trim());
        if (similar.length > 0 && similar[0].similarity >= 0.4) {
          setSimilarMatch(similar[0]);
          return;
        }
      } catch (e) {
        // Continue if RPC not available
      }
    }

    // Proceed to create
    saveMutation.mutate({
      owner_id: user.id,
      name: name.trim(),
      muscle_group_id: selectedMuscleGroupId,
      equipment: equipment.trim() || undefined,
      note: note.trim() || undefined,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Gerakan Baru</Text>
          <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
            <X size={iconDefaults.size} color={colors.textPrimary} strokeWidth={iconDefaults.strokeWidth} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {errorMsg && (
            <View style={styles.errorBanner}>
              <AlertCircle size={18} color={colors.error} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Fuzzy Duplicate Warning Dialog */}
          {similarMatch && (
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>Gerakan Mirip Ditemukan</Text>
              <Text style={styles.warningBody}>
                Kamu sudah punya{' '}
                <Text style={styles.warningHighlight}>"{similarMatch.name}"</Text>.
                Pakai yang itu atau tetap buat baru?
              </Text>
              <View style={styles.warningActions}>
                <Button
                  label="Pakai Yang Ada"
                  variant="primary"
                  size="sm"
                  onPress={() => {
                    const matched = (queryClient.getQueryData(['exercises']) as Exercise[] | undefined)?.find(
                      (e) => e.id === similarMatch.id,
                    );
                    if (matched) {
                      onSuccess(matched);
                      handleClose();
                    } else {
                      // Fallback dummy structure if cache missing
                      onSuccess({
                        id: similarMatch.id,
                        owner_id: user?.id ?? '',
                        name: similarMatch.name,
                        muscle_group_id: selectedMuscleGroupId ?? '',
                        secondary_group_ids: [],
                        equipment: null,
                        note: null,
                        archived_at: null,
                        created_at: new Date().toISOString(),
                      });
                      handleClose();
                    }
                  }}
                />
                <Button
                  label="Tetap Buat Baru"
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    setSimilarMatch(null);
                    handleCheckAndSubmit(true);
                  }}
                />
              </View>
            </View>
          )}

          {/* Region Selection (7 large cards) */}
          <Text style={styles.sectionLabel}>PILIH REGION</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.regionRow}
          >
            {REGIONS.map((r) => {
              const isSelected = selectedRegion === r.id;
              return (
                <Pressable
                  key={r.id}
                  style={[styles.regionCard, isSelected && styles.regionCardActive]}
                  onPress={() => {
                    setSelectedRegion(r.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[styles.regionCardText, isSelected && styles.regionCardTextActive]}>
                    {r.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Muscle Group Pills */}
          <Text style={styles.sectionLabel}>GRUP OTOT</Text>
          <View style={styles.muscleGroupRow}>
            {muscleGroupsInRegion.map((mg) => {
              const isSelected = selectedMuscleGroupId === mg.id;
              return (
                <Pressable
                  key={mg.id}
                  style={[styles.muscleChip, isSelected && styles.muscleChipActive]}
                  onPress={() => {
                    setSelectedMuscleGroupId(mg.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[styles.muscleChipText, isSelected && styles.muscleChipTextActive]}>
                    {mg.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Form Fields */}
          <View style={styles.inputsSection}>
            <Input
              label="Nama Gerakan"
              placeholder="Contoh: Incline Dumbbell Press"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (similarMatch) setSimilarMatch(null);
              }}
              autoFocus={!initialName}
            />

            <Input
              label="Equipment (Opsional)"
              placeholder="Contoh: Barbell, Dumbbell, Cable"
              value={equipment}
              onChangeText={setEquipment}
            />

            <Input
              label="Catatan Gerakan (Opsional)"
              placeholder="Contoh: Sudut bangku 30°, jeda 1 detik di bawah"
              value={note}
              onChangeText={setNote}
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            label="Simpan Gerakan"
            variant="primary"
            loading={saveMutation.isPending}
            onPress={() => handleCheckAndSubmit(false)}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
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
  scroll: {
    flex: 1,
  } satisfies ViewStyle,
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.base,
  } satisfies ViewStyle,
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  } satisfies TextStyle,
  regionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  } satisfies ViewStyle,
  regionCard: {
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  } satisfies ViewStyle,
  regionCardActive: {
    backgroundColor: colors.textPrimary,
  } satisfies ViewStyle,
  regionCardText: {
    ...typography.label,
    color: colors.textPrimary,
  } satisfies TextStyle,
  regionCardTextActive: {
    ...typography.label,
    color: colors.accent,
  } satisfies TextStyle,
  muscleGroupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  } satisfies ViewStyle,
  muscleChip: {
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  } satisfies ViewStyle,
  muscleChipActive: {
    backgroundColor: colors.textPrimary,
  } satisfies ViewStyle,
  muscleChipText: {
    ...typography.label,
    color: colors.textSecondary,
  } satisfies TextStyle,
  muscleChipTextActive: {
    ...typography.label,
    color: colors.accent,
  } satisfies TextStyle,
  inputsSection: {
    gap: spacing.base,
    marginTop: spacing.sm,
  } satisfies ViewStyle,
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.errorBg,
    padding: spacing.md,
    borderRadius: radius.sm,
  } satisfies ViewStyle,
  errorText: {
    ...typography.body,
    color: colors.error,
    flex: 1,
  } satisfies TextStyle,
  warningBox: {
    backgroundColor: colors.statusMixedBg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.statusMixed,
    gap: spacing.sm,
  } satisfies ViewStyle,
  warningTitle: {
    ...typography.heading,
    color: colors.statusMixed,
  } satisfies TextStyle,
  warningBody: {
    ...typography.body,
    color: colors.textPrimary,
  } satisfies TextStyle,
  warningHighlight: {
    fontWeight: '700',
    color: colors.textPrimary,
  } satisfies TextStyle,
  warningActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  } satisfies ViewStyle,
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceElevated,
  } satisfies ViewStyle,
});
