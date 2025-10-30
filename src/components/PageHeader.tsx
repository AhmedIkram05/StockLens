import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { typography, spacing } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

type Props = {
  children?: React.ReactNode;
  titleStyle?: TextStyle;
  subtitle?: React.ReactNode;
  style?: ViewStyle;
  headerRight?: React.ReactNode;
};

export default function PageHeader({ children, subtitle, titleStyle, style }: Props) {
  const { theme } = useTheme();

  return (
    <View style={[styles.header, style]}>
      <View style={styles.left}>{children}</View>
      {subtitle ? <Text style={[styles.subtitle, { color: theme.text, opacity: 0.7 }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.sm,
  },
  left: {
    // left column for main title content
  },
  subtitle: {
    marginTop: spacing.xs,
    ...typography.pageSubtitle,
  },
});
