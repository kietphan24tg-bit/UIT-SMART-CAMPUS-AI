import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme';

interface InfoRowProps {
  label: string;
  value: string;
}

export function InfoRow({ label, value }: InfoRowProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.label, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    flex: 1,
  },
  value: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
});
