import React from 'react';
import OnboardingCandles from '../components/OnboardingCandles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { Text, View, StyleSheet } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import PageHeader from '../components/PageHeader';
import PrimaryButton from '../components/PrimaryButton';
import { radii, spacing, typography } from '../styles/theme';
import { palette } from '../styles/palette';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

export default function OnboardingScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { width: screenWidth, isSmallPhone, isTablet, contentHorizontalPadding, sectionVerticalSpacing } = useBreakpoint();

  const handleGetStarted = () => navigation.replace('Login');

  // Graph sizing (kept from previous layout)
  const graphHeight = isTablet ? 420 : isSmallPhone ? 280 : 360;
  const graphWidth = Math.max(240, screenWidth - contentHorizontalPadding * 2);
  const insets = useSafeAreaInsets();
  const chartRightPad = Math.max(insets.right, contentHorizontalPadding);

  return (
    <ScreenContainer contentStyle={{ paddingVertical: sectionVerticalSpacing }}>
      <PageHeader>
        <Text style={[typography.display, { color: palette.black, fontWeight: '800', marginBottom: spacing.md }]}>Stock
          <Text style={{ color: palette.green }}>Lens</Text>
        </Text>
        <>{/* two lines tagline */}
          <Text style={[typography.pageSubtitle, { color: palette.black, opacity: 0.7, marginBottom: spacing.sm }]}>Scan your Spending</Text>
          <Text style={[typography.pageSubtitle, { color: palette.black, opacity: 0.7 }]}>See your missed Investing</Text>
        </>
      </PageHeader>

      <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <OnboardingCandles width={graphWidth} height={graphHeight} count={18} leftPad={0} rightPad={chartRightPad} />
      </View>

      <View style={{ alignSelf: isSmallPhone ? 'stretch' : 'flex-end', width: isTablet ? '40%' : isSmallPhone ? '100%' : '60%', maxWidth: isTablet ? 320 : undefined }}>
        <PrimaryButton onPress={handleGetStarted} accessibilityLabel="Get started">
          Let&apos;s Get Started
        </PrimaryButton>
      </View>
    </ScreenContainer>
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
