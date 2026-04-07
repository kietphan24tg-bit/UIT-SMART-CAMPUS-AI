import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { PressableProps } from 'react-native';

import { useAppTheme } from '@/theme';

interface ButtonProps extends PressableProps {
  label: string;
  loading?: boolean;
  icon?: ReactNode;
}

export function PrimaryButton({
  label,
  loading,
  disabled,
  icon,
  style,
  ...rest
}: ButtonProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: theme.colors.primary,
          opacity: disabled || loading ? 0.65 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={theme.colors.heroText} /> : null}
      {!loading ? (
        <View style={styles.row}>
          {icon}
          <Text style={[styles.primaryLabel, { color: theme.colors.heroText }]}>{label}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  loading,
  disabled,
  icon,
  style,
  ...rest
}: ButtonProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
          borderWidth: 1,
          opacity: disabled || loading ? 0.65 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={theme.colors.primary} /> : null}
      {!loading ? (
        <View style={styles.row}>
          {icon}
          <Text style={[styles.secondaryLabel, { color: theme.colors.primary }]}>{label}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
});
