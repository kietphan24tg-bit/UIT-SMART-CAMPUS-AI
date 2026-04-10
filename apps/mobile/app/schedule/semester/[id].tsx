import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ContentStack, EmptyState, Screen, SectionCard, TopHero } from '@/components/ui';
import { scheduleApi } from '@/services/api/schedule';
import { useAppTheme } from '@/theme';
import type { ScheduleRecord } from '@/types/app-data';
import { formatShortDate, getDayLabel, groupScheduleByDay } from '@/utils/app';

type SegmentKey = 'daytime' | 'evening';

const SEGMENT_OPTIONS: Array<{ key: SegmentKey; label: string }> = [
  { key: 'daytime', label: 'Lịch chính' },
  { key: 'evening', label: 'Hình thức 2' },
];

function getScheduleRoomText(room?: string | null) {
  return room ? `Phòng ${room}` : 'Chưa có phòng';
}

function getClassMetaText(item: ScheduleRecord) {
  return `${item.classCode} · ${getScheduleRoomText(item.room)}`;
}

function getPeriodText(item: ScheduleRecord) {
  if (typeof item.startPeriod === 'number' && typeof item.endPeriod === 'number') {
    return `Tiết ${item.startPeriod}-${item.endPeriod}`;
  }

  return 'Chưa có tiết';
}

export default function SemesterScheduleDetailScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const semesterId = typeof params.id === 'string' ? params.id : undefined;
  const [activeSegment, setActiveSegment] = useState<SegmentKey>('daytime');

  const semesterQuery = useQuery({
    queryKey: ['schedule', 'semester-detail', semesterId],
    queryFn: () => scheduleApi.getScheduleBySemesterId(semesterId as string),
    enabled: Boolean(semesterId),
  });

  const filteredSessions = useMemo(
    () => (semesterQuery.data?.sessions ?? []).filter((item) => item.sessionType === activeSegment),
    [activeSegment, semesterQuery.data?.sessions],
  );

  const groupedEntries = useMemo(
    () =>
      Object.entries(groupScheduleByDay(filteredSessions)).sort(
        ([dayA], [dayB]) => Number(dayA) - Number(dayB),
      ),
    [filteredSessions],
  );

  if (!semesterId) {
    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            icon="calendar-outline"
            title="Không tìm thấy học kỳ"
            description="Thiếu mã học kỳ để hiển thị lịch chi tiết."
            actionLabel="Về lịch"
            onActionPress={() => router.replace('/schedule')}
          />
        </ContentStack>
      </Screen>
    );
  }

  if (semesterQuery.isError) {
    return (
      <Screen>
        <TopHero
          eyebrow="Lịch học"
          title="Chi tiết học kỳ"
          subtitle="Không tải được dữ liệu lịch cho học kỳ đã chọn."
          badge={{ label: 'Lỗi tải dữ liệu', tone: 'warning' }}
        />
        <ContentStack narrow overlapHero={false}>
          <EmptyState
            icon="alert-circle-outline"
            title="Không tải được lịch học kỳ"
            description="Dữ liệu học kỳ này hiện chưa sẵn sàng hoặc đã có lỗi khi tải."
            actionLabel="Về lịch"
            onActionPress={() => router.replace('/schedule')}
          />
        </ContentStack>
      </Screen>
    );
  }

  const semester = semesterQuery.data;
  const subtitle = semester
    ? `${formatShortDate(semester.startDate)} - ${formatShortDate(semester.endDate)}`
    : 'Đang tải khoảng thời gian học kỳ';

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={semesterQuery.isRefetching}
          onRefresh={() => void semesterQuery.refetch()}
          tintColor={theme.colors.primary}
        />
      }
    >
      <ContentStack overlapHero={false}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quay lại lịch"
              onPress={() => router.back()}
              style={[
                styles.backButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
            </Pressable>

            <View style={styles.headerCopy}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                {semester?.name ?? 'Đang tải học kỳ'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
                {subtitle}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.segmentedControl,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {SEGMENT_OPTIONS.map((option) => (
              <FilterChip
                key={option.key}
                label={option.label}
                active={activeSegment === option.key}
                onPress={() => setActiveSegment(option.key)}
              />
            ))}
          </View>
        </View>

        {semesterQuery.isLoading ? (
          <SectionCard
            title="Đang tải lịch học kỳ"
            subtitle="Dữ liệu sẽ xuất hiện khi hoàn tất tải từ hệ thống."
            variant="outlined"
          >
            <Text style={[styles.supportText, { color: theme.colors.textMuted }]}>
              Đang đồng bộ lịch học theo học kỳ đã chọn.
            </Text>
          </SectionCard>
        ) : groupedEntries.length > 0 ? (
          groupedEntries.map(([day, items]) => (
            <View key={day} style={styles.daySection}>
              <Text
                style={[
                  styles.dayHeading,
                  { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                ]}
              >
                {getDayLabel(Number(day)).toUpperCase()}
              </Text>

              <View style={styles.sessionList}>
                {items.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.sessionCard,
                      {
                        backgroundColor: theme.colors.surfaceSubtle,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View style={[styles.sessionBar, { backgroundColor: theme.colors.primary }]} />
                    <View style={styles.sessionBody}>
                      <View style={styles.sessionHeader}>
                        <View style={styles.sessionHeaderMain}>
                          <Text
                            style={[
                              styles.sessionTitle,
                              { color: theme.colors.text, fontFamily: theme.fonts.bold },
                            ]}
                          >
                            {item.course.name}
                          </Text>
                        </View>

                        <View style={styles.sessionTimeBlock}>
                          <Text
                            style={[
                              styles.sessionTime,
                              { color: theme.colors.primary, fontFamily: theme.fonts.bold },
                            ]}
                          >
                            {item.startTime}-{item.endTime}
                          </Text>
                          <Text
                            style={[
                              styles.sessionPeriodText,
                              { color: theme.colors.textMuted, fontFamily: theme.fonts.medium },
                            ]}
                          >
                            {getPeriodText(item)}
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={[
                          styles.sessionMeta,
                          { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                        ]}
                        numberOfLines={1}
                      >
                        {getClassMetaText(item)}
                      </Text>
                      <Text
                        style={[
                          styles.sessionMeta,
                          { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                        ]}
                        numberOfLines={1}
                      >
                        {item.instructor ?? 'Chưa cập nhật giảng viên'}
                      </Text>

                      <Text
                        style={[
                          styles.sessionCode,
                          { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
                        ]}
                      >
                        {item.course.code}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            icon="calendar-clear-outline"
            title="Không có lịch cho mục này"
            description={
              activeSegment === 'daytime'
                ? 'Học kỳ này chưa có dữ liệu cho Lịch chính.'
                : 'Học kỳ này chưa có dữ liệu cho Hình thức 2.'
            }
          />
        )}
      </ContentStack>
    </Screen>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: active ? theme.colors.surfaceSubtle : 'transparent',
          borderColor: active ? theme.colors.border : 'transparent',
        },
      ]}
    >
      <Text
        style={[
          styles.filterLabel,
          {
            color: active ? theme.colors.text : theme.colors.textMuted,
            fontFamily: active ? theme.fonts.semibold : theme.fonts.medium,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 12,
    paddingTop: 4,
    paddingBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  filterChip: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterLabel: {
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  supportText: {
    fontSize: 14,
    lineHeight: 20,
  },
  sessionList: {
    gap: 8,
  },
  daySection: {
    gap: 8,
  },
  dayHeading: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.8,
  },
  sessionCard: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  sessionBar: {
    width: 6,
  },
  sessionBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  sessionHeaderMain: {
    flex: 1,
    minWidth: 0,
  },
  sessionTimeBlock: {
    alignItems: 'flex-end',
    gap: 0,
    minWidth: 88,
  },
  sessionTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  sessionTime: {
    fontSize: 13,
    lineHeight: 18,
  },
  sessionMeta: {
    fontSize: 12,
    lineHeight: 16,
  },
  sessionPeriodText: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'right',
  },
  sessionCode: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
});
