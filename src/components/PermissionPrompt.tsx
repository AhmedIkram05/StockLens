import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { palette } from '../styles/palette';
import { spacing, typography, radii, shadows } from '../styles/theme';

type Props = {
  message: string;
  onPress?: () => void;
  buttonText?: string;
  containerStyle?: any;
};

export default function PermissionPrompt({ message, onPress, buttonText = 'Grant Permission', containerStyle }: Props) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.text}>{message}</Text>
      <TouchableOpacity style={styles.button} onPress={onPress} accessibilityRole="button">
        <Text style={styles.buttonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.body,
    color: palette.black,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  button: {
    backgroundColor: palette.green,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.level2,
  },
  buttonText: {
    color: palette.white,
    ...typography.button,
  },
});
