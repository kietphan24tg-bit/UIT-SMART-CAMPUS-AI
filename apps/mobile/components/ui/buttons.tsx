import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { PressableProps, PressableStateCallbackType } from 'react-native';

import { useAppTheme } from '@/theme';

interface ButtonProps extends PressableProps {
  label: string;
  loading?: boolean;
  icon?: ReactNode;
}

function resolvePressableStyle(
  style: PressableProps['style'],
  state: PressableStateCallbackType,
) {
  return typeof style === 'function' ? style(state) : style;
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
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.border,
          opacity: disabled || loading ? 0.56 : pressed ? 0.9 : 1,
        },
        resolvePressableStyle(style, { pressed, hovered: false }),
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={theme.colors.onPrimary} /> : null}
      {!loading ? (
        <View style={styles.row}>
          {icon}
          <Text style={[styles.primaryLabel, { color: theme.colors.onPrimary, fontFamily: theme.fonts.semibold }]}>
            {label}
          </Text>
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
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
          borderWidth: 1,
          opacity: disabled || loading ? 0.56 : pressed ? 0.84 : 1,
        },
        resolvePressableStyle(style, { pressed, hovered: false }),
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={theme.colors.primary} /> : null}
      {!loading ? (
        <View style={styles.row}>
          {icon}
          <Text style={[styles.secondaryLabel, { color: theme.colors.primary, fontFamily: theme.fonts.semibold }]}>
            {label}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryLabel: {
    fontSize: 15,
  },
  secondaryLabel: {
    fontSize: 15,
  },
});
