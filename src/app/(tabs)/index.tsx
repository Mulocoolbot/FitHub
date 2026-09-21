import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  SafeAreaView,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Plus, ChevronRight, Clock, Dumbbell } from 'lucide-react-native';
import { format } from 'date-fns';
import { Button, Card } from '../../shared/ui/components';
import { SyncIndicator } from '../../features/workout/components/SyncIndicator';
import { colors, typography, spacing, numericStyle, iconDefaults } from '../../shared/ui/tokens';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useActiveWorkout } from '../../features/workout/hooks/useActiveWorkout';
import { getSessions } from '../../features/workout/api/workoutRepository';
import { formatDuration } from '../../shared/lib/formatters';
import type { WorkoutSession } from '../../shared/types/database';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isActive, startWorkout } = useActiveWorkout();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions', user?.id],
    queryFn: () => getSessions(user!.id),
    enabled: !!user,
  });

  const handleStartWorkout = useCallback(() => {
    startWorkout();
    router.push('/workout/active');
  }, [startWorkout, router]);

  const renderSession = useCallback(
    ({ item, index }: { item: WorkoutSession; index: number }) => (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
        <Pressable
          onPress={() => router.push(`/workout/${item.id}`)}
          style={styles.sessionPressable}
        >
          <Card>
            <View style={styles.sessionHeader}>
              <View>
                <Text style={styles.sessionDate}>
                  {format(new Date(item.performed_at), 'EEE, d MMM yyyy')}
                </Text>
                {item.duration_sec != null && (
                  <View style={styles.sessionMeta}>
                    <Clock size={14} color={colors.textSecondary} />
                    <Text style={styles.sessionDuration}>
                      {formatDuration(item.duration_sec)}
                    </Text>
                  </View>
                )}
              </View>
              <ChevronRight
                size={20}
                color={colors.surfaceMuted}
                strokeWidth={iconDefaults.strokeWidth}
              />
            </View>
            {item.note != null && item.note.length > 0 && (
              <Text style={styles.sessionNote} numberOfLines={1}>
                {item.note}
              </Text>
            )}
          </Card>
        </Pressable>
      </Animated.View>
    ),
    [router],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>FitHub</Text>
          <SyncIndicator isSynced={true} />
        </View>
        <Button
          testID="btn-start-workout"
          label={isActive ? 'Resume' : 'Start'}
          onPress={handleStartWorkout}
          variant="primary"
          icon={
            <Plus size={18} color={colors.accent} strokeWidth={2.5} />
          }
        />
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSession}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Dumbbell size={48} color={colors.surfaceMuted} />
            <Text style={styles.emptyTitle}>No workouts yet</Text>
            <Text style={styles.emptySubtitle}>
              Start your first session to begin tracking
            </Text>
          </View>
        }
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
  greeting: {
    ...typography.title,
    color: colors.textPrimary,
  } satisfies TextStyle,
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  } satisfies ViewStyle,
  sessionPressable: {
    // Pressable wrapper for Card
  } satisfies ViewStyle,
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } satisfies ViewStyle,
  sessionDate: {
    ...typography.heading,
    color: colors.textPrimary,
  } satisfies TextStyle,
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  } satisfies ViewStyle,
  sessionDuration: {
    ...typography.label,
    color: colors.textSecondary,
    ...numericStyle,
  } satisfies TextStyle,
  sessionNote: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  } satisfies TextStyle,
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxl * 2,
    gap: spacing.md,
  } satisfies ViewStyle,
  emptyTitle: {
    ...typography.heading,
    color: colors.textSecondary,
  } satisfies TextStyle,
  emptySubtitle: {
    ...typography.label,
    color: colors.surfaceMuted,
    textAlign: 'center',
  } satisfies TextStyle,
});
