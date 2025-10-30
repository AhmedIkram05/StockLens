import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { palette } from '../styles/palette';
import { radii, spacing, typography } from '../styles/theme';

export type SortBy = 'date' | 'amount';
export type SortDirection = 'asc' | 'desc';

interface ReceiptsSorterProps {
  sortBy: SortBy;
  sortDirection: SortDirection;
  onSortChange: (sortBy: SortBy, sortDirection: SortDirection) => void;
}

const sortOptions: { key: SortBy; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Amount' },
];

export default function ReceiptsSorter({ sortBy, sortDirection, onSortChange }: ReceiptsSorterProps) {
  const { theme } = useTheme();

  const handleSortByChange = (newSortBy: SortBy) => {
    if (newSortBy === sortBy) {
      // Toggle direction
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      onSortChange(newSortBy, newDirection);
    } else {
      // New sort by, default to desc for date, asc for others
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
                { color: sortBy === option.key ? palette.white : theme.text },
              ]}
            >
              {option.label}
            </Text>
            {sortBy === option.key && (
              <Text style={[styles.directionText, { color: palette.white }]}>
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
    backgroundColor: palette.green,
    borderColor: palette.green,
  },
  optionText: {
    ...typography.bodyStrong,
  },
  directionText: {
    ...typography.bodyStrong,
    marginLeft: spacing.xs,
  },
});