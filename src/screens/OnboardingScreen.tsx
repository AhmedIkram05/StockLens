import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import OnboardingCandles from '../components/OnboardingCandles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '../styles/palette';
import { radii, spacing, typography } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';

export default function OnboardingScreen() {
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

  // Graph sizing is computed here. Make the onboarding graph visually larger
  // and match the page content width so it aligns with other UI.
  const graphHeight = isTablet ? 420 : isSmallPhone ? 280 : 360;
  // Make the graph width match the page content width so it aligns with
  // other UI elements that use `contentHorizontalPadding`.
  const graphWidth = Math.max(240, screenWidth - contentHorizontalPadding * 2);
  const insets = useSafeAreaInsets();
  // compute right padding so chart aligns with the page content area and avoids home-indicator/notch clipping
  // Use the content horizontal padding as the baseline so the chart lines up with other content.
  const chartRightPad = Math.max(insets.right, contentHorizontalPadding);

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

        <View style={[styles.graphContainer]}>
          <OnboardingCandles width={graphWidth} height={graphHeight} count={18} leftPad={0} rightPad={chartRightPad} />
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
    width: '100%',
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
