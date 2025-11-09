import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { palette } from '../styles/palette';
import { radii, spacing, typography } from '../styles/theme';

interface ProjectionDisclaimerProps {
}

export default function ProjectionDisclaimer({}: ProjectionDisclaimerProps) {
  const { theme } = useTheme();
  const { isSmallPhone } = useBreakpoint();

  return (
    <View style={[styles.warningBox, isSmallPhone && styles.warningBoxCompact, { backgroundColor: theme.surface }]}>
      <Ionicons name="warning" size={28} color={palette.red} style={styles.warningIcon} />
      <Text style={[styles.warningText, { color: theme.text }]}>
        Projections are hypothetical. Past performance does not guarantee future results.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  warningBox: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  warningBoxCompact: {
    padding: spacing.md,
  },
  warningIcon: {
    marginRight: spacing.md,
  },
  warningText: {
    ...typography.caption,
    lineHeight: 18,
    flex: 1,
    textAlign: 'left',
  },
});