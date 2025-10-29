import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../styles/palette';
import { radii, shadows, spacing, sizes } from '../styles/theme';

type Props = {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: string;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  accessibilityLabel?: string;
};

export default function IconButton({ name, size = 20, color = palette.white, onPress, style, accessibilityLabel }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name={name} size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: sizes.controlMd,
    height: sizes.controlMd,
    borderRadius: radii.pill,
    backgroundColor: palette.green,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.level2,
    margin: spacing.xs / 2,
  },
});
