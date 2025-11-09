/**
 * ScreenContainer Component
 * 
 * A standardized wrapper for all screen content providing:
 * - SafeAreaView for proper insets (notches, status bar, home indicator)
 * - Responsive horizontal/vertical padding based on device size
 * - Theme-aware background color
 * - Consistent layout structure across all screens
 * 
 * This component ensures all screens maintain consistent spacing and safe areas
 * while adapting to different device sizes (phones, tablets) via useBreakpoint hook.
 * 
 * Usage: Wrap all screen content in this component for consistent layout and safe areas.
 * Set noPadding={true} for full-width screens like camera views.
 * Apply custom styling via style prop for special cases like custom backgrounds.
 */

import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useTheme } from '../contexts/ThemeContext';
import { spacing } from '../styles/theme';

type Props = {
  /** Screen content to render within the safe area */
  children: React.ReactNode;
  /** Optional custom styling for the SafeAreaView container */
  style?: ViewStyle;
  /** Optional custom styling for the inner content View */
  contentStyle?: ViewStyle;
  /** When true, removes internal horizontal and vertical padding */
  noPadding?: boolean;
};

/**
 * Wraps screen content in a SafeAreaView with responsive padding and theme-aware background.
 * Padding values automatically adjust based on device size (phone vs tablet).
 */
export default function ScreenContainer({ children, style, contentStyle, noPadding }: Props) {
  const { contentHorizontalPadding, sectionVerticalSpacing, isTablet } = useBreakpoint();
  const { theme } = useTheme();

  const baseInnerStyle: ViewStyle = {
    flex: 1,
    justifyContent: 'space-between',
  };

  const horizontalPadding = noPadding ? 0 : contentHorizontalPadding;

  const paddedStyle: ViewStyle = { ...baseInnerStyle, paddingHorizontal: horizontalPadding, paddingVertical: sectionVerticalSpacing };

  const containerStyle = {
    flex: 1,
    backgroundColor: theme.background,
  };

  return (
    <SafeAreaView style={[containerStyle, style]}>
      <View style={[paddedStyle, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}
