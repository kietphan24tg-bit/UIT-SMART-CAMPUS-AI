import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SectionCard, StatusBadge } from '@/components/ui';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppTheme } from '@/theme';
import type { RoleTaskItem } from '@/types/app-data';

interface RoleTaskSectionProps {
  title: string;
  subtitle?: string;
  tasks: RoleTaskItem[];
  onPressTask: (route: string) => void;
}

export function RoleTaskSection({
  title,
  subtitle,
  tasks,
  onPressTask,
}: RoleTaskSectionProps) {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const columns = layout.getGridColumns({
    minItemWidth: 220,
    gap: 12,
    maxColumns: layout.isTablet ? 2 : 1,
  });
  const width = layout.getGridItemWidth({ columns, gap: 12 });

  return (
    <SectionCard title={title} subtitle={subtitle}>
      <View style={styles.grid}>
        {tasks.map((task) => (
          <Pressable
            key={task.id}
            accessibilityRole="button"
            onPress={() => onPressTask(task.route)}
            style={[
              styles.card,
              { width },
              {
                backgroundColor: theme.colors.surfaceSubtle,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.header}>
              <StatusBadge label={task.statusLabel} tone={task.tone} />
              <Text style={[styles.meta, { color: theme.colors.textSoft }]}>{task.meta}</Text>
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>{task.title}</Text>
            <Text style={[styles.description, { color: theme.colors.textMuted }]}>{task.description}</Text>
          </Pressable>
        ))}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    minHeight: 144,
  },
  header: {
    gap: 10,
  },
  meta: {
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
  },
});
