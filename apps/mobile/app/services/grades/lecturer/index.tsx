import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ContentStack, EmptyState, Screen, SkeletonBlock } from '@/components/ui';
import { gradesApi, type LecturerGradeClassSection } from '@/services/api/grades';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { canManageGradesRole, getDayLabel } from '@/utils/app';

function formatMeetings(section: LecturerGradeClassSection) {
  if (section.meetings.length === 0) {
    return 'Chưa có lịch học';
  }

  return section.meetings
    .slice(0, 2)
    .map((meeting) => {
      const room = meeting.room ? ` · ${meeting.room}` : '';
      return `${getDayLabel(meeting.dayOfWeek)} ${meeting.startTime}-${meeting.endTime}${room}`;
    })
    .join('\n');
}

function GradeClassCard({
  section,
  onPress,
}: {
  section: LecturerGradeClassSection;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const complete = section.gradingStatus === 'complete';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: complete ? theme.colors.success : theme.colors.border,
          opacity: pressed ? 0.88 : 1,
        },
        theme.elevation.level1 as never,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <Text style={[styles.cardCode, { color: theme.colors.primary, fontFamily: theme.fonts.semibold }]}>
            {section.course.code} · {section.classCode}
          </Text>
          <Text style={[styles.cardTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]} numberOfLines={2}>
            {section.course.name}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
      </View>

      <Text style={[styles.cardMeta, { color: theme.colors.textMuted, fontFamily: theme.fonts.medium }]}>
        {section.semester.name} · {section.course.credits} TC · {section.enrolledCount} sinh viên
      </Text>
      <Text style={[styles.cardSchedule, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}>
        {formatMeetings(section)}
      </Text>

      <View style={styles.cardFooter}>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: complete ? theme.colors.successSurface : theme.colors.warningSurface },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: complete ? theme.colors.success : theme.colors.warning,
                fontFamily: theme.fonts.semibold,
              },
            ]}
          >
            {complete ? 'Đã lưu đủ điểm' : 'Chưa đủ điểm'}
          </Text>
        </View>
        <Text style={[styles.cardCount, { color: theme.colors.textMuted, fontFamily: theme.fonts.medium }]}>
          {section.gradedCount}/{section.enrolledCount}
        </Text>
      </View>
    </Pressable>
  );
}

export default function LecturerGradeClassesScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const canManageGrades = canManageGradesRole(role);
  const [query, setQuery] = React.useState('');

  const classSectionsQuery = useQuery({
    queryKey: ['grades', 'lecturer', 'class-sections'],
    queryFn: gradesApi.getLecturerClassSections,
    enabled: canManageGrades,
  });

  const filteredSections = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    const sections = classSectionsQuery.data ?? [];
    if (!needle) {
      return sections;
    }

    return sections.filter((section) =>
      [
        section.classCode,
        section.sectionCode,
        section.course.code,
        section.course.name,
        section.semester.name,
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [classSectionsQuery.data, query]);

  if (!canManageGrades) {
    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            icon="lock-closed-outline"
            title="Bạn không có quyền truy cập"
            description="Chỉ có giảng viên mới có quyền nhập điểm"
            actionLabel="Quay lại"
            onActionPress={() => router.back()}
          />
        </ContentStack>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={[styles.headerRow, { paddingTop: theme.spacing.sm, paddingHorizontal: theme.spacing.lg }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => router.back()} style={styles.backHit}>
          <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
          Nhập điểm
        </Text>
        <View style={styles.backHit} />
      </View>

      <ContentStack narrow overlapHero={false}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Tìm lớp, môn học, học kỳ..."
          placeholderTextColor={theme.colors.textSoft}
          style={[
            styles.searchInput,
            {
              color: theme.colors.text,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surfaceSubtle,
              fontFamily: theme.fonts.medium,
            },
          ]}
        />

        {classSectionsQuery.isLoading ? (
          <View style={styles.skeletonWrap}>
            <SkeletonBlock height={132} />
            <SkeletonBlock height={132} />
            <SkeletonBlock height={132} />
          </View>
        ) : null}

        {!classSectionsQuery.isLoading && classSectionsQuery.isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Không tải được lớp nhập điểm"
            description="Vui lòng kiểm tra kết nối và thử lại."
            actionLabel="Thử lại"
            onActionPress={() => void classSectionsQuery.refetch()}
          />
        ) : null}

        {!classSectionsQuery.isLoading && !classSectionsQuery.isError && filteredSections.length === 0 ? (
          <EmptyState
            icon="albums-outline"
            title={query.trim() ? 'Không tìm thấy lớp phù hợp' : 'Chưa có lớp được phân công'}
            description={
              query.trim()
                ? 'Thử tìm theo mã lớp, mã môn hoặc tên học phần khác.'
                : 'Các lớp được phân công cho giảng viên sẽ xuất hiện tại đây.'
            }
          />
        ) : null}

        {filteredSections.length > 0 ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.list}>
              {filteredSections.map((section) => (
                <GradeClassCard
                  key={section.id}
                  section={section}
                  onPress={() =>
                    router.push({
                      pathname: '/services/grades/lecturer/[classSectionId]',
                      params: { classSectionId: section.id },
                    } as never)
                  }
                />
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
  searchInput: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  skeletonWrap: {
    gap: 12,
  },
  list: {
    gap: 12,
    paddingBottom: 18,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitleBlock: {
    flex: 1,
    gap: 3,
  },
  cardCode: {
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
  cardSchedule: {
    fontSize: 12,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
  },
  cardCount: {
    fontSize: 12,
    lineHeight: 16,
  },
});
