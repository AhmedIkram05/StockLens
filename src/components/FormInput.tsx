import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps, TextStyle, ViewStyle } from 'react-native';
import { palette, alpha } from '../styles/palette';
import { radii, spacing, typography, shadows } from '../styles/theme';

type Props = TextInputProps & {
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
};

export default function FormInput({ containerStyle, inputStyle, style, ...rest }: Props) {
  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        {...rest}
        style={[styles.input, inputStyle, style]}
        placeholderTextColor={alpha.mutedBlack}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: alpha.faintBlack,
    borderRadius: radii.md,
    padding: spacing.md,
    ...typography.body,
    color: palette.black,
    ...shadows.level1,
  },
});
