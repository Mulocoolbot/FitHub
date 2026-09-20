import React, { useCallback, useEffect } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Dimensions,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors, spacing, radius, motion } from '../tokens';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[];
  testID?: string;
}

export function Sheet({
  visible,
  onClose,
  children,
  snapPoints = [0.5],
  testID,
}: SheetProps) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayOpacity = useSharedValue(0);
  const sheetHeight = SCREEN_HEIGHT * snapPoints[0];

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: motion.spring.damping,
        stiffness: motion.spring.stiffness,
        mass: motion.spring.mass,
      });
      overlayOpacity.value = withTiming(1, { duration: motion.normal });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: motion.normal });
      overlayOpacity.value = withTiming(0, { duration: motion.normal });
    }
  }, [visible, translateY, overlayOpacity]);

  const closeSheet = useCallback(() => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: motion.normal });
    overlayOpacity.value = withTiming(0, { duration: motion.normal });
    setTimeout(onClose, motion.normal);
  }, [onClose, translateY, overlayOpacity]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > sheetHeight * 0.3) {
        runOnJS(closeSheet)();
      } else {
        translateY.value = withSpring(0, {
          damping: motion.spring.damping,
          stiffness: motion.spring.stiffness,
        });
      }
    });

  const animatedSheet = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedOverlay = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.overlay, animatedOverlay]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
      </Animated.View>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          testID={testID}
          style={[styles.sheet, { height: sheetHeight }, animatedSheet]}
        >
          <View style={styles.handle} />
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
  } satisfies ViewStyle,
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  } satisfies ViewStyle,
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
  } satisfies ViewStyle,
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textTertiary,
    alignSelf: 'center',
    marginTop: spacing.sm,
  } satisfies ViewStyle,
  content: {
    flex: 1,
    padding: spacing.base,
    paddingTop: spacing.lg,
  } satisfies ViewStyle,
});
