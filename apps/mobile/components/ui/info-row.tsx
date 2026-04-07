import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme';

interface InfoRowProps {
  label: string;
  value: string;
}

export function InfoRow({ label, value }: InfoRowProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.row, { borderBottomColor: theme.colors.divider }]}>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 13,
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
});
