/**
 * PageHeader Component
 * 
 * Displays a page title with optional subtitle at the top of screens.
 * Provides consistent header styling and spacing across all pages.
 * 
 * Supports custom title content (text or React nodes) and optional subtitles.
 * Subtitle automatically applies reduced opacity for visual hierarchy.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { typography, spacing } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

type Props = {
  /** Title content (can be text or custom React elements) */
  children?: React.ReactNode;
  /** Optional custom styling for the title text */
  titleStyle?: TextStyle;
  /** Optional subtitle displayed below the title */
  subtitle?: React.ReactNode;
  /** Optional custom styling for the header container */
  style?: ViewStyle;
  /** Optional content displayed on the right side (e.g., buttons, icons) */
  headerRight?: React.ReactNode;
};

/**
 * Renders a page header with title and optional subtitle.
 * Subtitle is styled with reduced opacity for visual hierarchy.
 */
export default function PageHeader({ children, subtitle, titleStyle, style }: Props) {
  const { theme } = useTheme();

  return (
    <View style={[styles.header, style]}>
      <View style={styles.left}>{children}</View>
      {subtitle ? <Text style={[styles.subtitle, { color: theme.text, opacity: 0.7 }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.sm,
  },
  left: {
  },
  subtitle: {
    marginTop: spacing.xs,
    ...typography.pageSubtitle,
  },
});
