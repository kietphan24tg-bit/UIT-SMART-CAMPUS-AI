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
            getMetricToneStyle(theme, item.tone),
            {
              borderRadius: theme.radii.xl,
            },
            theme.elevation.level1 as never,
          ]}
        >
          <Text style={[styles.label, { color: theme.colors.textMuted, fontFamily: theme.fonts.medium }]}>
            {item.label}
          </Text>
          <Text
            style={[
              styles.value,
              {
                color: getMetricToneStyle(theme, item.tone).accentColor,
                fontFamily: theme.fonts.bold,
              },
            ]}
          >
            {item.value}
          </Text>
          <Text style={[styles.helper, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}>
            {item.helper}
          </Text>
        </View>
      ))}
    </View>
  );
}

function getMetricToneStyle(
  theme: ReturnType<typeof useAppTheme>,
  tone?: MetricItem['tone'],
) {
  switch (tone) {
    case 'primary':
      return {
        backgroundColor: theme.colors.primarySurface,
        borderColor: theme.colors.border,
        accentColor: theme.colors.primary,
      };
    case 'success':
      return {
        backgroundColor: theme.colors.successSurface,
        borderColor: theme.colors.border,
        accentColor: theme.colors.success,
      };
    case 'warning':
      return {
        backgroundColor: theme.colors.warningSurface,
        borderColor: theme.colors.border,
        accentColor: theme.colors.warning,
      };
    case 'danger':
      return {
        backgroundColor: theme.colors.dangerSurface,
        borderColor: theme.colors.border,
        accentColor: theme.colors.danger,
      };
    case 'info':
      return {
        backgroundColor: theme.colors.infoSurface,
        borderColor: theme.colors.border,
        accentColor: theme.colors.info,
      };
    default:
      return {
        backgroundColor: theme.colors.surfaceElevated,
        borderColor: theme.colors.border,
        accentColor: theme.colors.text,
      };
  }
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    borderWidth: 1,
    padding: 16,
    minHeight: 116,
  },
  label: {
    fontSize: 13,
  },
  value: {
    fontSize: 26,
    marginTop: 8,
  },
  helper: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 17,
  },
});
