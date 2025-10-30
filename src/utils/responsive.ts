import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Baseline used for scaling (iPhone 11 / 12 / 13 baseline)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Slightly reduce the effective scaling on large devices (tablets) so UI doesn't
// become oversized. We apply a modest tablet multiplier which preserves the
// relative scaling while keeping sizes visually compact on iPad-class screens.
const TABLET_WIDTH_THRESHOLD = 768;
// Make tablet UI more compact by reducing the effective scale multiplier for
// iPad-class widths. Lowering this value shrinks typography, spacing and
// control sizes across the app on tablets. Adjust this if you want a more
// or less compact tablet layout.
const TABLET_SCALE_MULTIPLIER = SCREEN_WIDTH >= TABLET_WIDTH_THRESHOLD ? 0.45 : 1;

export const scale = (size: number) => Math.round((SCREEN_WIDTH / BASE_WIDTH) * TABLET_SCALE_MULTIPLIER * size);
export const verticalScale = (size: number) => Math.round((SCREEN_HEIGHT / BASE_HEIGHT) * TABLET_SCALE_MULTIPLIER * size);
export const moderateScale = (size: number, factor = 0.5) =>
  Math.round(size + (scale(size) - size) * factor);

// Helpful helpers for max/min caps
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
