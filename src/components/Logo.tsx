/**
 * Logo Component
 * 
 * Displays the StockLens app logo with responsive sizing based on screen dimensions.
 * Logo automatically scales to 60% of screen width (max 360px on phones, 480px on tablets).
 * 
 * Maintains proper aspect ratio (2:1 width:height) and uses 'contain' resize mode.
 * Used on splash screens, onboarding, login, and branding areas throughout the app.
 */

import React from 'react';
import { Image, ImageStyle } from 'react-native';
import { useBreakpoint } from '../hooks/useBreakpoint';

type Props = {
  /** Optional custom width in pixels (overrides responsive calculation) */
  width?: number;
  /** Optional custom height in pixels (overrides responsive calculation) */
  height?: number;
  /** Optional custom styling for the Image */
  style?: ImageStyle;
  /** Optional test ID for automated testing */
  testID?: string;
};

const logoImage = require('../../assets/StockLens_Logo_T.png');

/**
 * Renders the StockLens logo with responsive dimensions.
 * Default width is 60% of screen width (capped at 360px/480px).
 * Default height maintains 2:1 aspect ratio.
 */
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
