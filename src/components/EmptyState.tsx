import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../styles/palette';
import { radii, spacing, typography, shadows } from '../styles/theme';

type Props = {
  iconName?: string;
  title: string;
  subtitle?: string;
  primaryText?: string;
  onPrimaryPress?: () => void;
};

export default function EmptyState({ iconName = 'checkmark-circle', title, subtitle, primaryText, onPrimaryPress }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={iconName as any} size={96} color={palette.green} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {primaryText ? (
        <TouchableOpacity style={styles.button} onPress={onPrimaryPress} accessibilityRole="button">
          <Text style={styles.buttonText}>{primaryText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    ...typography.pageTitle,
    color: palette.black,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: palette.black,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.green,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    ...shadows.level2,
  },
  buttonText: {
    color: palette.white,
    ...typography.button,
  },
});
