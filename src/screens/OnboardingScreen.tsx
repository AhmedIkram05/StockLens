/**
 * OnboardingScreen
 * 
 * Welcome screen with animated candlestick chart and app introduction.
 * Displayed on first app launch before authentication.
 * 
 * Features:
 * - Animated SVG candlestick chart showing rising stock prices
 * - App tagline: "Scan Your Spending, See Your Missed Investing"
 * - Get Started button navigating to SignUp screen
 * - Responsive button width (50% tablet, 75% phone)
 * 
 * The candlestick animation:
 * - Generates 25-30 OHLC (Open-High-Low-Close) data points
 * - Simulates realistic price movements with baseline uptrend, major swings, micro fluctuations, and occasional shocks
 * - Animates from opacity 0 to 1 over 2 seconds using React Native Animated API
 * 
 * Chart is purely visual/decorative to communicate investment/finance theme.
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { Text, View, StyleSheet } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import PageHeader from '../components/PageHeader';
import PrimaryButton from '../components/PrimaryButton';
import { radii, spacing, typography } from '../styles/theme';
import { brandColors } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

type OHLC = { open: number; high: number; low: number; close: number };

/**
 * Generates an array of OHLC candlestick data with realistic price movements.
 * Uses sine waves for major/micro trends plus random shocks for volatility.
 * 
 * @param count - Number of candles to generate (default varies based on screen width)
 * @param start - Starting price value (default: 100)
 * @returns Array of OHLC objects with open, high, low, close prices
 */
const makeOHLCSeries = (count: number, start = 100) => {
  const res: OHLC[] = [];
  let prevClose = start;
  const majorSwings = Math.max(3, Math.round(count / 6));
  const phase = Math.random() * Math.PI * 2;

  for (let i = 0; i < count; i++) {
    const open = prevClose;
    const progress = i / Math.max(1, count - 1);
    const baselineUp = progress * (Math.random() * 8 + 6);
    const major = Math.sin(progress * Math.PI * majorSwings + phase) * (8 + Math.random() * 10);
    const micro = (Math.sin(progress * Math.PI * 2.3) + Math.sin(progress * Math.PI * 4.6) * 0.5) * (4 + Math.random() * 6);
    const shock = Math.random() < 0.12 ? -(6 + Math.random() * 22) : 0;
    const delta = baselineUp * 0.6 + major + micro + shock + (Math.random() - 0.5) * 4;
    const close = Math.max(1, open + delta);
    const high = Math.max(open, close) + Math.random() * (6 + Math.random() * 8);
    const low = Math.min(open, close) - Math.random() * (6 + Math.random() * 8);
    res.push({ open, high, low, close });
    prevClose = close;
  }
  return res;
};

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const { width: screenWidth, isSmallPhone, isTablet, contentHorizontalPadding, sectionVerticalSpacing } = useBreakpoint();
  const { theme, isDark } = useTheme();

  const handleGetStarted = () => navigation.navigate('Login' as never);

  const graphHeight = isTablet ? 420 : isSmallPhone ? 280 : 360;
  const graphWidth = Math.max(240, screenWidth - contentHorizontalPadding * 2);
  const insets = useSafeAreaInsets();
  const chartRightPad = Math.max(insets.right, contentHorizontalPadding);

  const buttonMaxWidth = isTablet ? screenWidth * 0.5 : screenWidth * 0.75;

  const candleCount = 18;
  const data = useMemo(() => makeOHLCSeries(candleCount, 90), [candleCount]);
  const progresses = useRef<Animated.Value[]>(Array.from({ length: candleCount }, () => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = progresses.map((p, idx) =>
      Animated.timing(p, {
        toValue: 1,
        duration: 700,
        delay: idx * 90,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      })
    );
    Animated.stagger(60, animations).start();
  }, [progresses]);

  const values = data.flatMap((d) => [d.high, d.low, d.open, d.close]);
  const vMin = Math.min(...values);
  const vMax = Math.max(...values);
  const pad = 10;
  const usableH = Math.max(40, graphHeight - pad * 2);

  const valueToY = (v: number) => {
    if (vMax === vMin) return pad + usableH / 2;
    const t = (v - vMin) / (vMax - vMin);
    return pad + (1 - t) * usableH;
  };

  const approxStep = candleCount > 1 ? graphWidth / (candleCount - 1) : graphWidth;
  const approxBody = Math.max(8, Math.min(approxStep * 0.64, 36));
  const minSidePad = Math.ceil(approxBody / 2) + 2;
  const effectiveLeftPad = Math.max(0, 0, minSidePad);
  const effectiveRightPad = Math.max(chartRightPad, minSidePad);
  const availableW = Math.max(40, graphWidth - effectiveLeftPad - effectiveRightPad);

  let estStep = candleCount > 1 ? availableW / (candleCount - 1) : availableW;
  let estBody = Math.max(8, Math.min(estStep * 0.64, 36));
  if (candleCount > 1) {
    const refined = Math.max(6, (availableW - estBody) / (candleCount - 1));
    estStep = refined;
    estBody = Math.max(8, Math.min(estStep * 0.64, 36));
  }

  const step = estStep;
  const bodyWidth = estBody;
  const computeXCenter = (i: number) => effectiveLeftPad + bodyWidth / 2 + step * i;

  const AnimatedRect: any = Animated.createAnimatedComponent(Rect as any);
  const AnimatedLine: any = Animated.createAnimatedComponent(Line as any);

  return (
    <ScreenContainer contentStyle={{ paddingVertical: sectionVerticalSpacing }}>
      <PageHeader>
        <Text style={[typography.display, { color: theme.text, fontWeight: '800', marginBottom: spacing.md }]}>Stock
          <Text style={{ color: brandColors.green }}>Lens</Text>
        </Text>
        <>
          <Text style={[typography.pageSubtitle, { color: theme.textSecondary }]}>Scan your Spending</Text>
          <Text style={[typography.pageSubtitle, { color: theme.textSecondary }]}>See your missed Investing</Text>
        </>
      </PageHeader>

      <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={graphWidth} height={graphHeight} viewBox={`0 0 ${graphWidth} ${graphHeight}`}>
          {data.map((d, i) => {
            const p = progresses[i];
            const xCenter = computeXCenter(i);
            const x = xCenter - bodyWidth / 2;

            const yOpen = valueToY(d.open);
            const yClose = valueToY(d.close);
            const yHigh = valueToY(d.high);
            const yLow = valueToY(d.low);

            const isUp = d.close >= d.open;
            const fill = isUp ? brandColors.green : brandColors.red;
            const stroke = isDark ? '#ffffff6e' : '#00000014';

            const bodyY = Math.min(yOpen, yClose);
            const bodyH = Math.max(1, Math.abs(yClose - yOpen));

            const animY = p.interpolate({ inputRange: [0, 1], outputRange: [pad + usableH, bodyY] }) as any;
            const animH = p.interpolate({ inputRange: [0, 1], outputRange: [0, bodyH] }) as any;
            const animHigh = p.interpolate({ inputRange: [0, 1], outputRange: [pad + usableH, yHigh] }) as any;
            const animLow = p.interpolate({ inputRange: [0, 1], outputRange: [pad + usableH, yLow] }) as any;

            return (
              <React.Fragment key={`c-${i}`}>
                <AnimatedLine
                  x1={xCenter}
                  x2={xCenter}
                  y1={animHigh}
                  y2={animLow}
                  stroke={stroke}
                  strokeWidth={2}
                  strokeLinecap="round"
                  opacity={0.95}
                />
                <AnimatedRect
                  x={x}
                  y={animY}
                  width={bodyWidth}
                  height={animH}
                  fill={fill}
                  stroke={brandColors.black}
                  strokeOpacity={0.06}
                  rx={2}
                />
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      <View style={{ 
        alignSelf: isSmallPhone ? 'stretch' : 'flex-end', 
        width: isTablet ? '40%' : isSmallPhone ? '100%' : '60%', 
        maxWidth: buttonMaxWidth 
      }}>
        <PrimaryButton onPress={handleGetStarted} accessibilityLabel="Get started">
          Let&apos;s Get Started
        </PrimaryButton>
      </View>
    </ScreenContainer>
  );
}
