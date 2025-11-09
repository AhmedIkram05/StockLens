import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { breakpoints, spacing } from '../styles/theme';

type BreakpointInfo = {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  isTablet: boolean;
  isLargePhone: boolean;
  isSmallPhone: boolean;
  contentHorizontalPadding: number;
  sectionVerticalSpacing: number;
  cardsPerRow: number;
};

export function useBreakpoint(): BreakpointInfo {
  const { width, height } = useWindowDimensions();
  return useMemo(() => {
    const orientation: 'portrait' | 'landscape' = width >= height ? 'landscape' : 'portrait';
    const isTablet = width >= breakpoints.tablet;
    const isLargePhone = width >= breakpoints.largePhone && width < breakpoints.tablet;
    const isSmallPhone = width <= breakpoints.smallPhone;

    const contentHorizontalPadding = isTablet
      ? spacing.xxl
      : spacing.md;

    const sectionVerticalSpacing = isTablet ? spacing.xxl : spacing.xl;
    const cardsPerRow = isTablet ? 3 : 2;

    return {
      width,
      height,
      orientation,
      isTablet,
      isLargePhone,
      isSmallPhone,
      contentHorizontalPadding,
      sectionVerticalSpacing,
      cardsPerRow,
    };
  }, [height, width]);
}
