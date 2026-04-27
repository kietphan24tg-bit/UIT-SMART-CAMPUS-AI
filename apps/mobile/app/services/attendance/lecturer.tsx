import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  LecturerAttendanceScheduleCard,
  groupAttendanceCardsByDay,
  mapClassSectionsToAttendanceCards,
  mapScheduleToAttendanceCards,
  resolveScheduleCardToClassSection,
} from '@/app/services/attendance/lecturer-data';
import { ContentStack, EmptyState, Screen, SkeletonBlock } from '@/components/ui';
import { useScheduleScreenData } from '@/hooks/use-schedule-screen';
import { attendanceApi } from '@/services/api/attendance';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { canManageAttendanceRole, getDayLabel, isLecturerRole } from '@/utils/app';

export {
  groupAttendanceCardsByDay,
  mapScheduleToAttendanceCards,
  resolveScheduleCardToClassSection,
};

function getRoomLabel(room?: string | null) {
  return room ? `Phòng ${room}` : 'Chưa cập nhật phòng';
}

function getScheduleAccentColor(courseCode: string) {
  const palette = ['#8E8BFF', '#22A884', '#C08A6B', '#4A90E2', '#B96EFF', '#F59E0B'];
  const total = Array.from(courseCode).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[total % palette.length];
}

function ScheduleCard({
  card,
  onPress,
}: {
  card: LecturerAttendanceScheduleCard;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const isUnlinked = !card.attendanceSection;
  const accentColor = getScheduleAccentColor(card.course.code);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.scheduleCard,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.9 : 1,
        },
        theme.elevation.level1 as never,
      ]}
    >
      <View
        style={[
          styles.scheduleIconWrap,
          {
            backgroundColor: theme.colors.surfaceSubtle,
          },
        ]}
      >
        <View style={styles.iconGrid}>
          {[0, 1, 2, 3].map((item) => (
            <View key={item} style={[styles.iconGridSquare, { backgroundColor: accentColor }]} />
          ))}
        </View>
      </View>

      <View style={styles.scheduleBody}>
        <Text
          style={[
            styles.cardEyebrow,
            {
              color: isUnlinked ? theme.colors.warning : theme.colors.textSoft,
              fontFamily: theme.fonts.medium,
            },
          ]}
        >
          {card.course.code}
          {card.classCode ? ` · ${card.classCode}` : ''}
        </Text>
        <Text
          style={[
            styles.cardTitle,
            { color: theme.colors.text, fontFamily: theme.fonts.semibold },
          ]}
          numberOfLines={2}
        >
          {card.course.name}
        </Text>
        <Text
          style={[
            styles.cardMeta,
            { color: theme.colors.textMuted, fontFamily: theme.fonts.medium },
          ]}
          numberOfLines={1}
        >
          {card.startTime} - {card.endTime} · {getRoomLabel(card.room)}
        </Text>
        {isUnlinked ? (
          <Text
            style={[
              styles.cardHint,
              { color: theme.colors.danger, fontFamily: theme.fonts.medium },
            ]}
          >
            Chưa liên kết dữ liệu điểm danh
          </Text>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
    </Pressable>
  );
}

export default function LecturerAttendanceScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const canManageAttendance = canManageAttendanceRole(role);
  const scheduleState = useScheduleScreenData();

  const classSectionsQuery = useQuery({
    queryKey: ['attendance', 'lecturer', 'class-sections'],
    queryFn: attendanceApi.getLecturerClassSections,
    enabled: canManageAttendance,
  });

  const fallbackClassSections = React.useMemo(() => {
    const sections = classSectionsQuery.data ?? [];
    if (sections.length === 0) {
      return [];
    }

    if (scheduleState.resolvedSemesterId) {
      return sections.filter((section) => section.semester.id === scheduleState.resolvedSemesterId);
    }

    const currentSections = sections.filter((section) => section.semester.isCurrent);
    return currentSections.length > 0 ? currentSections : sections;
  }, [classSectionsQuery.data, scheduleState.resolvedSemesterId]);

  const scheduleCards = React.useMemo(
    () =>
      scheduleState.schedule.length > 0
        ? mapScheduleToAttendanceCards(scheduleState.schedule, classSectionsQuery.data ?? [])
        : mapClassSectionsToAttendanceCards(fallbackClassSections),
    [classSectionsQuery.data, fallbackClassSections, scheduleState.schedule],
  );
  const groupedCards = React.useMemo(
    () => groupAttendanceCardsByDay(scheduleCards),
    [scheduleCards],
  );

  if (!canManageAttendance) {
    return (
      <Screen>
        <ContentStack narrow overlapHero={false}>
          <EmptyState
            icon="lock-closed-outline"
            title="Bạn không có quyền truy cập"
            description="Màn hình này chỉ dành cho giảng viên, quản trị viên hoặc quản trị hệ thống."
            actionLabel="Quay lại"
            onActionPress={() => router.back()}
          />
        </ContentStack>
      </Screen>
    );
  }

  const showScheduleLoading = scheduleState.isLoading;
  const showEmptySchedule =
    !showScheduleLoading && !scheduleState.isError && scheduleCards.length === 0;

  return (
    <Screen>
      <View
        style={[
          styles.headerRow,
          { paddingTop: theme.spacing.sm, paddingHorizontal: theme.spacing.lg },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
          style={styles.backHit}
        >
          <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
        </Pressable>
        <Text
          style={[
            styles.headerTitle,
            { color: theme.colors.text, fontFamily: theme.fonts.semibold },
          ]}
        >
          Chọn lớp điểm danh QR
        </Text>
        <View style={styles.backHit} />
      </View>

      <ContentStack narrow overlapHero={false}>
        <View
          style={[
            styles.introPanel,
            {
              backgroundColor: theme.colors.primarySurface,
              borderColor: theme.colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.introTitle,
              { color: theme.colors.primary, fontFamily: theme.fonts.semibold },
            ]}
          >
            Danh sách lớp theo lịch học kỳ
          </Text>
          <Text
            style={[
              styles.introBody,
              { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
            ]}
          >
            Chọn một lớp để vào workspace điểm danh: tạo phiên QR, xem sinh viên, lịch sử
            và thống kê.
          </Text>
        </View>

        {showScheduleLoading ? (
          <View style={styles.skeletonWrap}>
            <SkeletonBlock height={108} />
            <SkeletonBlock height={108} />
            <SkeletonBlock height={108} />
          </View>
        ) : null}

        {!showScheduleLoading && scheduleState.isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Không tải được lịch giảng dạy"
            description="Vui lòng thử lại để đồng bộ danh sách lớp học."
            actionLabel="Thử lại"
            onActionPress={() => void scheduleState.refetch()}
          />
        ) : null}

        {showEmptySchedule ? (
          <EmptyState
            icon="albums-outline"
            title={isLecturerRole(role) ? 'Chưa có lớp được phân công' : 'Chưa có lớp học phần'}
            description={
              isLecturerRole(role)
                ? 'Bạn chưa được gán lớp học phần nào.'
                : 'Hiện chưa có lớp học phần khả dụng để quản lý.'
            }
          />
        ) : null}

        {scheduleCards.length > 0 ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.dayList}>
              {groupedCards.map((group) => (
                <View key={group.dayOfWeek} style={styles.dayGroup}>
                  <Text
                    style={[
                      styles.dayHeading,
                      { color: theme.colors.textSoft, fontFamily: theme.fonts.semibold },
                    ]}
                  >
                    {getDayLabel(group.dayOfWeek)}
                  </Text>

                  <View style={styles.cardList}>
                    {group.items.map((card) => (
                      <ScheduleCard
                        key={card.id}
                        card={card}
                        onPress={() =>
                          router.push({
                            pathname: '/services/attendance/class/[scheduleId]',
                            params: { scheduleId: card.id },
                          } as never)
                        }
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : null}
      </ContentStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backHit: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  introPanel: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  introTitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  introBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  skeletonWrap: {
    gap: 12,
  },
  dayList: {
    gap: 18,
    paddingBottom: 16,
  },
  dayGroup: {
    gap: 10,
  },
  dayHeading: {
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cardList: {
    gap: 10,
  },
  scheduleCard: {
    minHeight: 102,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  scheduleIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGrid: {
    width: 20,
    height: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  iconGridSquare: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  scheduleBody: {
    flex: 1,
    gap: 2,
  },
  cardEyebrow: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  cardMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardHint: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
  },
});
