import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import CaptureButton from './CaptureButton';
import { spacing } from '../styles/theme';
import { palette } from '../styles/palette';

type Props = {
  onCapture: () => void;
  bottomOffset?: number;
  horizontalPadding?: number;
  containerStyle?: StyleProp<ViewStyle>;
};

export default function CameraControls({ onCapture, bottomOffset = 24, horizontalPadding = 20, containerStyle }: Props) {
  return (
    <View style={[styles.container, { paddingHorizontal: horizontalPadding, bottom: bottomOffset }, containerStyle]}>
      <CaptureButton onPress={onCapture} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
});
