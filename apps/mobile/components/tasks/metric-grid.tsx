import { StyleSheet, Text, View } from 'react-native';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppTheme } from '@/theme';
import type { MetricItem } from '@/types/app-data';

interface MetricGridProps {
  items: MetricItem[];
  minItemWidth?: number;
  maxColumns?: number;
}

export function MetricGrid({
  items,
  minItemWidth = 148,
  maxColumns = 4,
}: MetricGridProps) {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const columns = layout.getGridColumns({
    minItemWidth,
    gap: 12,
    maxColumns: layout.isTablet ? maxColumns : 2,
  });
  const width = layout.getGridItemWidth({ columns, gap: 12 });

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <View
          key={item.label}
          style={[
            styles.card,
            { width },
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>{item.label}</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>{item.value}</Text>
          <Text style={[styles.helper, { color: theme.colors.textSoft }]}>{item.helper}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    minHeight: 116,
  },
  label: {
    fontSize: 13,
  },
  value: {
    fontSize: 25,
    fontWeight: '800',
    marginTop: 8,
  },
  helper: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 17,
  },
});
