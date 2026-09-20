import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Shuffle,
  Sparkles,
} from 'lucide-react-native';
import type { ProgressStatus } from '../../types/database';
import { colors, typography, spacing, radius, iconDefaults } from '../tokens';

interface StatusChipProps {
  status: ProgressStatus;
  label?: string;
  testID?: string;
}

const STATUS_CONFIG: Record<
  ProgressStatus,
  { color: string; bg: string; icon: React.ElementType; text: string }
> = {
  up: { color: colors.statusUp, bg: colors.statusUpBg, icon: TrendingUp, text: 'Up' },
  down: { color: colors.statusDown, bg: colors.statusDownBg, icon: TrendingDown, text: 'Down' },
  flat: { color: colors.statusFlat, bg: colors.statusFlatBg, icon: Minus, text: 'Flat' },
  mixed: { color: colors.statusMixed, bg: colors.statusMixedBg, icon: Shuffle, text: 'Mixed' },
  new: { color: colors.statusNew, bg: colors.statusNewBg, icon: Sparkles, text: 'New' },
};

export function StatusChip({ status, label, testID }: StatusChipProps) {
  const config = STATUS_CONFIG[status];
  const IconComponent = config.icon;

  return (
    <View
      testID={testID}
      style={[styles.chip, { backgroundColor: config.bg }]}
    >
      <IconComponent
        size={14}
        strokeWidth={iconDefaults.strokeWidth}
        color={config.color}
      />
      <Text style={[styles.label, { color: config.color }]}>
        {label ?? config.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    gap: spacing.xs,
    alignSelf: 'flex-start',
  } satisfies ViewStyle,
  label: {
    ...typography.caption,
    fontWeight: '600',
  } satisfies TextStyle,
});
