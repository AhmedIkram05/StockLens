/**
 * StockCard Component
 * 
 * Displays investment projection data in a horizontal scrollable card format.
 * Shows stock name, ticker, projected future value, return percentage, and gained amount.
 * 
 * Includes optional badge for special designations (e.g., "Popular", "High Growth").
 * Card width is responsive, adapting to tablet vs phone screen sizes.
 * 
 * Used in Calculator/Projection screens to show what receipted spending could have earned if invested.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { brandColors } from '../contexts/ThemeContext';
import { radii, spacing, typography, shadows } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useTheme } from '../contexts/ThemeContext';

type Props = {
  /** Stock/investment name (e.g., "Apple Inc.", "S&P 500 Index") */
  name: string;
  /** Optional ticker symbol (e.g., "AAPL", "SPY") */
  ticker?: string;
  /** Formatted future value projection (e.g., "$1,234.56") */
  futureDisplay: string;
  /** Original investment amount formatted (e.g., "$1,000.00") */
  formattedAmount: string;
  /** Return percentage formatted (e.g., "+23.5%", "-5.2%") */
  percentDisplay: string;
  /** Gained/lost amount formatted (e.g., "+$234.56") */
  gainDisplay: string;
  /** Color for value/gain text (typically green for positive, red for negative) */
  valueColor?: string;
  /** Callback triggered when the card is pressed */
  onPress?: () => void;
  /** When true, removes right margin (for last card in horizontal scroll) */
  isLast?: boolean;
  /** Optional fixed width for the card (overrides responsive width calculation) */
  cardWidth?: number;
  /** Optional badge text displayed at top-right (e.g., "Popular") */
  badgeText?: string;
  /** Optional badge background color (defaults to theme.primary) */
  badgeColor?: string;
};

/**
 * Renders an investment projection card with stock details, future value, and returns.
 * Card width is responsive: 82% of screen width on phones, 40% on tablets.
 * Badge is positioned absolutely at top-right when provided.
 */
export default function StockCard({ name, ticker, futureDisplay, formattedAmount, percentDisplay, gainDisplay, valueColor = brandColors.green, onPress, isLast, cardWidth, badgeText, badgeColor }: Props) {
  const { isTablet, width } = useBreakpoint();
  const { theme } = useTheme();
  const pixelWidth = cardWidth ?? Math.max(200, Math.round(isTablet ? width * 0.4 : width * 0.82));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.card, { width: cardWidth ?? Math.max(200, Math.round(isTablet ? width * 0.4 : width * 0.82)), backgroundColor: theme.surface }, isLast && styles.cardLast]}>
      {badgeText ? (
        <View style={styles.badgeContainer}>
          <LinearGradient
            colors={[badgeColor ?? theme.primary, badgeColor ?? theme.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.badge}
          >
            <Text style={styles.badgeText}>{badgeText}</Text>
          </LinearGradient>
        </View>
      ) : null}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">{name}</Text>
        </View>
        {ticker ? <Text style={[styles.ticker, { color: brandColors.blue }]}>{ticker}</Text> : null}
      </View>

      <View style={styles.valueContainerCentered}>
        <Text style={[styles.value, { color: theme.text }]}>{futureDisplay}</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.footerChips}>
        <View style={styles.chipItem}>
          <Text style={[styles.footerLabel, { color: theme.textSecondary }]}>Return</Text>
          <View style={[styles.chip, { backgroundColor: theme.surfaceVariant }]}> 
            <Text style={[styles.chipValue, { color: valueColor }]}>{percentDisplay}</Text>
          </View>
        </View>

        <View style={styles.chipItem}>
          <Text style={[styles.footerLabel, { color: theme.textSecondary }]}>Gained</Text>
          <View style={[styles.chip, { backgroundColor: theme.surfaceVariant }]}> 
            <Text style={[styles.chipValue, { color: valueColor }]}>{gainDisplay}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create<any>({
  card: {
    position: 'relative',
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginRight: spacing.md,
    ...shadows.level2,
    overflow: 'hidden',
  },
  cardLast: {
    marginRight: 0,
  },
  badgeContainer: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
  },
  badgeText: {
    ...typography.captionStrong,
    color: brandColors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  name: {
    ...typography.bodyStrong,
  },
  ticker: {
    ...typography.captionStrong,
    color: brandColors.blue,
  },
  valueContainer: {
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  value: {
    ...typography.sectionTitle,
  },
  caption: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  footerItem: {
    flex: 1,
  },
  footerLabel: {
    ...typography.overline,
    marginBottom: spacing.sm,
    textAlign: 'center',
    width: '100%',
  },
  footerValue: {
    ...typography.metricSm,
    color: brandColors.green,
  },
  verticalDivider: {
    width: 1,
    marginHorizontal: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  ticker: {
    ...typography.captionStrong,
    color: brandColors.blue,
  },
  valueContainerCentered: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  footerChips: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipItem: {
    flex: 1,
    alignItems: 'center',
  },
  chip: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  chipValue: {
    ...typography.metricSm,
    fontWeight: '700',
  },
});