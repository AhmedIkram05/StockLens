import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { palette } from '../styles/palette';
import { radii, spacing, typography, shadows } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useTheme } from '../contexts/ThemeContext';

type Props = {
  name: string;
  ticker?: string;
  futureDisplay: string;
  formattedAmount: string;
  percentDisplay: string;
  gainDisplay: string;
  valueColor?: string;
  onPress?: () => void;
  isLast?: boolean;
  cardWidth?: number;
};

export default function StockCard({ name, ticker, futureDisplay, formattedAmount, percentDisplay, gainDisplay, valueColor = palette.green, onPress, isLast, cardWidth }: Props) {
  const { isTablet, width } = useBreakpoint();
  const { theme } = useTheme();

  // Compute a responsive pixel width for cards:
  // - On phones we want a compact card that leaves room for peeking neighbors (approx 82% of viewport)
  // - On tablets we want visibly wider cards but not full width (approx 40% of viewport)
  // This calculation uses the container width from the breakpoint hook and keeps
  // proportions responsive rather than hardcoded.
  // Allow callers to provide an explicit pixel cardWidth (useful for carousels to compute
  // snap intervals). If not provided, fall back to our internal responsive heuristic.
  const pixelWidth = cardWidth ?? Math.max(200, Math.round(isTablet ? width * 0.4 : width * 0.82));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.card, { width: pixelWidth, backgroundColor: theme.surface }, isLast && styles.cardLast]}>
      <View style={styles.header}>
        <Text style={[styles.name, { color: theme.text }]}>{name}</Text>
        {ticker ? <Text style={[styles.ticker, { color: palette.blue }]}>{ticker}</Text> : null}
      </View>

          <View style={styles.valueContainer}>
            <Text style={[styles.value, { color: theme.text }]}>{futureDisplay}</Text>
            {/* Investment caption removed per design: keep only the primary value */}
          </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Text style={[styles.footerLabel, { color: theme.textSecondary }]}>Return</Text>
          <Text style={[styles.footerValue, { color: valueColor }]}>{percentDisplay}</Text>
        </View>

        <View style={[styles.verticalDivider, { backgroundColor: theme.border }]} />

        <View style={styles.footerItem}>
          <Text style={[styles.footerLabel, { color: theme.textSecondary }]}>Gained</Text>
          <Text style={[styles.footerValue, { color: valueColor }]}>{gainDisplay}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginRight: spacing.md,
    // width is intentionally not a hardcoded pixel value here — callers
    // should provide a responsive width override (percentage or computed)
    ...shadows.level2,
  },
  cardLast: {
    marginRight: 0,
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
    color: palette.blue,
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
    color: '#666',
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
  },
  footerValue: {
    ...typography.metricSm,
    color: palette.green,
  },
  verticalDivider: {
    width: 1,
    marginHorizontal: spacing.md,
  },
});
