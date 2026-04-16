import type { ReactNode } from 'react';
import type { PressableProps } from 'react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme';

type Variant = 'success' | 'successOutline';

interface AttendanceCtaButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  loading?: boolean;
  variant?: Variant;
}

export function AttendanceCtaButton({
  label,
  loading,
  disabled,
  variant = 'success',
  ...rest
}: AttendanceCtaButtonProps) {
  const theme = useAppTheme();
  const isOutline = variant === 'successOutline';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isOutline ? theme.colors.primarySurface : theme.colors.primary,
          borderColor: theme.colors.primary,
          borderWidth: isOutline ? 2 : 1,
          opacity: disabled || loading ? 0.56 : pressed ? 0.9 : 1,
        },
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={theme.colors.onPrimary} /> : null}
      {!loading ? (
        <Text
          style={[
            styles.label,
            {
              color: isOutline ? theme.colors.primary : theme.colors.onPrimary,
              fontFamily: theme.fonts.semibold,
            },
          ]}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function AttendanceIconCircle({
  children,
  tone,
}: {
  children: ReactNode;
  tone: 'success' | 'warning' | 'muted';
}) {
  const theme = useAppTheme();
  const bg =
    tone === 'success'
      ? theme.colors.primarySurface
      : tone === 'warning'
        ? theme.colors.warningSurface
        : theme.colors.surfaceSubtle;
  const border =
    tone === 'success'
      ? theme.colors.primary
      : tone === 'warning'
        ? theme.colors.warning
        : theme.colors.border;

  return (
    <View style={[styles.iconCircle, { backgroundColor: bg, borderColor: border }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    alignSelf: 'stretch',
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: {
    fontSize: 15,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
