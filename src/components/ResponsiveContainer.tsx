/**
 * ResponsiveContainer Component
 * 
 * A container that caps content width on large displays while centering the content.
 * Prevents content from stretching too wide on tablets and desktops (max 960px by default).
 * 
 * Automatically accounts for safe area insets and horizontal padding from breakpoints.
 * Useful for forms, cards, and text-heavy content that should remain readable on large screens.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBreakpoint } from '../hooks/useBreakpoint';

type Props = {
  /** Content to render within the constrained width */
  children?: React.ReactNode;
  /** Maximum width in pixels for the content. Default: 960 */
  maxWidth?: number;
  /** Optional custom styling for the container */
  style?: any;
};

/**
 * Renders a centered container with capped width for optimal readability on large displays.
 * Calculates available width considering safe area insets and responsive padding.
 */
export default function ResponsiveContainer({ children, maxWidth = 960, style }: Props) {
  const insets = useSafeAreaInsets();
  const { width, contentHorizontalPadding } = useBreakpoint();

  const horizontalReserved = (contentHorizontalPadding || 0) * 2 + (insets.left || 0) + (insets.right || 0);
  const available = Math.max(0, width - horizontalReserved);
  const contentWidth = Math.min(available, maxWidth);

  return <View style={[{ width: contentWidth, alignSelf: 'center' }, styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flexGrow: 0 },
});
