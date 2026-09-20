import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { Trash2 } from 'lucide-react-native';
import { Stepper, IconButton } from '../../../shared/ui/components';
import { colors, typography, spacing, radius, numericStyle } from '../../../shared/ui/tokens';

interface SetRowProps {
  setNo: number;
  weightKg: number;
  reps: number;
  isWarmup: boolean;
  unit: 'kg' | 'lb';
  onWeightChange: (value: number) => void;
  onRepsChange: (value: number) => void;
  onToggleWarmup: () => void;
  onDelete: () => void;
  testID?: string;
}

export function SetRow({
  setNo,
  weightKg,
  reps,
  isWarmup,
  unit,
  onWeightChange,
  onRepsChange,
  onToggleWarmup,
  onDelete,
  testID,
}: SetRowProps) {
  const displayWeight = unit === 'lb' ? Math.round(weightKg * 2.20462 * 10) / 10 : weightKg;

  return (
    <Animated.View
      testID={testID}
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      layout={Layout.springify()}
      style={[styles.container, isWarmup && styles.warmupContainer]}
    >
      <View style={styles.header}>
        <Pressable onPress={onToggleWarmup} style={styles.setLabel}>
          <Text style={[styles.setNumber, isWarmup && styles.warmupText]}>
            {isWarmup ? 'W' : setNo}
          </Text>
        </Pressable>

        <View style={styles.steppers}>
          <Stepper
            value={displayWeight}
            onValueChange={(v) => {
              const kg = unit === 'lb' ? v / 2.20462 : v;
              onWeightChange(Math.round(kg * 100) / 100);
            }}
            step={unit === 'lb' ? 5 : 2.5}
            min={0}
            max={500}
            unit={unit}
            decimals={1}
            label="WEIGHT"
          />
          <Stepper
            value={reps}
            onValueChange={onRepsChange}
            step={1}
            min={1}
            max={100}
            label="REPS"
          />
        </View>

        <IconButton
          icon={<Trash2 size={16} color={colors.textTertiary} />}
          onPress={onDelete}
          testID={`${testID}-delete`}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  } satisfies ViewStyle,
  warmupContainer: {
    opacity: 0.7,
    borderStyle: 'dashed',
  } satisfies ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  } satisfies ViewStyle,
  setLabel: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  } satisfies ViewStyle,
  setNumber: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
    ...numericStyle,
  } satisfies TextStyle,
  warmupText: {
    color: colors.textSecondary,
  } satisfies TextStyle,
  steppers: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.base,
  } satisfies ViewStyle,
});
