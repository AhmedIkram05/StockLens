import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useTheme } from '../contexts/ThemeContext';
import { spacing } from '../styles/theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  /** When true the internal padding (horizontal/vertical) is disabled */
  noPadding?: boolean;
};

export default function ScreenContainer({ children, style, contentStyle, noPadding }: Props) {
  const { contentHorizontalPadding, sectionVerticalSpacing, isTablet } = useBreakpoint();
  const { theme } = useTheme();

  const baseInnerStyle: ViewStyle = {
    flex: 1,
    justifyContent: 'space-between',
  };

  // Conditionally include padding only when not disabled. Prefer the breakpoint
  // provided `contentHorizontalPadding` so all components using `useBreakpoint`
  // and `ResponsiveContainer` compute widths consistently. This avoids
  // mismatches where different parts of the layout subtract different gutters
  // and content becomes misaligned or clipped on tablets.
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
