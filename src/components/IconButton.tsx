/**
 * IconButton Component
 * 
 * A circular button containing only an icon, used for compact actions throughout the app.
 * Features a green background by default with customizable icon, size, and color.
 * 
 * Includes hitSlop for improved touch target accessibility (expands hit area by 10px in all directions).
 * Commonly used for camera controls, navigation actions, and toolbar buttons.
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../styles/palette';
import { radii, shadows, spacing, sizes } from '../styles/theme';

type Props = {
  /** Ionicon name to display in the button */
  name: React.ComponentProps<typeof Ionicons>['name'];
  /** Size of the icon in pixels. Default: 20 */
  size?: number;
  /** Color of the icon. Default: white */
  color?: string;
  /** Callback triggered when button is pressed */
  onPress?: () => void;
  /** Optional custom styling for the button container */
  style?: ViewStyle | ViewStyle[];
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
};

/**
 * Renders a circular button with an icon centered inside.
 * Button size is theme.sizes.controlMd (44px) with hitSlop for easier pressing.
 */
export default function IconButton({ name, size = 20, color = palette.white, onPress, style, accessibilityLabel }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name={name} size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: sizes.controlMd,
    height: sizes.controlMd,
    borderRadius: radii.pill,
    backgroundColor: palette.green,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.level2,
    margin: spacing.xs / 2,
  },
});
