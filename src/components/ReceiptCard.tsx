import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { palette } from '../styles/palette';
import { radii, spacing, typography, shadows } from '../styles/theme';

type Props = {
  id?: string | number;
  image?: string | undefined;
  amount?: number | string | React.ReactNode;
  merchant?: string;
  time?: string;
  onPress?: () => void;
};

export default function ReceiptCard({ image, amount, merchant, time, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {image ? <Image source={{ uri: image }} style={styles.image} /> : <View style={styles.placeholder} />}
      <View style={styles.info}>
        <Text style={styles.amount}>{amount}</Text>
        <Text style={styles.merchant}>{merchant}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.level1,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: spacing.md,
  },
  placeholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: spacing.md,
    backgroundColor: '#f0f0f0',
  },
  info: {
    flex: 1,
  },
  amount: {
    ...typography.bodyStrong,
    color: palette.black,
  },
  merchant: {
    ...typography.caption,
    color: palette.black,
    opacity: 0.8,
  },
  time: {
    ...typography.caption,
    color: palette.black,
    opacity: 0.6,
  },
  chevron: {
    fontSize: 20,
    color: palette.black,
    marginLeft: spacing.sm,
  },
});
