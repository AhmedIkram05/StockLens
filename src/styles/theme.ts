import { TextStyle, ViewStyle } from 'react-native';
import { palette } from './palette';
import { scale, moderateScale } from '../utils/responsive';

// Shared style tokens keep typography, spacing, and elevation consistent across screens.
export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(24),
  xxl: scale(32),
} as const;

// Standard control and component sizes (keep as tokens so components can be
// copy/pasted and reused without hardcoded numbers). These use the same
// responsive helpers so they scale consistently across devices.
export const sizes = {
  controlSm: Math.round(moderateScale(36)),
  controlMd: Math.round(moderateScale(44)),
  controlLg: Math.round(moderateScale(56)),
  avatarSm: Math.round(scale(40)),
  avatarMd: Math.round(scale(56)),
} as const;

export const radii = {
  sm: Math.max(6, Math.round(moderateScale(8))),
  md: Math.max(8, Math.round(moderateScale(12))),
  lg: Math.max(12, Math.round(moderateScale(16))),
  xl: Math.max(16, Math.round(moderateScale(24))),
  pill: 999,
} as const;

export const breakpoints = {
  smallPhone: 360,
  largePhone: 414,
  tablet: 768,
} as const;

export const typography = {
  display: {
    fontSize: moderateScale(48),
    fontWeight: '700',
  },
  pageTitle: {
    fontSize: moderateScale(34),
    fontWeight: '700',
  },
  pageSubtitle: {
    fontSize: moderateScale(20),
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: moderateScale(22),
    fontWeight: '700',
  },
  subtitle: {
    fontSize: moderateScale(18),
    fontWeight: '500',
  },
  metric: {
    fontSize: moderateScale(32),
    fontWeight: '700',
  },
  metricSm: {
    fontSize: moderateScale(18),
    fontWeight: '700',
  },
  body: {
    fontSize: moderateScale(16),
    fontWeight: '400',
  },
  bodyStrong: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  caption: {
    fontSize: moderateScale(14),
    fontWeight: '400',
  },
  captionStrong: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  button: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  overline: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    letterSpacing: 1,
  },
} satisfies Record<string, TextStyle>;

export const shadows = {
  level1: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  level2: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
} satisfies Record<string, ViewStyle>;

export const surface = {
  card: {
    backgroundColor: palette.white,
    borderRadius: radii.lg,
    ...shadows.level2,
  },
  cardMuted: {
    backgroundColor: palette.lightGray,
    borderRadius: radii.lg,
    ...shadows.level1,
  },
} satisfies Record<string, ViewStyle>;
