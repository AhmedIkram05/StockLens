/**
 * EmptyStateWithOnboarding Component
 * 
 * An enhanced empty state that includes onboarding cards explaining how to use the app.
 * Combines the EmptyState component with three numbered instruction cards.
 * 
 * Used on screens where users need guidance on getting started (e.g., empty receipts list).
 * Number circles are responsive, adapting size based on device type (tablet vs phone).
 * 
 * Teaches users the three-step flow: Scan receipts → See investment potential → Track progress
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import EmptyState from './EmptyState';
import { useTheme } from '../contexts/ThemeContext';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { typography, spacing, radii, shadows, sizes } from '../styles/theme';
import { brandColors } from '../contexts/ThemeContext';

interface EmptyStateWithOnboardingProps {
  /** Optional icon name for the empty state */
  iconName?: string;
  /** Main title for the empty state */
  title: string;
  /** Subtitle providing context */
  subtitle: string;
  /** Text for the primary action button */
  primaryText: string;
  /** Callback triggered when primary button is pressed */
  onPrimaryPress: () => void;
}

/**
 * Renders an empty state with three onboarding cards below.
 * Each card has a responsive numbered circle, title, and description.
 * Number circle size: 44px (phones) or 56px (tablets) from theme.sizes.
 */
export const EmptyStateWithOnboarding: React.FC<EmptyStateWithOnboardingProps> = ({
  iconName,
  title,
  subtitle,
  primaryText,
  onPrimaryPress,
}) => {
  const { theme } = useTheme();
  const { isTablet } = useBreakpoint();
  
  const circleSize = isTablet ? sizes.controlLg : sizes.controlMd;

  return (
    <>
      <EmptyState
        iconName={iconName}
        title={title}
        subtitle={subtitle}
        primaryText={primaryText}
        onPrimaryPress={onPrimaryPress}
      />

      <View style={styles.onboardingCards}>
        <View style={[styles.onboardingCard, { backgroundColor: theme.surface }]}>
          <View style={[
            styles.numberCircle,
            { backgroundColor: theme.primary, width: circleSize, height: circleSize }
          ]}>
            <Text style={[styles.numberText, { color: brandColors.white }]}>1</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Scan Your Receipts</Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              Take photos of your spending to track expenses
            </Text>
          </View>
        </View>

        <View style={[styles.onboardingCard, { backgroundColor: theme.surface }]}>
          <View style={[
            styles.numberCircle,
            { backgroundColor: theme.primary, width: circleSize, height: circleSize }
          ]}>
            <Text style={[styles.numberText, { color: brandColors.white }]}>2</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>See Investment Potential</Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              Discover what your spending could be worth if invested
            </Text>
          </View>
        </View>

        <View style={[styles.onboardingCard, { backgroundColor: theme.surface }]}>
          <View style={[
            styles.numberCircle,
            { backgroundColor: theme.primary, width: circleSize, height: circleSize }
          ]}>
            <Text style={[styles.numberText, { color: brandColors.white }]}>3</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Track Your Progress</Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              Monitor your spending patterns and missed investment opportunities
            </Text>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  onboardingCards: {
    width: '100%',
    marginTop: spacing.xl,
  },
  onboardingCard: {
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.level1,
  },
  numberCircle: {
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  numberText: {
    ...typography.bodyStrong,
    fontSize: 20,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    ...typography.caption,
    lineHeight: 20,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
});
