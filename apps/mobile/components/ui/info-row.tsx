import { StyleSheet, Text, View } from 'react-native';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppTheme } from '@/theme';

interface InfoRowProps {
  label: string;
  value: string;
}

export function InfoRow({ label, value }: InfoRowProps) {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const shouldWrapValue = layout.isCompact || layout.isRegularPhone;

  return (
    <View
      testID="info-row"
      style={[
        styles.row,
        shouldWrapValue ? styles.rowWrapped : null,
        {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
        },
      ]}
      >
      <Text
        style={[styles.label, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.value,
          shouldWrapValue ? styles.valueWrapped : null,
          { color: theme.colors.text, fontFamily: theme.fonts.medium },
        ]}
        numberOfLines={shouldWrapValue ? 2 : 1}
      >
        {value}
      </Text>
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
  rowWrapped: {
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 13,
    flexShrink: 0,
    minWidth: 72,
  },
  value: {
    fontSize: 14,
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
  },
  valueWrapped: {
    lineHeight: 20,
  },
});
