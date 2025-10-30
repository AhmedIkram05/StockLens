import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { radii, spacing, typography, shadows, sizes } from '../styles/theme';

type Props = {
  id?: string | number;
  image?: string | undefined;
  amount?: number | string | React.ReactNode;
  merchant?: string;
  time?: string;
  onPress?: () => void;
};

export default function ReceiptCard({ image, amount, merchant, time, onPress }: Props) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: theme.surface }]} onPress={onPress} activeOpacity={0.85}>
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
