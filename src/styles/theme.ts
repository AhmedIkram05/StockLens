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

export const typography = {
  display: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 52,
  },
  pageTitle: {
    fontSize: 42,
    fontWeight: '700',
  },
  pageSubtitle: {
    fontSize: 22,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 24,
  },
  metric: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
  },
  metricSm: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodyStrong: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 18,
  },
  captionStrong: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
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
