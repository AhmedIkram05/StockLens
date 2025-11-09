/**
 * StatCard Component
 * 
 * A card component for displaying key statistics and metrics with optional labels and subtitles.
 * Supports three color variants (green, blue, white) and automatically adjusts text color for contrast.
 * 
 * Used throughout the app for displaying spending totals, investment projections, and other numeric data.
 * Text color automatically switches to ensure readability on colored backgrounds.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { radii, spacing, typography, shadows } from '../styles/theme';

type Props = {
  /** Main value/metric to display (can be text, number, or React element) */
  value: React.ReactNode;
  /** Optional label displayed below the value */
  label?: string;
  /** Optional subtitle displayed below the label */
  subtitle?: string;
  /** Color variant for the card background. Default: 'white' */
  variant?: 'green' | 'blue' | 'white';
  /** Text alignment within the card. Default: 'center' */
  align?: 'center' | 'left';
  /** Optional custom styling for the card container */
  style?: StyleProp<ViewStyle>;
};

/**
 * Renders a metric card with value, optional label, and optional subtitle.
 * Background and text colors are determined by the variant prop.
 */
export default function StatCard({ value, label, subtitle, variant = 'white', style }: Props) {
  const { theme } = useTheme();
  
  const bg = variant === 'green' ? theme.primary : variant === 'blue' ? theme.secondary : theme.surface;
  const textColor = variant === 'white' ? theme.text : theme.textOnColor;

  return (
    <View style={[styles.card, { backgroundColor: bg }, style]}>
      <Text style={[styles.value, { color: textColor }]}>{value}</Text>
      {label ? <Text style={[styles.label, { color: textColor }]}>{label}</Text> : null}
      {subtitle ? <Text style={[styles.subtitle, { color: textColor, opacity: 0.85 }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    padding: spacing.lg,
    marginHorizontal: spacing.xs,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.level2,
  },
  value: {
    ...typography.metricSm,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  label: {
    ...typography.body,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
