import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps, TextStyle, ViewStyle } from 'react-native';
import { palette, alpha } from '../styles/palette';
import { radii, spacing, typography, shadows } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

type Props = TextInputProps & {
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
};

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
