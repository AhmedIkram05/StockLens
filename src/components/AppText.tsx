import React from 'react';
import { Text, TextProps } from 'react-native';

type Props = TextProps & {
  /** Cap the system font scaling to avoid extreme layout breakage when needed */
  maxFontSizeMultiplier?: number | null;
};

/**
 * AppText
 * Small wrapper around RN Text that opts into system Dynamic Type by default.
 * Use this across the app for consistent font-scaling behaviour.
 */
export default function AppText({ children, maxFontSizeMultiplier = 1.6, style, ...rest }: Props) {
  return (
    <Text allowFontScaling maxFontSizeMultiplier={maxFontSizeMultiplier} style={style} {...rest}>
      {children}
    </Text>
  );
}
