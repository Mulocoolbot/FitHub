import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { colors, spacing, radius } from '../tokens';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Card component for content that contains text.
 * Uses surfaceElevated (#3A3E43) per spec Bagian 9.2 — contrast >11:1 vs white text.
 * No drop shadows per spec Bagian 9.1.
 */
export function Card({ children, style, testID }: CardProps) {
  return (
    <View
      testID={testID}
      style={[styles.card, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.base,
  } satisfies ViewStyle,
});
