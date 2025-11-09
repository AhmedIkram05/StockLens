import React from 'react';
import { Image, ImageStyle } from 'react-native';
import { useBreakpoint } from '../hooks/useBreakpoint';

type Props = {
  width?: number;
  height?: number;
  style?: ImageStyle;
  testID?: string;
};

const logoImage = require('../../assets/StockLens_Logo_T.png');

export default function Logo({ width, height, style, testID }: Props) {
  const { width: screenWidth, isTablet } = useBreakpoint();

  const defaultWidth = width ?? Math.min(Math.round(screenWidth * 0.6), isTablet ? 480 : 360);
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
