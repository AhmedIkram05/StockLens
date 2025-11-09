/**
 * ReceiptCard Component
 * 
 * Displays a receipt preview in a card format with thumbnail image, amount, merchant, and timestamp.
 * Used in lists/scrollviews to show receipt summaries before navigating to detail view.
 * 
 * Shows a placeholder if no image is available. Includes a chevron indicator for navigation.
 * Fully pressable with activeOpacity feedback.
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { radii, spacing, typography, shadows, sizes } from '../styles/theme';

type Props = {
  /** Unique identifier for the receipt (optional, for tracking) */
  id?: string | number;
  /** URI string for the receipt image thumbnail */
  image?: string | undefined;
  /** Receipt amount (can be number, string, or formatted React element) */
  amount?: number | string | React.ReactNode;
  /** Merchant or store name */
  merchant?: string;
  /** Timestamp or date string (e.g., "2 hours ago", "Nov 9, 2025") */
  time?: string;
  /** Callback triggered when the card is pressed */
  onPress?: () => void;
  /** Optional custom styling for the card container */
  style?: StyleProp<ViewStyle>;
};

/**
 * Renders a pressable receipt card with image, transaction details, and navigation chevron.
 * If no image is provided, displays a gray placeholder.
 */
export default function ReceiptCard({ image, amount, merchant, time, onPress, style }: Props) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: theme.surface }, style]} onPress={onPress} activeOpacity={0.85}>
      {image ? <Image source={{ uri: image }} style={styles.image} /> : <View style={styles.placeholder} />}
      <View style={styles.info}>
        <Text style={[styles.amount, { color: theme.text }]}>{amount}</Text>
        <Text style={[styles.merchant, { color: theme.textSecondary }]}>{merchant}</Text>
        <Text style={[styles.time, { color: theme.textSecondary }]}>{time}</Text>
      </View>
      <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.level1,
    alignSelf: 'stretch',
    minWidth: 0,
  },
  image: {
    width: sizes.avatarMd,
    height: sizes.avatarMd,
    borderRadius: 8,
    marginRight: spacing.md,
  },
  placeholder: {
    width: sizes.avatarMd,
    height: sizes.avatarMd,
    borderRadius: 8,
    marginRight: spacing.md,
    backgroundColor: '#f0f0f0',
  },
  info: {
    flex: 1,
  },
  amount: {
    ...typography.bodyStrong,
  },
  merchant: {
    ...typography.caption,
  },
  time: {
    ...typography.caption,
  },
  chevron: {
    ...typography.metricSm,
    marginLeft: spacing.sm,
  },
});
