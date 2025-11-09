/**
 * DangerButton Component
 * 
 * A solid red button used for destructive or dangerous actions (e.g., "Delete", "Sign Out", "Cancel").
 * Uses palette.red to visually communicate potential consequences of the action.
 * 
 * Provides clear visual distinction from primary and secondary buttons to prevent accidental clicks.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { palette } from '../styles/palette';
import { radii, spacing, typography, shadows } from '../styles/theme';

type Props = {
  /** Callback triggered when button is pressed */
  onPress?: () => void;
  /** Button text content (can also be React elements) */
  children?: React.ReactNode;
  /** Optional custom styling for the button container */
  style?: StyleProp<ViewStyle>;
  /** Optional custom styling for the button text */
  textStyle?: StyleProp<TextStyle>;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
};

/**
 * Renders a solid red button for destructive actions.
 * Always displays white text on red background for maximum contrast and visibility.
 */
export default function DangerButton({ onPress, children, style, textStyle, accessibilityLabel }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.button, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={[styles.text, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: palette.red,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    ...shadows.level2,
  },
  text: {
    color: palette.white,
    ...typography.button,
  },
});
