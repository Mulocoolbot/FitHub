import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { Cloud, CloudOff } from 'lucide-react-native';
import { colors, typography, spacing } from '../../../shared/ui/tokens';

interface SyncIndicatorProps {
  isSynced: boolean;
  pendingCount?: number;
}

export function SyncIndicator({ isSynced, pendingCount = 0 }: SyncIndicatorProps) {
  return (
    <View style={styles.container}>
      {isSynced ? (
        <>
          <Cloud size={14} color={colors.statusUp} />
          <Text style={[styles.text, { color: colors.statusUp }]}>Saved</Text>
        </>
      ) : (
        <>
          <CloudOff size={14} color={colors.statusFlat} />
          <Text style={[styles.text, { color: colors.statusFlat }]}>
            Local{pendingCount > 0 ? ` (${pendingCount} pending)` : ''}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  } satisfies ViewStyle,
  text: {
    ...typography.caption,
  } satisfies TextStyle,
});
