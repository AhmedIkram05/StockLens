/**
 * SettingRow Component
 * 
 * A reusable row component for Settings screens with icon, title, subtitle, and right accessory.
 * Supports emoji icons with custom background colors and optional destructive styling (e.g., "Sign Out").
 * 
 * Used extensively in SettingsScreen for displaying user preferences, app info, and account actions.
 * Can be made pressable by providing an onPress callback, or static by omitting it.
 */

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { radii, spacing, typography, shadows, sizes } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

type Props = {
  /** Emoji or image string to display as icon (e.g., "⚙️", "🔔") */
  iconEmoji?: string;
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
 */
export default function SettingRow({ iconEmoji, iconBgColor, title, subtitle, right, onPress, destructive, style }: Props) {
  const { theme } = useTheme();

  const Title = (
    <Text style={[styles.title, { color: theme.text }, destructive && { color: theme.error }]}>{title}</Text>
  );

  return (
    <TouchableOpacity activeOpacity={onPress ? 0.85 : 1} onPress={onPress} style={[styles.row, { backgroundColor: theme.surface }, style]}>
      {iconEmoji ? (
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}> 
          <Text style={styles.iconEmoji}>{iconEmoji}</Text>
        </View>
      ) : null}

      <View style={styles.content}>
        {Title}
        {subtitle ? <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text> : null}
      </View>

      <View style={styles.right}>{right}</View>
    </TouchableOpacity>
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
  iconEmoji: {
    fontSize: 28, // smaller than sizes.avatarSm for a more compact look
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
