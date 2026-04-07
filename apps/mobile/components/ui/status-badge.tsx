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
    primary: { backgroundColor: theme.colors.primarySurface, color: theme.colors.primary },
    neutral: { backgroundColor: theme.colors.surfaceSubtle, color: theme.colors.textMuted },
    success: { backgroundColor: theme.colors.successSurface, color: theme.colors.success },
    warning: { backgroundColor: theme.colors.warningSurface, color: theme.colors.warning },
    danger: { backgroundColor: theme.colors.dangerSurface, color: theme.colors.danger },
    info: { backgroundColor: theme.colors.infoSurface, color: theme.colors.info },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.label, { color: palette.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
