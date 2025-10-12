import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Svg, { Path } from 'react-native-svg';
import { palette } from '../styles/palette';
import { radii, spacing, typography } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';

export default function SplashScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const {
    width: screenWidth,
    contentHorizontalPadding,
    sectionVerticalSpacing,
    isSmallPhone,
    isTablet,
  } = useBreakpoint();

  const handleGetStarted = () => {
    navigation.replace('Login');
  };

  type ChartPoint = { x: number; y: number };

  const toSmoothPath = (pts: ChartPoint[]) => {
    if (pts.length < 2) {
      return '';
    }

    const segments: string[] = [`M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`];

    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      segments.push(
        `C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
      );
    }

    return segments.join(' ');
  };

  // Create realistic stock chart path that fits on screen while staying smooth
  const createStockPath = () => {
    const graphHeight = isTablet ? 260 : isSmallPhone ? 180 : 200;
    const graphWidth = Math.max(screenWidth - contentHorizontalPadding * 2, 260);
    const startY = graphHeight - 8; // closer to the bottom edge
    const endY = 28; // higher toward the top edge

    const points: ChartPoint[] = [];
  points.push({ x: 0, y: startY });

    const numPoints = 18;
    for (let i = 1; i < numPoints - 1; i++) {
      const progress = i / (numPoints - 1);
      const x = progress * graphWidth;

      const baseY = startY - progress * (startY - endY);
      const wave = Math.sin(progress * Math.PI * 1.2) + Math.sin(progress * Math.PI * 2.4) * 0.45;
  const variance = wave * 18; // softer oscillation
  const clampedY = Math.max(endY - 18, Math.min(startY + 18, baseY + variance));

      points.push({ x, y: clampedY });
    }

  points.push({ x: graphWidth, y: endY });

    return {
      path: toSmoothPath(points),
      width: graphWidth,
      height: graphHeight,
    };
  };

  const { path: stockPath, width: graphWidth, height: graphHeight } = createStockPath();

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingHorizontal: contentHorizontalPadding,
            paddingVertical: sectionVerticalSpacing,
          },
          isSmallPhone && styles.contentCompact,
        ]}
      >
        <View style={[styles.header, isSmallPhone && styles.headerCompact]}>
          <Text style={styles.logoText}>
            Stock
            <Text style={styles.logoAccent}>Lens</Text>
          </Text>
          <Text style={styles.tagline}>Scan your Spending</Text>
          <Text style={styles.tagline}>See your missed Investing</Text>
        </View>

        <View style={styles.graphContainer}>
          <Svg width={graphWidth} height={graphHeight} viewBox={`0 0 ${graphWidth} ${graphHeight}`}>
            <Path
              d={stockPath}
              stroke={palette.green}
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </View>

        <View
          style={[
            styles.ctaWrapper,
            isSmallPhone && styles.ctaWrapperFull,
            isTablet && styles.ctaWrapperWide,
          ]}
        >
          <TouchableOpacity style={styles.ctaButton} activeOpacity={0.85} onPress={handleGetStarted}>
            <Text style={styles.ctaText}>Let&apos;s Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.lightGray,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    overflow: 'visible',
  },
  contentCompact: {
    paddingVertical: spacing.lg,
  },
  header: {
    marginTop: spacing.md,
  },
  headerCompact: {
    marginTop: spacing.sm,
  },
  logoText: {
    ...typography.display,
    color: palette.black,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  logoAccent: {
    color: palette.green,
  },
  tagline: {
    ...typography.pageSubtitle,
    color: palette.black,
    opacity: 0.7,
    marginBottom: spacing.sm,
  },
  graphContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  ctaWrapper: {
    alignSelf: 'flex-end',
    width: '60%',
  },
  ctaWrapperFull: {
    width: '100%',
    alignSelf: 'stretch',
  },
  ctaWrapperWide: {
    width: '40%',
    maxWidth: 320,
  },
  ctaButton: {
    backgroundColor: palette.green,
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    shadowColor: palette.green,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 3,
  },
  ctaText: {
    color: palette.white,
    ...typography.button,
  },
});
