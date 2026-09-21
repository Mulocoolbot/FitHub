import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2, Clock, Calendar, Dumbbell, Edit3 } from 'lucide-react-native';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, iconDefaults, numericStyle } from '../../../shared/ui/tokens';
import { Card, Button, Input } from '../../../shared/ui/components';
import { getSessionById, deleteSession, updateSession } from '../api/workoutRepository';
import { formatDuration } from '../../../shared/lib/formatters';

export function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session', id],
    queryFn: () => getSessionById(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSession(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Gagal Menghapus Sesi', err?.message || 'Terjadi kesalahan');
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: () => updateSession(id!, { note: noteText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setIsEditingNote(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => {
      Alert.alert('Gagal Mengupdate Catatan', err?.message || 'Terjadi kesalahan');
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Hapus Sesi Latihan',
      'Apakah kamu yakin ingin menghapus sesi latihan ini? Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
      </SafeAreaView>
    );
  }

  if (error || !session) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>Sesi tidak ditemukan atau gagal dimuat.</Text>
        <Button label="Kembali" variant="outline" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const sessionExercises = (session.session_exercises as any[]) || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn}>
          <ArrowLeft size={iconDefaults.size} color={colors.textPrimary} />
        </Pressable>

        <Text style={styles.headerTitle}>Detail Sesi</Text>

        <Pressable onPress={handleDelete} hitSlop={12} style={styles.iconBtn}>
          <Trash2 size={20} color={colors.error} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Session Meta Card */}
        <Card>
          <View style={styles.metaRow}>
            <Calendar size={18} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              {format(new Date(session.performed_at), 'EEEE, d MMMM yyyy')}
            </Text>
          </View>

          {session.duration_sec != null && (
            <View style={styles.metaRow}>
              <Clock size={18} color={colors.textSecondary} />
              <Text style={styles.metaText}>
                Durasi: {formatDuration(session.duration_sec)}
              </Text>
            </View>
          )}

          {/* Note section */}
          <View style={styles.noteSection}>
            <View style={styles.noteHeader}>
              <Text style={styles.noteLabel}>Catatan Sesi</Text>
              {!isEditingNote && (
                <Pressable
                  onPress={() => {
                    setNoteText(session.note || '');
                    setIsEditingNote(true);
                  }}
                  hitSlop={8}
                >
                  <Edit3 size={16} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>

            {isEditingNote ? (
              <View style={styles.editNoteBox}>
                <Input
                  value={noteText}
                  onChangeText={setNoteText}
                  placeholder="Tulis catatan sesi..."
                  multiline
                />
                <View style={styles.noteActions}>
                  <Button
                    label="Batal"
                    variant="outline"
                    size="sm"
                    onPress={() => setIsEditingNote(false)}
                  />
                  <Button
                    label="Simpan"
                    variant="primary"
                    size="sm"
                    loading={updateNoteMutation.isPending}
                    onPress={() => updateNoteMutation.mutate()}
                  />
                </View>
              </View>
            ) : (
              <Text style={styles.noteBody}>
                {session.note || 'Tidak ada catatan'}
              </Text>
            )}
          </View>
        </Card>

        {/* Exercises */}
        <Text style={styles.sectionHeading}>DAFTAR GERAKAN & SET</Text>

        {sessionExercises.map((se: any, idx: number) => {
          const sets = (se.sets as any[]) || [];
          return (
            <Card key={se.id || idx}>
              <View style={styles.exCardHeader}>
                <Dumbbell size={20} color={colors.textPrimary} />
                <Text style={styles.exCardTitle}>
                  {se.exercise?.name || 'Gerakan'}
                </Text>
              </View>

              <View style={styles.setsTable}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.colHeader, { width: 36 }]}>SET</Text>
                  <Text style={[styles.colHeader, { flex: 1 }]}>BEBAN</Text>
                  <Text style={[styles.colHeader, { flex: 1 }]}>REPS</Text>
                  <Text style={[styles.colHeader, { flex: 1 }]}>EST. 1RM</Text>
                </View>

                {sets.map((s: any, sIdx: number) => {
                  const e1rm = Math.round(Number(s.weight_kg) * (1 + Number(s.reps) / 30.0) * 10) / 10;
                  return (
                    <View key={s.id || sIdx} style={styles.tableRow}>
                      <View style={[styles.setTag, s.is_warmup && styles.warmupTag]}>
                        <Text style={styles.setTagText}>
                          {s.is_warmup ? 'W' : s.set_no}
                        </Text>
                      </View>
                      <Text style={styles.tableCell}>{s.weight_kg} kg</Text>
                      <Text style={styles.tableCell}>{s.reps} reps</Text>
                      <Text style={styles.tableCellSecondary}>{e1rm} kg</Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } satisfies ViewStyle,
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
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
  iconBtn: {
    padding: spacing.xs,
  } satisfies ViewStyle,
  headerTitle: {
    ...typography.title,
    color: colors.textPrimary,
  } satisfies TextStyle,
  scroll: {
    flex: 1,
  } satisfies ViewStyle,
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.base,
  } satisfies ViewStyle,
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  } satisfies ViewStyle,
  metaText: {
    ...typography.body,
    color: colors.textPrimary,
  } satisfies TextStyle,
  noteSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  } satisfies ViewStyle,
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  } satisfies ViewStyle,
  noteLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  } satisfies TextStyle,
  noteBody: {
    ...typography.body,
    color: colors.textSecondary,
  } satisfies TextStyle,
  editNoteBox: {
    gap: spacing.sm,
  } satisfies ViewStyle,
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  } satisfies ViewStyle,
  sectionHeading: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  } satisfies TextStyle,
  exCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  } satisfies ViewStyle,
  exCardTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  } satisfies TextStyle,
  setsTable: {
    gap: spacing.xs,
  } satisfies ViewStyle,
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  } satisfies ViewStyle,
  colHeader: {
    ...typography.caption,
    color: colors.surfaceMuted,
    fontWeight: '600',
  } satisfies TextStyle,
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  } satisfies ViewStyle,
  setTag: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  } satisfies ViewStyle,
  warmupTag: {
    opacity: 0.6,
  } satisfies ViewStyle,
  setTagText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
    ...numericStyle,
  } satisfies TextStyle,
  tableCell: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    ...numericStyle,
  } satisfies TextStyle,
  tableCellSecondary: {
    flex: 1,
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    ...numericStyle,
  } satisfies TextStyle,
  errorText: {
    ...typography.body,
    color: colors.error,
  } satisfies TextStyle,
});
