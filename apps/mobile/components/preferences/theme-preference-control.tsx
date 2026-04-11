import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ThemePreference } from '@/theme';
import { useAppTheme } from '@/theme';

const OPTIONS: Array<{ label: string; value: ThemePreference }> = [
  { label: 'Hệ thống', value: 'system' },
  { label: 'Sáng', value: 'light' },
  { label: 'Tối', value: 'dark' },
];

interface ThemePreferenceControlProps {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
}

export function ThemePreferenceControl({
  value,
  onChange,
}: ThemePreferenceControlProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {OPTIONS.map((option) => {
        const isActive = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(option.value)}
            style={[
              styles.option,
              {
                backgroundColor: isActive ? theme.colors.primary : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.optionLabel,
                {
                  color: isActive ? theme.colors.onPrimary : theme.colors.textMuted,
                  fontFamily: isActive ? theme.fonts.bold : theme.fonts.medium,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 4,
    gap: 4,
  },
  option: {
    minHeight: 42,
    borderRadius: 16,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  optionLabel: {
    fontSize: 13,
  },
});
