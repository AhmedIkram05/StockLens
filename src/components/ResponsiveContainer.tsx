import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBreakpoint } from '../hooks/useBreakpoint';

type Props = {
  children?: React.ReactNode;
  maxWidth?: number; // cap content width on large displays
  style?: any;
};

export default function ResponsiveContainer({ children, maxWidth = 960, style }: Props) {
  const insets = useSafeAreaInsets();
  const { width, contentHorizontalPadding } = useBreakpoint();

  // Compute available content width by subtracting the left/right
  // content horizontal padding (from breakpoints) and the device safe-area insets.
  // This ensures centering respects both our layout tokens and device insets on iPad
  // (fixes cases where content appears clipped at the left edge).
  const horizontalReserved = (contentHorizontalPadding || 0) * 2 + (insets.left || 0) + (insets.right || 0);
  const available = Math.max(0, width - horizontalReserved);
  const contentWidth = Math.min(available, maxWidth);

  return <View style={[{ width: contentWidth, alignSelf: 'center' }, styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flexGrow: 0 },
});
