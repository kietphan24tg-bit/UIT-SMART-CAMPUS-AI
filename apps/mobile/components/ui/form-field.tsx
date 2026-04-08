import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { useAppTheme } from '@/theme';

interface FormFieldProps extends TextInputProps {
  label: string;
  hint?: string;
  error?: string;
}

export function FormField({ label, hint, error, style, ...rest }: FormFieldProps) {
  const theme = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={theme.colors.textSoft}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.input,
            borderColor: error
              ? theme.colors.danger
              : isFocused
                ? theme.colors.primary
                : theme.colors.inputBorder,
            color: theme.colors.text,
            fontFamily: theme.fonts.regular,
          },
          style,
        ]}
        onFocus={(event) => {
          setIsFocused(true);
          rest.onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          rest.onBlur?.(event);
        }}
        {...rest}
      />
      {error ? (
        <Text style={[styles.message, { color: theme.colors.danger, fontFamily: theme.fonts.regular }]}>
          {error}
        </Text>
      ) : null}
      {!error && hint ? (
        <Text style={[styles.message, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}>
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
  input: {
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  message: {
    fontSize: 12,
    lineHeight: 18,
  },
});
