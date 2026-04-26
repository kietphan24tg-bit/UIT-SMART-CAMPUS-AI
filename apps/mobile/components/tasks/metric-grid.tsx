import { StyleSheet, Text, View } from 'react-native';

import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppTheme } from '@/theme';
import type { MetricItem } from '@/types/app-data';

interface MetricGridProps {
  items: MetricItem[];
  minItemWidth?: number;
  maxColumns?: number;
  compactColumns?: number;
  cardMinHeight?: number;
  fixedColumns?: number;
  layoutPreset?: 'default' | 'mobileTwoByTwo' | 'mobileTwoByThree';
}

export function MetricGrid({
  items,
  minItemWidth = 148,
  maxColumns = 4,
  compactColumns,
  cardMinHeight,
  fixedColumns,
  layoutPreset = 'default',
}: MetricGridProps) {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const gap = 12;
  const shouldForceMobileTwoByTwo =
    layoutPreset === 'mobileTwoByTwo' && !layout.isTablet && items.length >= 4;
  const shouldForceMobileTwoByThree =
    layoutPreset === 'mobileTwoByThree' && !layout.isTablet && items.length >= 6;
  const columns =
    fixedColumns && fixedColumns > 0
      ? Math.max(1, Math.min(fixedColumns, items.length))
      : shouldForceMobileTwoByTwo
        ? 2
        : shouldForceMobileTwoByThree
          ? 2
          : !layout.isTablet && compactColumns
            ? Math.max(1, Math.min(compactColumns, items.length))
            : Math.max(
              1,
              Math.min(
                layout.isTablet ? maxColumns : 2,
                Math.floor((layout.availableWidth + gap) / (minItemWidth + gap)) || 1,
              ),
            );

  const rows: MetricItem[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }

  return (
    <View testID="metric-grid" style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={[styles.row, { gap }]}>
          {row.map((item, colIndex) => (
            <View
              key={item.label}
              testID={`metric-grid-card-${rowIndex * columns + colIndex}`}
              style={[
                styles.card,
                { minHeight: cardMinHeight ?? 116, flex: 1 },
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
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                {item.value}
              </Text>
              <Text
                style={[styles.helper, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}
                numberOfLines={2}
              >
                {item.helper}
              </Text>
            </View>
          ))}
          {row.length < columns
            ? Array.from({ length: columns - row.length }).map((_, spacerIndex) => (
              <View key={`spacer-${spacerIndex}`} style={{ flex: 1 }} />
            ))
            : null}
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
    gap: 12,
  },
  row: {
    flexDirection: 'row',
  },
  card: {
    borderWidth: 1,
    padding: 16,
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
