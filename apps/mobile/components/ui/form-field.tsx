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

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.colors.textSoft}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.input,
            borderColor: error ? theme.colors.danger : theme.colors.inputBorder,
            color: theme.colors.text,
          },
          style,
        ]}
        {...rest}
      />
      {error ? <Text style={[styles.message, { color: theme.colors.danger }]}>{error}</Text> : null}
      {!error && hint ? (
        <Text style={[styles.message, { color: theme.colors.textSoft }]}>{hint}</Text>
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
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  message: {
    fontSize: 12,
    lineHeight: 18,
  },
});
