/**
 * SecondaryButton Component
 * 
 * A transparent button with green border, used for secondary actions throughout the app.
 * Provides visual hierarchy by contrast with the solid PrimaryButton.
 * 
 * Supports disabled states and custom styling. Follows the app's design system
 * with palette.green for brand consistency.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
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
  /** When true, button is non-interactive with reduced opacity */
  disabled?: boolean;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
};

/**
 * Renders a transparent button with green border and text.
 * Used for secondary actions alongside PrimaryButton.
 */
export default function SecondaryButton({ onPress, children, style, textStyle, disabled, accessibilityLabel }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.button, disabled && styles.disabled, style]}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={[styles.text, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: palette.green,
    borderRadius: radii.md,
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.level1,
  },
  text: {
    color: palette.green,
    ...typography.button,
  },
  disabled: {
    opacity: 0.5,
  },
});
