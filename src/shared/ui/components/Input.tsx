import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors, typography, spacing, radius, motion } from '../tokens';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  testID?: string;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function Input({ label, error, icon, leftIcon, testID, ...rest }: InputProps) {
  const resolvedIcon = icon ?? leftIcon;
  const [focused, setFocused] = useState(false);
  const borderProgress = useSharedValue(0);

  const animatedBorder = useAnimatedStyle(() => ({
    borderColor: borderProgress.value === 1 ? colors.textPrimary : colors.surfaceMuted,
  }));

  const handleFocus = () => {
    setFocused(true);
    borderProgress.value = withTiming(1, { duration: motion.fast });
  };

  const handleBlur = () => {
    setFocused(false);
    borderProgress.value = withTiming(0, { duration: motion.fast });
  };

  return (
    <View style={styles.container}>
      {label != null && <Text style={styles.label}>{label}</Text>}
      <AnimatedView
        style={[
          styles.inputWrapper,
          error != null && styles.inputError,
          animatedBorder,
        ]}
      >
        {resolvedIcon != null && <View style={styles.iconWrapper}>{resolvedIcon}</View>}
        <TextInput
          testID={testID}
          style={[styles.input, resolvedIcon != null && styles.inputWithIcon]}
          placeholderTextColor={colors.surfaceMuted}
          selectionColor={colors.textPrimary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
      </AnimatedView>
      {error != null && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  } satisfies ViewStyle,
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  } satisfies TextStyle,
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.base,
  } satisfies ViewStyle,
  inputError: {
    borderColor: colors.error,
  } satisfies ViewStyle,
  iconWrapper: {
    marginRight: spacing.sm,
  } satisfies ViewStyle,
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
    minHeight: 48,
  } satisfies TextStyle,
  inputWithIcon: {
    paddingLeft: 0,
  } satisfies TextStyle,
  error: {
    ...typography.caption,
    color: colors.error,
  } satisfies TextStyle,
});
