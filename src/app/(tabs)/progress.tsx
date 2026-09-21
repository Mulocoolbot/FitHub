import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, type ViewStyle, type TextStyle } from 'react-native';
import { BarChart3 } from 'lucide-react-native';
import { colors, typography, spacing } from '../../shared/ui/tokens';

export default function ProgressScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
      </View>
      <View style={styles.empty}>
        <BarChart3 size={48} color={colors.surfaceMuted} />
        <Text style={styles.emptyTitle}>Track your gains</Text>
        <Text style={styles.emptySubtitle}>
          Complete a few workouts to see your progress trends
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } satisfies ViewStyle,
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing.base,
  } satisfies ViewStyle,
  title: {
    ...typography.title,
    color: colors.textPrimary,
  } satisfies TextStyle,
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBottom: spacing.xxl * 2,
  } satisfies ViewStyle,
  emptyTitle: {
    ...typography.heading,
    color: colors.textSecondary,
  } satisfies TextStyle,
  emptySubtitle: {
    ...typography.label,
    color: colors.surfaceMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
  } satisfies TextStyle,
});
