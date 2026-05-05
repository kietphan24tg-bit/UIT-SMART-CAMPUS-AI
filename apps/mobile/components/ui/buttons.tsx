import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { PressableProps, PressableStateCallbackType, StyleProp, TextStyle } from 'react-native';

import { useAppTheme } from '@/theme';

interface ButtonProps extends PressableProps {
  label: string;
  loading?: boolean;
  icon?: ReactNode;
  labelStyle?: StyleProp<TextStyle>;
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
  labelStyle,
  style,
  ...rest
}: ButtonProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: disabled ? theme.colors.primaryMuted : theme.colors.primary,
          borderColor: disabled ? theme.colors.primaryMuted : theme.colors.border,
          opacity: loading ? 0.72 : pressed ? 0.9 : 1,
        },
        resolvePressableStyle(style, { pressed, hovered: false }),
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={theme.colors.onPrimary} /> : null}
      {!loading ? (
        <View style={styles.row}>
          {icon}
          <Text
            style={[
              styles.primaryLabel,
              { color: theme.colors.onPrimary, fontFamily: theme.fonts.semibold },
              labelStyle,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.92}
            allowFontScaling={false}
          >
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
  labelStyle,
  style,
  ...rest
}: ButtonProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: disabled ? theme.colors.surfaceTinted : theme.colors.surfaceSubtle,
          borderColor: disabled ? theme.colors.inputBorder : theme.colors.border,
          borderWidth: 1,
          opacity: loading ? 0.72 : pressed ? 0.84 : 1,
        },
        resolvePressableStyle(style, { pressed, hovered: false }),
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={theme.colors.primary} /> : null}
      {!loading ? (
        <View style={styles.row}>
          {icon}
          <Text
            style={[
              styles.secondaryLabel,
              { color: theme.colors.primary, fontFamily: theme.fonts.semibold },
              labelStyle,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.92}
            allowFontScaling={false}
          >
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
    minWidth: 0,
    width: '100%',
  },
  primaryLabel: {
    flexShrink: 1,
    flexGrow: 1,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  secondaryLabel: {
    flexShrink: 1,
    flexGrow: 1,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
