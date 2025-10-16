import { TextStyle, ViewStyle } from 'react-native';
import { palette } from './palette';

// Shared style tokens keep typography, spacing, and elevation consistent across screens.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const breakpoints = {
  smallPhone: 360,
  largePhone: 414,
  tablet: 768,
} as const;

export const typography = {
  display: {
    fontSize: 48,
    fontWeight: '700',
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '700',
  },
  pageSubtitle: {
    fontSize: 20,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  metric: {
    fontSize: 32,
    fontWeight: '700',
  },
  metricSm: {
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
  },
  bodyStrong: {
    fontSize: 16,
    fontWeight: '600',
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
  },
  captionStrong: {
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
  },
  overline: {
    fontSize: 12,
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
