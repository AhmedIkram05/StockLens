import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { radii, spacing, typography, shadows, sizes } from '../styles/theme';
import { palette, alpha } from '../styles/palette';

type Props = {
  /** Emoji or image string to display as icon (centralized) */
  iconEmoji?: string;
  /** Background color for icon container */
  iconBgColor?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  style?: ViewStyle;
};

export default function SettingRow({ iconEmoji, iconBgColor, title, subtitle, right, onPress, destructive, style }: Props) {
  const Title = (
    <Text style={[styles.title, destructive && styles.destructiveTitle]}>{title}</Text>
  );

  return (
    <TouchableOpacity activeOpacity={onPress ? 0.85 : 1} onPress={onPress} style={[styles.row, style]}>
      {iconEmoji ? (
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}> 
          <Text style={styles.iconEmoji}>{iconEmoji}</Text>
        </View>
      ) : null}

      <View style={styles.content}>
        {Title}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.right}>{right}</View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
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
    color: palette.black,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: alpha.subtleBlack,
  },
  destructiveTitle: {
    color: palette.red,
  },
});
