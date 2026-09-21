import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, motion, touchTarget } from '../tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  variant?: 'default' | 'surface';
  disabled?: boolean;
  testID?: string;
}

export function IconButton({
  icon,
  onPress,
  variant = 'default',
  disabled = false,
  testID,
}: IconButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      testID={testID}
      style={[
        styles.base,
        variant === 'surface' && styles.surface,
        disabled && styles.disabled,
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.9, { duration: motion.fast });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: motion.fast });
      }}
      disabled={disabled}
      hitSlop={4}
    >
      {icon}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: touchTarget.min,
    height: touchTarget.min,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  } satisfies ViewStyle,
  surface: {
    backgroundColor: colors.surfaceElevated,
  } satisfies ViewStyle,
  disabled: {
    opacity: 0.4,
  } satisfies ViewStyle,
});
