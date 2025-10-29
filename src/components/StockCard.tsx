import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { palette } from '../styles/palette';
import { radii, spacing, typography, shadows } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';

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

  // Compute a responsive pixel width for cards:
  // - On phones we want a compact card that leaves room for peeking neighbors (approx 82% of viewport)
  // - On tablets we want visibly wider cards but not full width (approx 40% of viewport)
  // This calculation uses the container width from the breakpoint hook and keeps
  // proportions responsive rather than hardcoded.
  // Allow callers to provide an explicit pixel cardWidth (useful for carousels to compute
  // snap intervals). If not provided, fall back to our internal responsive heuristic.
  const pixelWidth = cardWidth ?? Math.max(200, Math.round(isTablet ? width * 0.4 : width * 0.82));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.card, { width: pixelWidth }, isLast && styles.cardLast]}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        {ticker ? <Text style={styles.ticker}>{ticker}</Text> : null}
      </View>

          <View style={styles.valueContainer}>
            <Text style={[styles.value, { color: valueColor }]}>{futureDisplay}</Text>
            {/* Investment caption removed per design: keep only the primary value */}
          </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Return</Text>
          <Text style={[styles.footerValue, { color: valueColor }]}>{percentDisplay}</Text>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Gained</Text>
          <Text style={[styles.footerValue, { color: valueColor }]}>{gainDisplay}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.white,
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
    color: palette.black,
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
    color: palette.black,
  },
  caption: {
    ...typography.caption,
    color: '#666',
    marginTop: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#eee',
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
    color: '#999',
    marginBottom: spacing.sm,
  },
  footerValue: {
    ...typography.metricSm,
    color: palette.green,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginHorizontal: spacing.md,
  },
});
