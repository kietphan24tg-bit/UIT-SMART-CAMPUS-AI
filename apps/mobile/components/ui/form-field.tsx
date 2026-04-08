import { Feather } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useContext, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  findNodeHandle,
} from 'react-native';
import type { TextInputProps } from 'react-native';

import { ScreenScrollContext } from './screen';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppTheme } from '@/theme';

interface FormFieldProps extends TextInputProps {
  label: string;
  hint?: string;
  error?: string;
  leftIcon?: keyof typeof Feather.glyphMap;
  rightAccessory?: ReactNode;
  secureToggle?: boolean;
}

export function FormField({
  label,
  hint,
  error,
  style,
  leftIcon,
  rightAccessory,
  secureToggle = false,
  secureTextEntry,
  ...rest
}: FormFieldProps) {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const screenScroll = useContext(ScreenScrollContext);
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const showSecureToggle = secureToggle || Boolean(secureTextEntry);
  const resolvedSecureTextEntry = showSecureToggle ? !isPasswordVisible : secureTextEntry;
  const shouldAutoScroll = Platform.OS !== 'web' && !layout.isTablet && screenScroll?.enabled;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>
        {label}
      </Text>
      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: theme.colors.input,
            borderColor: error
              ? theme.colors.danger
              : isFocused
                ? theme.colors.primary
                : theme.colors.inputBorder,
          },
        ]}
      >
        {leftIcon ? (
          <Feather
            name={leftIcon}
            size={18}
            color={isFocused ? theme.colors.primary : theme.colors.textSoft}
            style={styles.leftIcon}
          />
        ) : null}
        <TextInput
          placeholderTextColor={theme.colors.textSoft}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              fontFamily: theme.fonts.regular,
            },
            style,
          ]}
          secureTextEntry={resolvedSecureTextEntry}
          onFocus={(event) => {
            setIsFocused(true);
            if (shouldAutoScroll) {
              const targetHandle =
                typeof event.target === 'number'
                  ? event.target
                  : findNodeHandle(event.target as never);
              screenScroll?.scrollToField(targetHandle ?? null);
            }
            rest.onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            rest.onBlur?.(event);
          }}
          {...rest}
        />
        <View style={styles.rightRail}>
          {rightAccessory}
          {showSecureToggle ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isPasswordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              hitSlop={8}
              onPress={() => setIsPasswordVisible((prev) => !prev)}
              style={styles.eyeButton}
            >
              <Feather
                name={isPasswordVisible ? 'eye-off' : 'eye'}
                size={18}
                color={theme.colors.textSoft}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
      {error ? (
        <Text
          style={[styles.message, { color: theme.colors.danger, fontFamily: theme.fonts.regular }]}
        >
          {error}
        </Text>
      ) : null}
      {!error && hint ? (
        <Text
          style={[
            styles.message,
            { color: theme.colors.textSoft, fontFamily: theme.fonts.regular },
          ]}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    fontSize: 13,
  },
  inputShell: {
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leftIcon: {
    marginLeft: 2,
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 0,
    paddingVertical: 12,
    fontSize: 15,
  },
  rightRail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eyeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 12,
    lineHeight: 18,
  },
});
