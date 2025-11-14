/**
 * EmptyState Component
 * 
 * Displays a centered empty state UI with an icon, title, subtitle, and optional action button.
 * Used throughout the app to show when lists/data are empty (e.g., no receipts, no results).
 * 
 * Provides a consistent, user-friendly experience with clear calls-to-action when content is missing.
 * 
 * @example
 * // Basic empty state with action button
 * <EmptyState
 *   iconName="receipt-outline"
 *   title="No Receipts Yet"
 *   subtitle="Start scanning your receipts to track spending"
 *   primaryText="Scan Receipt"
 *   onPrimaryPress={() => navigation.navigate('Scan')}
 * />
 * 
 * @example
 * // Empty state without button
 * <EmptyState
 *   iconName="search-outline"
 *   title="No Results Found"
 *   subtitle="Try adjusting your filters"
 * />
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brandColors } from '../contexts/ThemeContext';
import { radii, spacing, typography, shadows } from '../styles/theme';

type Props = {
  /** Ionicon name for the empty state icon. Default: 'checkmark-circle' */
  iconName?: string;
  /** Main heading text displayed prominently */
  title: string;
  /** Optional subtitle providing additional context or instructions */
  subtitle?: string;
  /** Optional text for the action button */
  primaryText?: string;
  /** Callback triggered when the action button is pressed */
  onPrimaryPress?: () => void;
};

/**
 * Renders a centered empty state with icon, text, and optional action button.
 * Conditionally renders subtitle and button based on provided props.
 */
export default function EmptyState({ iconName = 'checkmark-circle', title, subtitle, primaryText, onPrimaryPress }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={iconName as any} size={96} color={brandColors.green} />
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
    color: brandColors.black,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: brandColors.black,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.green,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    ...shadows.level2,
  },
  buttonText: {
    color: brandColors.white,
    ...typography.button,
  },
});
