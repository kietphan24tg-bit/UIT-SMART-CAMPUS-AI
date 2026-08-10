import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MetricGrid } from './metric-grid';

import { ContentStack, InfoRow, Screen, SectionCard, StatusBadge, TopHero } from '@/components/ui';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppTheme } from '@/theme';
import type { TaskActionDescriptor, TaskRecord, TaskScreenConfig } from '@/types/app-data';

interface TaskScreenProps {
  config: TaskScreenConfig;
  onActionPress: (action: TaskActionDescriptor) => void;
  onRecordPress?: (record: TaskRecord) => void;
}

export function TaskScreen({
  config,
  onActionPress,
  onRecordPress,
}: TaskScreenProps) {
  return (
    <Screen>
      <TopHero
        eyebrow={config.eyebrow}
        title={config.title}
        subtitle={config.subtitle}
        badge={config.badge}
      />

      <ContentStack narrow={config.layout === 'narrow'}>
        {config.metrics?.length ? (
          <MetricGrid
            items={config.metrics}
            layoutPreset={config.metrics.length === 4 ? 'mobileTwoByTwo' : 'default'}
          />
        ) : null}

        {config.sections.map((section) => (
          <SectionCard key={section.title} title={section.title} subtitle={section.subtitle}>
            <View style={styles.sectionContent}>
              {section.body ? <BodyText text={section.body} /> : null}
              {section.infoRows?.map((row) => (
                <InfoRow key={`${section.title}-${row.label}`} label={row.label} value={row.value} />
              ))}
              {section.callout ? <CalloutBlock title={section.callout.title} body={section.callout.body} tone={section.callout.tone} /> : null}
              {section.records?.length ? (
                <TaskRecordGrid records={section.records} onPressRecord={onRecordPress} />
              ) : null}
              {section.actions?.length ? (
                <View style={styles.actions}>
                  {section.actions.map((action) => (
                    <SecondaryButton
                      key={`${section.title}-${action.label}`}
                      label={action.label}
                      disabled={action.disabled}
                      onPress={() => onActionPress(action)}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          </SectionCard>
        ))}

        {config.primaryAction ? (
          <PrimaryButton
            label={config.primaryAction.label}
            disabled={config.primaryAction.disabled}
            onPress={() => onActionPress(config.primaryAction!)}
          />
        ) : null}

        {config.secondaryActions?.length ? (
          <View style={styles.actions}>
            {config.secondaryActions.map((action) => (
              <SecondaryButton
                key={action.label}
                label={action.label}
                disabled={action.disabled}
                onPress={() => onActionPress(action)}
              />
            ))}
          </View>
        ) : null}
      </ContentStack>
    </Screen>
  );
}

function BodyText({ text }: { text: string }) {
  const theme = useAppTheme();

  return <Text style={[styles.body, { color: theme.colors.textMuted }]}>{text}</Text>;
}

function CalloutBlock({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone: TaskScreenConfig['badge']['tone'];
}) {
  const theme = useAppTheme();
  const palette =
    tone === 'danger'
      ? { backgroundColor: theme.colors.dangerSurface, borderColor: theme.colors.danger, textColor: theme.colors.danger }
      : tone === 'warning'
        ? { backgroundColor: theme.colors.warningSurface, borderColor: theme.colors.warning, textColor: theme.colors.warning }
        : tone === 'success'
          ? { backgroundColor: theme.colors.successSurface, borderColor: theme.colors.success, textColor: theme.colors.success }
          : tone === 'info'
            ? { backgroundColor: theme.colors.infoSurface, borderColor: theme.colors.info, textColor: theme.colors.info }
            : { backgroundColor: theme.colors.primarySurface, borderColor: theme.colors.primary, textColor: theme.colors.primary };

  return (
    <View
      style={[
        styles.callout,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
      ]}
    >
      <Text style={[styles.calloutTitle, { color: palette.textColor }]}>{title}</Text>
      <Text style={[styles.calloutBody, { color: theme.colors.textMuted }]}>{body}</Text>
    </View>
  );
}

function TaskRecordGrid({
  records,
  onPressRecord,
}: {
  records: TaskRecord[];
  onPressRecord?: (record: TaskRecord) => void;
}) {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const [gridWidth, setGridWidth] = useState(0);
  const columns = layout.getGridColumns({
    minItemWidth: 220,
    gap: 12,
    maxColumns: layout.isTablet ? 2 : 1,
  });
  const width =
    columns === 1
      ? '100%'
      : gridWidth > 0
        ? Math.max((gridWidth - 12 * (columns - 1)) / columns, 0)
        : '100%';

  return (
    <View
      style={styles.grid}
      onLayout={({ nativeEvent }) => {
        const nextWidth = nativeEvent.layout.width;
        if (nextWidth !== gridWidth) {
          setGridWidth(nextWidth);
        }
      }}
    >
      {records.map((record) => {
        const card = (
          <View
            testID={`task-record-${record.id}`}
            style={[
              styles.recordCard,
              { width },
              {
                backgroundColor: theme.colors.surfaceSubtle,
                borderColor: theme.colors.border,
                opacity: record.disabled ? 0.72 : 1,
              },
            ]}
          >
            <View style={styles.recordHeader}>
              {record.statusLabel ? <StatusBadge label={record.statusLabel} tone={record.tone} /> : null}
              {record.meta ? <Text style={[styles.recordMeta, { color: theme.colors.textSoft }]}>{record.meta}</Text> : null}
            </View>
            <Text style={[styles.recordTitle, { color: theme.colors.text }]}>{record.title}</Text>
            <Text style={[styles.recordSubtitle, { color: theme.colors.textMuted }]}>{record.subtitle}</Text>
            {record.disabledReason ? (
              <Text style={[styles.recordMeta, { color: theme.colors.textSoft }]}>
                {record.disabledReason}
              </Text>
            ) : null}
          </View>
        );

        if (record.route && onPressRecord) {
          return (
            <Pressable
              key={record.id}
              accessibilityRole="button"
              disabled={record.disabled}
              onPress={() => {
                if (!record.disabled) {
                  onPressRecord(record);
                }
              }}
            >
              {card}
            </Pressable>
          );
        }

        return (
          <View key={record.id}>
            {card}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContent: {
    gap: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  callout: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  calloutBody: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recordCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    minHeight: 132,
  },
  recordHeader: {
    gap: 10,
  },
  recordMeta: {
    fontSize: 12,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  recordSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    gap: 12,
  },
});
