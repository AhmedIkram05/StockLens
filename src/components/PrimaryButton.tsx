/**
 * PrimaryButton Component
 * 
 * The main action button used throughout the app for primary CTAs.
 * Features theme-aware styling with automatic text color adjustment for light/dark modes.
 * 
 * Supports disabled states, custom styling, and accessibility labels.
 * Uses brandColors.green as the primary action color per design system.
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
import { Pressable, Text, StyleSheet, StyleProp, ViewStyle, TextStyle, Platform } from 'react-native';
import { brandColors } from '../contexts/ThemeContext';
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
 * Uses Pressable with platform-specific press feedback for native feel.
 */
export default function PrimaryButton({ onPress, children, style, textStyle, disabled, accessibilityLabel }: Props) {
  const { theme, isDark } = useTheme();
  
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && { opacity: 0.6 },
        style
      ]}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={[styles.text, { color: isDark ? brandColors.black : brandColors.white }, textStyle]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: brandColors.green,
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.level2,
  },
  text: {
    color: brandColors.white,
    ...typography.button,
  },
  disabled: {
    opacity: 0.45,
  },
});
