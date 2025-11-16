/**
 * ExpandableCard Component
 * 
 * A reusable collapsible card component with an icon, title, description, and expandable content area.
 * Displays a chevron indicator that toggles between up/down based on expanded state.
 * 
 * Created to eliminate repetitive expandable card patterns in SummaryScreen.
 * Provides a consistent, accessible pattern for showing/hiding additional information.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { radii, spacing, typography, shadows, sizes } from '../styles/theme';

type Props = {
  /** Ionicon name to display on the left side of the card */
  icon: keyof typeof Ionicons.glyphMap;
  /** Color for the icon (typically theme.primary or theme.accent) */
  iconColor: string;
  /** Main heading text displayed prominently */
  title: string;
  /** Subtitle/description text displayed below the title */
  description: string;
  /** Controls whether the expandable content is visible */
  isExpanded: boolean;
  /** Callback function triggered when the card is pressed */
  onToggle: () => void;
  /** Optional content to display when the card is expanded */
  expandedContent?: React.ReactNode;
  /** Optional custom styling for the card container */
  style?: StyleProp<ViewStyle>;
};

/**
 * Renders a pressable card that can expand to show additional content.
 * The card includes an icon, title, description, and a chevron indicator.
 * When pressed, it toggles between expanded and collapsed states.
 */
export default function ExpandableCard({
  icon,
  iconColor,
  title,
  description,
  isExpanded,
  onToggle,
  expandedContent,
  style,
}: Props) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onToggle}
      style={[styles.card, { backgroundColor: theme.surface }, style]}
    >
      <Ionicons name={icon} size={22} color={iconColor} style={styles.icon} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.textSecondary}
          />
        </View>
        <Text style={[styles.description, { color: theme.textSecondary }]}>{description}</Text>

        {isExpanded && expandedContent && (
          <View style={styles.expandedContent}>{expandedContent}</View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.level1,
  },
  icon: {
    marginRight: spacing.md,
    width: sizes.avatarSm,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.bodyStrong,
  },
  description: {
    ...typography.caption,
  },
  expandedContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
});
