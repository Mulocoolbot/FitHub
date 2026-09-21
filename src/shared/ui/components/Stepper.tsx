import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Minus, Plus } from 'lucide-react-native';
import { colors, typography, spacing, radius, motion, touchTarget, numericStyle } from '../tokens';

interface StepperProps {
  value: number;
  onValueChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  decimals?: number;
  label?: string;
  testID?: string;
}

export function Stepper({
  value,
  onValueChange,
  step = 1,
  min = 0,
  max = 999,
  unit,
  decimals = 0,
  label,
  testID,
}: StepperProps) {
  const valueScale = useSharedValue(1);

  const animatedValueStyle = useAnimatedStyle(() => ({
    transform: [{ scale: valueScale.value }],
  }));

  const handleStep = (direction: 1 | -1) => {
    const next = Math.round((value + step * direction) * 100) / 100;
    if (next < min || next > max) return;

    onValueChange(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    valueScale.value = withSequence(
      withTiming(1.15, { duration: motion.fast / 2 }),
      withTiming(1, { duration: motion.fast / 2 }),
    );
  };

  const displayValue = decimals > 0 ? value.toFixed(decimals) : String(value);

  return (
    <View style={styles.container} testID={testID}>
      {label != null && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        <Pressable
          style={[styles.button, value <= min && styles.buttonDisabled]}
          onPress={() => handleStep(-1)}
          disabled={value <= min}
          hitSlop={8}
        >
          <Minus size={20} strokeWidth={2.5} color={colors.textPrimary} />
        </Pressable>

        <Animated.View style={[styles.valueContainer, animatedValueStyle]}>
          <Text style={styles.value}>{displayValue}</Text>
          {unit != null && <Text style={styles.unit}>{unit}</Text>}
        </Animated.View>

        <Pressable
          style={[styles.button, value >= max && styles.buttonDisabled]}
          onPress={() => handleStep(1)}
          disabled={value >= max}
          hitSlop={8}
        >
          <Plus size={20} strokeWidth={2.5} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
  } satisfies ViewStyle,
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  } satisfies TextStyle,
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  } satisfies ViewStyle,
  button: {
    width: touchTarget.min,
    height: touchTarget.min,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  } satisfies ViewStyle,
  buttonDisabled: {
    opacity: 0.3,
  } satisfies ViewStyle,
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    minWidth: 80,
    justifyContent: 'center',
  } satisfies ViewStyle,
  value: {
    ...typography.title,
    color: colors.textPrimary,
    ...numericStyle,
  } satisfies TextStyle,
  unit: {
    ...typography.label,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  } satisfies TextStyle,
});
