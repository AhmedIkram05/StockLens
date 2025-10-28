import React from 'react';
import { Image, ImageStyle } from 'react-native';

type Props = {
  width?: number;
  height?: number;
  style?: ImageStyle;
  testID?: string;
};

const logoImage = require('../../assets/StockLens_Logo.png');

export default function Logo({ width = 200, height = 100, style, testID }: Props) {
  return <Image source={logoImage} style={[{ width, height }, style]} resizeMode="contain" testID={testID} />;
}
