import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme';

type BadgeTone = 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
type BadgeVariant = 'soft' | 'solid' | 'outline' | 'glass';
type BadgeSize = 'sm' | 'md';

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
}

export function StatusBadge({
  label,
  tone = 'neutral',
  variant = 'soft',
  size = 'md',
  icon,
}: StatusBadgeProps) {
  const theme = useAppTheme();

  const tonePalette = {
    primary: {
      color: theme.colors.primary,
      surface: theme.colors.primarySurface,
      borderColor: theme.colors.primary,
      solidText: theme.colors.textInverse,
    },
    neutral: {
      color: theme.colors.textMuted,
      surface: theme.colors.surfaceSubtle,
      borderColor: theme.colors.border,
      solidText: theme.colors.text,
    },
    success: {
      color: theme.colors.success,
      surface: theme.colors.successSurface,
      borderColor: theme.colors.success,
      solidText: theme.colors.textInverse,
    },
    warning: {
      color: theme.colors.warning,
      surface: theme.colors.warningSurface,
      borderColor: theme.colors.warning,
      solidText: theme.colors.text,
    },
    danger: {
      color: theme.colors.danger,
      surface: theme.colors.dangerSurface,
      borderColor: theme.colors.danger,
      solidText: theme.colors.textInverse,
    },
    info: {
      color: theme.colors.info,
      surface: theme.colors.infoSurface,
      borderColor: theme.colors.info,
      solidText: theme.colors.textInverse,
    },
  }[tone];

  const backgroundColor =
    variant === 'solid'
      ? tonePalette.color
      : variant === 'glass'
        ? theme.colors.surfaceGlass
        : variant === 'outline'
          ? theme.colors.surface
          : tonePalette.surface;
  const borderColor =
    variant === 'solid'
      ? tonePalette.color
      : variant === 'glass'
        ? theme.colors.border
        : tonePalette.borderColor;
  const labelColor =
    variant === 'solid'
      ? tonePalette.solidText
      : variant === 'glass'
        ? tonePalette.color
        : tonePalette.color;

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <View style={styles.row}>
        {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
        <Text
          style={[
            styles.label,
            size === 'sm' ? styles.labelSm : styles.labelMd,
            { color: labelColor, fontFamily: theme.fonts.semibold },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
          allowFontScaling={false}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    minWidth: 0,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  badgeSm: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeMd: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    minWidth: 0,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    letterSpacing: 0.1,
    flexShrink: 1,
    minWidth: 0,
    includeFontPadding: false,
  },
  labelSm: {
    fontSize: 11,
  },
  labelMd: {
    fontSize: 12,
  },
});
