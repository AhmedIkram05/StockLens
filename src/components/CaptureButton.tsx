import React from 'react';
import { TouchableOpacity, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { palette } from '../styles/palette';
import { radii, spacing } from '../styles/theme';

type Props = {
  onPress: () => void;
  disabled?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export default function CaptureButton({ onPress, disabled = false, size = 70, style }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, { width: size, height: size, borderRadius: size / 2 }, style]}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: palette.green,
    borderWidth: 1,
    borderColor: palette.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
