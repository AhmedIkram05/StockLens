import React from 'react';
import { Image, ImageStyle } from 'react-native';
import { useBreakpoint } from '../hooks/useBreakpoint';

type Props = {
  width?: number;
  height?: number;
  style?: ImageStyle;
  testID?: string;
};

const logoImage = require('../../assets/StockLens_Logo.png');

export default function Logo({ width, height, style, testID }: Props) {
  // Use breakpoint info to pick a sensible default size when not provided
  const { width: screenWidth, isTablet } = useBreakpoint();

  // Default to a percentage of screen width, capped for tablets
  const defaultWidth = width ?? Math.min(Math.round(screenWidth * 0.6), isTablet ? 480 : 360);
  // Logo image in this project is roughly 2:1 (width:height), keep that ratio
  const defaultHeight = height ?? Math.round(defaultWidth * 0.5);

  return (
    <Image
      source={logoImage}
      style={[{ width: defaultWidth, height: defaultHeight }, style]}
      resizeMode="contain"
      testID={testID}
    />
  );
}
