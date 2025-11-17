/**
 * IconValue Component
 * 
 * A reusable component that displays an icon alongside a text value in a horizontal layout.
 * Commonly used for displaying metrics, stats, and labeled data throughout the app.
 * 
 * Created to eliminate repetitive "icon + value" patterns found in HomeScreen and SummaryScreen.
 */

import React from 'react';
import { View, Text, StyleSheet, TextStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../styles/theme';

type Props = {
  /** Name of the Ionicon to display (e.g., 'calendar-outline', 'trophy') */
  iconName: keyof typeof Ionicons.glyphMap;
  /** Size of the icon in pixels. Default: 28 */
  iconSize?: number;
  /** Color of the icon (hex or theme color) */
  iconColor: string;
  /** Text or numeric value to display next to the icon */
  value: string | number;
  /** Optional custom styling for the value text */
  valueStyle?: StyleProp<TextStyle>;
};

/**
 * Renders an icon and value pair in a horizontal flexbox layout.
 * The icon and value are centered and spaced using theme.spacing.sm.
 */
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
