import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Timer, Plus, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, radius, numericStyle } from '../../../shared/ui/tokens';

interface RestTimerProps {
  initialSeconds?: number;
  onFinish?: () => void;
  onDismiss?: () => void;
}

export function RestTimer({
  initialSeconds = 90,
  onFinish,
  onDismiss,
}: RestTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval!);
            setIsActive(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onFinish?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsRemaining, onFinish]);

  const addSeconds = useCallback((sec: number) => {
    setSecondsRemaining((prev) => prev + sec);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Timer size={18} color={colors.accent} strokeWidth={2.2} />
        <Text style={styles.label}>Rest</Text>
        <Text style={styles.time}>{formatTime(secondsRemaining)}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.addBtn}
          onPress={() => addSeconds(30)}
          hitSlop={8}
        >
          <Plus size={14} color={colors.accent} strokeWidth={2.5} />
          <Text style={styles.addText}>30s</Text>
        </Pressable>

        <Pressable
          style={styles.dismissBtn}
          onPress={onDismiss}
          hitSlop={8}
        >
          <X size={16} color={colors.accent} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.textPrimary, // White pill with black text/icon (contrast rule)
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  } satisfies ViewStyle,
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  } satisfies ViewStyle,
  label: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
  } satisfies TextStyle,
  time: {
    ...typography.heading,
    color: colors.accent,
    fontWeight: '700',
    marginLeft: spacing.xs,
    ...numericStyle,
  } satisfies TextStyle,
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.md,
  } satisfies ViewStyle,
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.full,
    gap: 2,
  } satisfies ViewStyle,
  addText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  } satisfies TextStyle,
  dismissBtn: {
    padding: 4,
  } satisfies ViewStyle,
});
