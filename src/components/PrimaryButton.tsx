/**
 * PrimaryButton Component
 * 
 * The main action button used throughout the app for primary CTAs.
 * Features theme-aware styling with automatic text color adjustment for light/dark modes.
 * 
 * Supports disabled states, custom styling, and accessibility labels.
 * Uses palette.green as the primary action color per design system.
 * 
 * @example
 * // Standard primary button
 * <PrimaryButton onPress={handleSubmit}>
 *   Submit Form
 * </PrimaryButton>
 * 
 * @example
 * // Disabled state
 * <PrimaryButton disabled={!isValid} onPress={handleSave}>
 *   Save Changes
 * </PrimaryButton>
 * 
 * @example
 * // Custom styling with accessibility label
 * <PrimaryButton
 *   onPress={handleCheckout}
 *   style={{ marginTop: 20 }}
 *   accessibilityLabel="Proceed to checkout"
 * >
 *   Checkout
 * </PrimaryButton>
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { palette } from '../styles/palette';
import { radii, spacing, typography, shadows } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

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
 * Renders a styled primary action button with theme-aware text color.
 * Text color automatically switches between white (light mode) and black (dark mode).
 */
export default function PrimaryButton({ onPress, children, style, textStyle, disabled, accessibilityLabel }: Props) {
  const { theme, isDark } = useTheme();
  
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.button, disabled && styles.disabled, style]}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={[styles.text, { color: isDark ? palette.black : palette.white }, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: palette.green,
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.level2,
  },
  text: {
    color: palette.white,
    ...typography.button,
  },
  disabled: {
    opacity: 0.45,
  },
});
