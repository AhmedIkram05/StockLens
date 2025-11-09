import React from 'react';
import { View, Text, StyleSheet, TextStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../styles/theme';

type Props = {
  iconName: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor: string;
  value: string | number;
  valueStyle?: StyleProp<TextStyle>;
};

export default function IconValue({ iconName, iconSize = 28, iconColor, value, valueStyle }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={iconName} size={iconSize} color={iconColor} />
      <Text style={valueStyle}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
