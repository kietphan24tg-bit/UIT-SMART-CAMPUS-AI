import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { type AppTheme, useAppTheme } from '@/theme';
import { getDayLabel } from '@/utils/app';

export function getScheduleDaySpacing(theme: Pick<AppTheme, 'spacing'>) {
  return {
    daySectionGap: theme.spacing.sm,
    dayContentGap: 2,
    scheduleItemGap: theme.spacing.sm,
  } as const;
}

interface ScheduleDayListProps {
  children: ReactNode;
  testID?: string;
}

export function ScheduleDayList({ children, testID = 'schedule-day-list' }: ScheduleDayListProps) {
  const theme = useAppTheme();
  const spacing = getScheduleDaySpacing(theme);

  return (
    <View
      collapsable={false}
      testID={testID}
      style={[styles.dayList, { gap: spacing.daySectionGap }]}
    >
      {children}
    </View>
  );
}

interface ScheduleDayGroupProps<T> {
  day: number;
  items: readonly T[];
  getItemKey: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  testIDPrefix?: string;
}

export function ScheduleDayGroup<T>({
  day,
  items,
  getItemKey,
  renderItem,
  testIDPrefix = 'schedule',
}: ScheduleDayGroupProps<T>) {
  const theme = useAppTheme();
  const spacing = getScheduleDaySpacing(theme);

  if (items.length === 0) {
    return null;
  }

  return (
    <View
      collapsable={false}
      testID={`${testIDPrefix}-day-${day}`}
      style={[styles.dayGroup, { gap: spacing.dayContentGap }]}
    >
      <Text
        testID={`${testIDPrefix}-day-header-${day}`}
        style={[styles.heading, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}
      >
        {getDayLabel(day).toUpperCase()}
      </Text>

      <View
        collapsable={false}
        testID={`${testIDPrefix}-session-list-${day}`}
        style={[styles.sessionList, { gap: spacing.scheduleItemGap }]}
      >
        {items.map((item, index) => (
          <View
            key={getItemKey(item)}
            collapsable={false}
            testID={`${testIDPrefix}-session-${day}-${index}`}
            style={styles.sessionItem}
          >
            {renderItem(item, index)}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dayList: {
    alignSelf: 'stretch',
    width: '100%',
  },
  dayGroup: {
    alignSelf: 'stretch',
    width: '100%',
  },
  heading: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    includeFontPadding: false,
  },
  sessionList: {
    alignSelf: 'stretch',
    width: '100%',
  },
  sessionItem: {
    alignSelf: 'stretch',
    width: '100%',
  },
});
