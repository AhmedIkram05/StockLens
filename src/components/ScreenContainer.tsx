import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { palette } from '../styles/palette';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  /** When true the internal padding (horizontal/vertical) is disabled */
  noPadding?: boolean;
};

export default function ScreenContainer({ children, style, contentStyle, noPadding }: Props) {
  const { contentHorizontalPadding, sectionVerticalSpacing } = useBreakpoint();

  const baseInnerStyle: ViewStyle = {
    flex: 1,
    justifyContent: 'space-between',
  };

  // Conditionally include padding only when not disabled
  const paddedStyle: ViewStyle = noPadding
    ? baseInnerStyle
    : { ...baseInnerStyle, paddingHorizontal: contentHorizontalPadding, paddingVertical: sectionVerticalSpacing };

  return (
    <SafeAreaView style={[styles.container, style]}>
      <View style={[paddedStyle, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.lightGray,
  },
});
