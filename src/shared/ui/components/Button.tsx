import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors, typography, spacing, radius, motion, touchTarget } from '../tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  testID,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: motion.fast });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: motion.fast });
  };

  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      testID={testID}
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.accent : colors.textPrimary}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              variantLabelStyles[variant],
              size === 'lg' && styles.labelLg,
              icon != null && styles.labelWithIcon,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchTarget.min,
    borderRadius: radius.md,
  } satisfies ViewStyle,
  fullWidth: {
    width: '100%',
  } satisfies ViewStyle,
  disabled: {
    opacity: 0.4,
  } satisfies ViewStyle,
  label: {
    ...typography.body,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  } satisfies TextStyle,
  labelLg: {
    ...typography.heading,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  } satisfies TextStyle,
  labelWithIcon: {
    marginLeft: spacing.sm,
  } satisfies TextStyle,
});

const sizeStyles = StyleSheet.create({
  sm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 36,
  } satisfies ViewStyle,
  md: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  } satisfies ViewStyle,
  lg: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
  } satisfies ViewStyle,
});

// Primary: white fill with black text (accent is #000 so we invert)
// Secondary: outline with white border
// Ghost: transparent with white text
const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.textPrimary,
  } satisfies ViewStyle,
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
  } satisfies ViewStyle,
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
  } satisfies ViewStyle,
  ghost: {
    backgroundColor: 'transparent',
  } satisfies ViewStyle,
});

const variantLabelStyles = StyleSheet.create({
  primary: {
    color: colors.accent,
  } satisfies TextStyle,
  secondary: {
    color: colors.textPrimary,
  } satisfies TextStyle,
  outline: {
    color: colors.textPrimary,
  } satisfies TextStyle,
  ghost: {
    color: colors.textPrimary,
  } satisfies TextStyle,
});
