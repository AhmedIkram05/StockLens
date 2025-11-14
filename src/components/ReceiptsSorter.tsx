/**
 * ReceiptsSorter Component
 * 
 * A sorting control for receipt lists with two options: Date and Amount.
 * Displays sort direction indicators (↑ for ascending, ↓ for descending).
 * 
 * When clicking the active sort option, it toggles between ascending/descending.
 * When clicking an inactive option, it switches to that option with its default direction.
 * 
 * Default directions: Date sorts descending (newest first), Amount sorts ascending (lowest first).
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { brandColors } from '../contexts/ThemeContext';
import { radii, spacing, typography } from '../styles/theme';

export type SortBy = 'date' | 'amount';
export type SortDirection = 'asc' | 'desc';

interface ReceiptsSorterProps {
  /** Currently active sort field */
  sortBy: SortBy;
  /** Current sort direction (ascending or descending) */
  sortDirection: SortDirection;
  /** Callback triggered when sort changes with new sortBy and sortDirection */
  onSortChange: (sortBy: SortBy, sortDirection: SortDirection) => void;
}

const sortOptions: { key: SortBy; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Amount' },
];

/**
 * Renders a row of sort buttons with active state and direction indicators.
 * Clicking active button toggles direction; clicking inactive button switches to it.
 */
export default function ReceiptsSorter({ sortBy, sortDirection, onSortChange }: ReceiptsSorterProps) {
  const { theme } = useTheme();

  const handleSortByChange = (newSortBy: SortBy) => {
    if (newSortBy === sortBy) {
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      onSortChange(newSortBy, newDirection);
    } else {
      const defaultDirection = newSortBy === 'date' ? 'desc' : 'asc';
      onSortChange(newSortBy, defaultDirection);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Sort by:</Text>
      <View style={styles.optionsContainer}>
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.optionButton,
              sortBy === option.key && styles.optionButtonActive,
              { borderColor: theme.border },
            ]}
            onPress={() => handleSortByChange(option.key)}
          >
            <Text
              style={[
                styles.optionText,
                { color: sortBy === option.key ? brandColors.white : theme.text },
              ]}
            >
              {option.label}
            </Text>
            {sortBy === option.key && (
              <Text style={[styles.directionText, { color: brandColors.white }]}>
                {sortDirection === 'asc' ? '↑' : '↓'}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  label: {
    ...typography.caption,
    marginRight: spacing.sm,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: 'transparent',
  },
  optionButtonActive: {
    backgroundColor: brandColors.green,
    borderColor: brandColors.green,
  },
  optionText: {
    ...typography.bodyStrong,
  },
  directionText: {
    ...typography.bodyStrong,
    marginLeft: spacing.xs,
  },
});