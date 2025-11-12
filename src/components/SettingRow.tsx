/**
 * SettingRow Component
 * 
 * A reusable row component for Settings screens with icon, title, subtitle, and right accessory.
 * Supports Ionicons vector icons with custom background colors and optional destructive styling (e.g., "Sign Out").
 * 
 * Used extensively in SettingsScreen for displaying user preferences, app info, and account actions.
 * Can be made pressable by providing an onPress callback, or static by omitting it.
 */

import React from 'react';
import { Pressable, View, Text, StyleSheet, ViewStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing, typography, shadows, sizes } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

type Props = {
  /** Ionicons icon name to display (e.g., "settings-outline", "notifications") */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Background color for icon container */
  iconBgColor?: string;
  /** Main text displayed in the row */
  title: string;
  /** Optional subtitle displayed below the title */
  subtitle?: string;
  /** Optional content displayed on the right side (e.g., Switch, chevron, value) */
  right?: React.ReactNode;
  /** Callback triggered when the row is pressed (if omitted, row is non-pressable) */
  onPress?: () => void;
  /** When true, applies error/destructive color to title text */
  destructive?: boolean;
  /** Optional custom styling for the row container */
  style?: ViewStyle;
};

/**
 * Renders a settings row with optional icon, title, subtitle, and right accessory.
 * Destructive prop applies error color to title for dangerous actions (e.g., "Delete Account").
 * Uses Pressable with platform-specific press feedback for native feel.
 * Card backgrounds follow iOS design: white in light mode, #1C1C1E in dark mode.
 */
export default function SettingRow({ icon, iconBgColor, title, subtitle, right, onPress, destructive, style }: Props) {
  const { theme, isDark } = useTheme();

  // iOS-style card backgrounds: white in light mode, elevated gray (#1C1C1E) in dark mode
  const cardBackgroundColor = isDark ? '#1C1C1E' : '#ffffff';

  const Title = (
    <Text style={[styles.title, { color: theme.text }, destructive && { color: theme.error }]}>{title}</Text>
  );

  return (
    <Pressable 
      onPress={onPress} 
      style={({ pressed }) => [
        styles.row, 
        { backgroundColor: cardBackgroundColor },
        pressed && onPress && { opacity: 0.6 },
        style
      ]}
      disabled={!onPress}
    >
      {icon ? (
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}> 
          <Ionicons name={icon} size={24} color={theme.text} />
        </View>
      ) : null}

      <View style={styles.content}>
        {Title}
        {subtitle ? <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text> : null}
      </View>

      <View style={styles.right}>{right}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    justifyContent: 'space-between',
    ...shadows.level2,
  },
  iconContainer: {
    width: sizes.controlSm,
    height: sizes.controlSm,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  right: {
    marginLeft: spacing.md,
  },
  title: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
  },
});
