/**
 * AuthFooter
 *
 * Footer used on auth screens to prompt navigation to the alternate flow.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { brandColors } from '../contexts/ThemeContext';
import { radii, spacing, typography, shadows } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

type Props = {
  /** Optional prompt text displayed above the button (e.g., "Don't have an account?") */
  prompt?: string;
  /** Text displayed on the action button (e.g., "Sign Up", "Login") */
  actionText: string;
  /** Callback triggered when the button is pressed */
  onPress?: () => void;
  /** Optional custom styling for the container */
  style?: ViewStyle;
};

export default function AuthFooter({ prompt = '', actionText, onPress, style }: Props) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, style]}>
      {prompt ? <Text style={[styles.prompt, { color: theme.textSecondary }]}>{prompt}</Text> : null}
      <TouchableOpacity style={[styles.button, { backgroundColor: theme.surface, borderColor: brandColors.green }]} onPress={onPress} accessibilityRole="button">
        <Text style={styles.buttonText}>{actionText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  prompt: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  button: {
    borderWidth: 2,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    alignSelf: 'stretch',
    ...shadows.level1,
  },
  buttonText: {
    color: brandColors.green,
    ...typography.button,
  },
});
