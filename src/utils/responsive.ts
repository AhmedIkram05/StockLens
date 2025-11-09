import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

const TABLET_WIDTH_THRESHOLD = 768;
const TABLET_SCALE_MULTIPLIER = SCREEN_WIDTH >= TABLET_WIDTH_THRESHOLD ? 0.45 : 1;

export const scale = (size: number) => Math.round((SCREEN_WIDTH / BASE_WIDTH) * TABLET_SCALE_MULTIPLIER * size);
export const verticalScale = (size: number) => Math.round((SCREEN_HEIGHT / BASE_HEIGHT) * TABLET_SCALE_MULTIPLIER * size);
export const moderateScale = (size: number, factor = 0.5) =>
  Math.round(size + (scale(size) - size) * factor);

export const cap = (value: number, min?: number, max?: number) => {
  if (typeof min === 'number' && value < min) return min;
  if (typeof max === 'number' && value > max) return max;
  return value;
};

export default {
  scale,
  verticalScale,
  moderateScale,
  cap,
};
