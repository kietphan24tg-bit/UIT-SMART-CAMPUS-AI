import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme';

type BadgeTone = 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
}

export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  const theme = useAppTheme();

  const palette = {
    primary: {
      backgroundColor: theme.colors.primarySurface,
      color: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    neutral: {
      backgroundColor: theme.colors.surfaceSubtle,
      color: theme.colors.textMuted,
      borderColor: theme.colors.border,
    },
    success: {
      backgroundColor: theme.colors.successSurface,
      color: theme.colors.success,
      borderColor: theme.colors.success,
    },
    warning: {
      backgroundColor: theme.colors.warningSurface,
      color: theme.colors.warning,
      borderColor: theme.colors.warning,
    },
    danger: {
      backgroundColor: theme.colors.dangerSurface,
      color: theme.colors.danger,
      borderColor: theme.colors.danger,
    },
    info: {
      backgroundColor: theme.colors.infoSurface,
      color: theme.colors.info,
      borderColor: theme.colors.info,
    },
  }[tone];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
      ]}
    >
      <Text style={[styles.label, { color: palette.color, fontFamily: theme.fonts.semibold }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
  },
});
