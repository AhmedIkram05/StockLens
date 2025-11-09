/**
 * Responsive Scaling Utilities - Device-aware dimension scaling
 * 
 * Features:
 * - scale: Proportional width scaling based on device width
 * - verticalScale: Proportional height scaling based on device height
 * - moderateScale: Hybrid scaling with adjustable factor
 * - cap: Clamp value between min and max
 * - Tablet detection and scaling multiplier (0.45x for tablets)
 * 
 * Base Dimensions (iPhone X):
 * - BASE_WIDTH: 375px
 * - BASE_HEIGHT: 812px
 * 
 * Tablet Behavior:
 * - Devices ≥ 768px width apply 0.45x multiplier to prevent oversized UI
 * - Smaller devices use 1.0x multiplier (normal scaling)
 * 
 * Integration:
 * - Used sparingly in the app (prefer useBreakpoint hook)
 * - Useful for one-off scaling needs outside React components
 * 
 * Usage:
 * fontSize: moderateScale(14) // scales 14px proportionally with moderate factor
 * padding: scale(20) // scales 20px based on device width
 */

import { Dimensions, Platform } from 'react-native';

/**
 * Current screen dimensions
 */
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Base dimensions (iPhone X reference)
 */
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/**
 * Tablet width threshold (768px)
 */
const TABLET_WIDTH_THRESHOLD = 768;

/**
 * Tablet scaling multiplier (0.45 for tablets, 1.0 for phones)
 */
const TABLET_SCALE_MULTIPLIER = SCREEN_WIDTH >= TABLET_WIDTH_THRESHOLD ? 0.45 : 1;

/**
 * Scale size based on device width
 * 
 * @param size - Base size in pixels
 * @returns Scaled size rounded to nearest integer
 * 
 * Formula: (screenWidth / baseWidth) * tabletMultiplier * size
 * 
 * Example: scale(20) on iPhone 14 (393px) → ~21px
 */
export const scale = (size: number) => Math.round((SCREEN_WIDTH / BASE_WIDTH) * TABLET_SCALE_MULTIPLIER * size);

/**
 * Scale size based on device height
 * 
 * @param size - Base size in pixels
 * @returns Scaled size rounded to nearest integer
 * 
 * Formula: (screenHeight / baseHeight) * tabletMultiplier * size
 * 
 * Example: verticalScale(20) on iPhone 14 Pro (852px) → ~21px
 */
export const verticalScale = (size: number) => Math.round((SCREEN_HEIGHT / BASE_HEIGHT) * TABLET_SCALE_MULTIPLIER * size);

/**
 * Moderate scaling with adjustable factor
 * 
 * @param size - Base size in pixels
 * @param factor - Scaling factor (0-1, default 0.5)
 * @returns Scaled size rounded to nearest integer
 * 
 * Formula: size + (scale(size) - size) * factor
 * 
 * Behavior:
 * - factor = 0: No scaling (returns original size)
 * - factor = 0.5: Half-way between original and fully scaled
 * - factor = 1: Full scaling (same as scale(size))
 * 
 * Usage:
 * - Best for font sizes (prevents over-scaling on large devices)
 * - Keeps UI elements readable but not oversized
 * 
 * Example: moderateScale(16, 0.5) scales font moderately
 */
export const moderateScale = (size: number, factor = 0.5) =>
  Math.round(size + (scale(size) - size) * factor);

/**
 * Clamp value between optional min and max bounds
 * 
 * @param value - Value to clamp
 * @param min - Optional minimum bound
 * @param max - Optional maximum bound
 * @returns Clamped value
 * 
 * Examples:
 * cap(5, 0, 10) → 5
 * cap(-5, 0, 10) → 0
 * cap(15, 0, 10) → 10
 * cap(5, undefined, 10) → 5
 */
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
