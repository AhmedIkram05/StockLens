/**
 * FormInput Component
 * 
 * A styled text input component with theme-aware appearance and consistent spacing.
 * Wraps React Native's TextInput with standardized styling for forms throughout the app.
 * 
 * Automatically applies theme colors for background, text, border, and placeholder.
 * Supports all standard TextInput props (placeholder, secureTextEntry, keyboardType, etc.).
 */

import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps, TextStyle, ViewStyle } from 'react-native';
import { brandColors } from '../contexts/ThemeContext';
import { radii, spacing, typography, shadows } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

type Props = TextInputProps & {
  /** Optional custom styling for the container View */
  containerStyle?: ViewStyle;
  /** Optional custom styling for the TextInput itself */
  inputStyle?: TextStyle;
};

/**
 * Renders a themed text input with consistent styling.
 * Inherits all standard TextInput props (value, onChangeText, placeholder, etc.).
 */
export default function FormInput({ containerStyle, inputStyle, style, ...rest }: Props) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        {...rest}
        style={[styles.input, inputStyle, style, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.textSecondary }]}
        placeholderTextColor={theme.textSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    ...typography.body,
    ...shadows.level1,
  },
});
