import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { colors, spacing, radius, shadows } from '../tokens';

interface CardProps {
  children: React.ReactNode;
  elevated?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function Card({ children, elevated = false, style, testID }: CardProps) {
  return (
    <View
      testID={testID}
      style={[
        styles.card,
        elevated && styles.elevated,
        elevated ? shadows.elevated : shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  } satisfies ViewStyle,
  elevated: {
    backgroundColor: colors.surfaceElevated,
  } satisfies ViewStyle,
});
