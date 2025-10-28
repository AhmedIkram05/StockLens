import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { palette } from '../styles/palette';
import { radii, spacing, typography, shadows } from '../styles/theme';

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
};

export default function StockCard({ name, ticker, futureDisplay, formattedAmount, percentDisplay, gainDisplay, valueColor = palette.green, onPress, isLast }: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.card, isLast && styles.cardLast]}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        {ticker ? <Text style={styles.ticker}>{ticker}</Text> : null}
      </View>

      <View style={styles.valueContainer}>
        <Text style={styles.value}>{futureDisplay}</Text>
        <Text style={styles.caption}>Investment of {formattedAmount}</Text>
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
    width: 280,
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
    fontSize: 28,
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
