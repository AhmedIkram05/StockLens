import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { palette, alpha } from '../styles/palette';
import { radii, spacing, typography, shadows } from '../styles/theme';

type Props = {
  prompt?: string;
  actionText: string;
  onPress?: () => void;
  style?: ViewStyle;
};

export default function AuthFooter({ prompt = '', actionText, onPress, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      {prompt ? <Text style={styles.prompt}>{prompt}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={onPress} accessibilityRole="button">
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
    color: alpha.subtleBlack,
    marginBottom: spacing.sm,
  },
  button: {
    borderWidth: 2,
    borderColor: palette.green,
    backgroundColor: palette.white,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    alignSelf: 'stretch',
    ...shadows.level1,
  },
  buttonText: {
    color: palette.green,
    ...typography.button,
  },
});
