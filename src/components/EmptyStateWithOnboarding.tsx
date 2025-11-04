import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import EmptyState from './EmptyState';
import { useTheme } from '../contexts/ThemeContext';
import { typography, spacing, radii, shadows } from '../styles/theme';
import { palette } from '../styles/palette';

interface EmptyStateWithOnboardingProps {
  iconName?: string;
  title: string;
  subtitle: string;
  primaryText: string;
  onPrimaryPress: () => void;
}

export const EmptyStateWithOnboarding: React.FC<EmptyStateWithOnboardingProps> = ({
  iconName,
  title,
  subtitle,
  primaryText,
  onPrimaryPress,
}) => {
  const { theme } = useTheme();

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
          <View style={[styles.numberCircle, { backgroundColor: theme.primary }]}>
            <Text style={[styles.numberText, { color: palette.white }]}>1</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Scan Your Receipts</Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              Take photos of your spending to track expenses
            </Text>
          </View>
        </View>

        <View style={[styles.onboardingCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.numberCircle, { backgroundColor: theme.primary }]}>
            <Text style={[styles.numberText, { color: palette.white }]}>2</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>See Investment Potential</Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              Discover what your spending could be worth if invested
            </Text>
          </View>
        </View>

        <View style={[styles.onboardingCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.numberCircle, { backgroundColor: theme.primary }]}>
            <Text style={[styles.numberText, { color: palette.white }]}>3</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Track Your Progress</Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              Monitor your spending patterns and investment opportunities
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
    width: 48,
    height: 48,
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
  },
});
