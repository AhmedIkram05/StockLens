import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  badgeText?: string;
  badgeColor?: string;
};

export default function StockCard({ name, ticker, futureDisplay, formattedAmount, percentDisplay, gainDisplay, valueColor = palette.green, onPress, isLast, cardWidth, badgeText, badgeColor }: Props) {
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
      {badgeText ? (
        // Diagonal ribbon badge that appears wrapped into the top-left corner.
        // We size/position it dynamically based on the computed pixelWidth so it
        // scales across device sizes.
        <LinearGradient
          colors={[badgeColor ?? theme.primary, '#000000ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.ribbon,
            {
              // narrow the ribbon so the visible diagonal band matches the
              // expected visual area and centering is intuitive
              width: Math.round(pixelWidth * 0.5),
              height: 28,
              left: Math.round(-pixelWidth * 0.16),
              top: Math.round(-pixelWidth * 0.03),
            },
          ]}
          accessible
          accessibilityRole="text"
          accessibilityLabel={`Badge: ${badgeText}`}
        >
          {/* subtle highlight to the top edge of the ribbon */}
          <View style={styles.ribbonHighlight} pointerEvents="none" />
          <Text
            style={[
              styles.ribbonText,
              {
                transform: [
                  { translateX: Math.round(-pixelWidth * 0.04) },
                  { translateY: Math.round(pixelWidth * 0.015) },
                ],
              },
            ]}
          >
            {badgeText}
          </Text>
        </LinearGradient>
      ) : null}
      <View style={styles.header}>
        <Text style={[styles.name, { color: theme.text }]}>{name}</Text>
        {ticker ? <Text style={[styles.ticker, { color: palette.blue }]}>{ticker}</Text> : null}
      </View>

          <View style={styles.valueContainer}>
            <Text style={[styles.value, { color: theme.text }]}>{futureDisplay}</Text>
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

const styles = StyleSheet.create<any>({
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginRight: spacing.md,
    ...shadows.level2,
    overflow: 'hidden',
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

  // Ribbon banner styles
  ribbon: {
    position: 'absolute',
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-45deg' }],
    // subtle shadow to lift the ribbon above the card
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  ribbonHighlight: {
    position: 'absolute',
    left: 6,
    top: 2,
    width: 36,
    height: 8,
    borderRadius: 2,
    transform: [{ rotate: '20deg' }],
  },
  ribbonText: {
    ...typography.captionStrong,
    color: palette.white,
    includeFontPadding: false,
    fontSize: 14,
    lineHeight: 28,
    textAlign: 'center',
  },
});