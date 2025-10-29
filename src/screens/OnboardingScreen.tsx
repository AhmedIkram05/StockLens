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

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const { width: screenWidth, isSmallPhone, isTablet, contentHorizontalPadding, sectionVerticalSpacing } = useBreakpoint();

  const handleGetStarted = () => navigation.navigate('Login' as never);

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
          <Text style={[typography.pageSubtitle, { color: palette.black, opacity: 0.7 }]}>Scan your Spending</Text>
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
