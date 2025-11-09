import React from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { radii, spacing, typography, shadows, sizes } from '../styles/theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  description: string;
  isExpanded: boolean;
  onToggle: () => void;
  expandedContent?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

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
