import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { palette } from '../styles/palette';
import { radii, spacing, typography, shadows } from '../styles/theme';

type Props = {
  value: React.ReactNode;
  label?: string;
  subtitle?: string;
  variant?: 'green' | 'blue' | 'white';
  align?: 'center' | 'left';
  style?: StyleProp<ViewStyle>;
};

export default function StatCard({ value, label, subtitle, variant = 'white', style }: Props) {
  const bg = variant === 'green' ? palette.green : variant === 'blue' ? palette.blue : palette.white;
  const textColor = variant === 'white' ? palette.black : palette.white;
  const align = (style as any)?.alignItems ?? 'center';

  return (
    <View style={[styles.card, { backgroundColor: bg, alignItems: align }, style]}>
      <Text style={[styles.value, { color: textColor, textAlign: align === 'flex-start' || align === 'left' ? 'center' : 'center' }]}>{value}</Text>
      {label ? <Text style={[styles.label, { color: textColor, textAlign: align === 'flex-start' || align === 'left' ? 'left' : 'center' }]}>{label}</Text> : null}
      {subtitle ? <Text style={[styles.subtitle, { color: textColor, opacity: 0.9, textAlign: align === 'flex-start' || align === 'left' ? 'left' : 'center' }]}>{subtitle}</Text> : null}
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
    ...shadows.level2,
  },
  value: {
    ...typography.metricSm,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.body,
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
