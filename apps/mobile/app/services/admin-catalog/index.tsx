import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContentStack, EmptyState, FormField, PrimaryButton, Screen, SecondaryButton, SkeletonBlock } from '@/components/ui';
import { catalogApi } from '@/services/api/catalog';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { isAdminRole } from '@/utils/app';

export default function AdminCatalogScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const admin = isAdminRole(role);

  const semestersQuery = useQuery({
    queryKey: ['catalog', 'semesters'],
    queryFn: catalogApi.listSemesters,
    enabled: admin,
  });
  const lecturersQuery = useQuery({
    queryKey: ['catalog', 'lecturers'],
    queryFn: catalogApi.listLecturers,
    enabled: admin,
  });
  const classSectionsQuery = useQuery({
    queryKey: ['catalog', 'class-sections'],
    queryFn: () => catalogApi.listClassSections(),
    enabled: admin,
  });

  const [courseCode, setCourseCode] = useState('SE399');
  const [courseName, setCourseName] = useState('Chuyen de demo');
  const [courseCredits, setCourseCredits] = useState('3');

  const [semesterId, setSemesterId] = useState('');
  const [classCode, setClassCode] = useState('SE399.Q01');
  const [sectionCode, setSectionCode] = useState('Q01');
  const [classCourseCode, setClassCourseCode] = useState('SE399');
  const [capacity, setCapacity] = useState('60');
  const [lecturerId, setLecturerId] = useState('');

  const [meetingSectionId, setMeetingSectionId] = useState('');
  const [meetingDay, setMeetingDay] = useState('2');
  const [meetingStart, setMeetingStart] = useState('07:30');
  const [meetingEnd, setMeetingEnd] = useState('10:00');
  const [meetingRoom, setMeetingRoom] = useState('B1.02');

  const selectedSemesterId =
    semesterId || semestersQuery.data?.find((item) => item.isCurrent)?.id || semestersQuery.data?.[0]?.id || '';

  const sectionsForSemester = useMemo(
    () =>
      (classSectionsQuery.data ?? []).filter((section) =>
        selectedSemesterId ? section.semester.id === selectedSemesterId : true,
      ),
    [classSectionsQuery.data, selectedSemesterId],
  );

  const createCourseMutation = useMutation({
    mutationFn: () =>
      catalogApi.createCourse({
        code: courseCode,
        name: courseName,
        credits: Number.parseInt(courseCredits, 10) || 3,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['catalog', 'courses'] });
    },
  });

  const createClassMutation = useMutation({
    mutationFn: () =>
      catalogApi.createClassSection({
        semesterId: selectedSemesterId,
        courseCode: classCourseCode,
        classCode,
        sectionCode,
        capacity: Number.parseInt(capacity, 10) || 60,
        lecturerId: lecturerId || undefined,
        registrationOpen: true,
      }),
    onSuccess: async (result) => {
      setMeetingSectionId(result.id);
      await queryClient.invalidateQueries({ queryKey: ['catalog', 'class-sections'] });
    },
  });

  const replaceMeetingsMutation = useMutation({
    mutationFn: () =>
      catalogApi.replaceClassMeetings(meetingSectionId, {
        meetings: [
          {
            dayOfWeek: Number.parseInt(meetingDay, 10) || 2,
            startTime: meetingStart,
            endTime: meetingEnd,
            room: meetingRoom,
            sessionType: 'daytime',
          },
        ],
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['catalog', 'class-sections'] });
    },
  });

  if (!admin) {
    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            icon="lock-closed-outline"
            title="Bạn không có quyền truy cập"
            description="Màn hình này chỉ dành cho admin và super admin."
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
          style={styles.backHit}
        >
          <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
          Quản trị danh mục
        </Text>
        <View style={styles.backHit} />
      </View>

      <ContentStack narrow overlapHero={false}>
        {semestersQuery.isLoading || lecturersQuery.isLoading || classSectionsQuery.isLoading ? (
          <View style={styles.skeletonWrap}>
            <SkeletonBlock height={120} />
            <SkeletonBlock height={120} />
          </View>
        ) : null}

        {!semestersQuery.isLoading && (semestersQuery.isError || lecturersQuery.isError || classSectionsQuery.isError) ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Không tải được dữ liệu catalog"
            description="Vui lòng thử lại."
            actionLabel="Thử lại"
            onActionPress={() => {
              void semestersQuery.refetch();
              void lecturersQuery.refetch();
              void classSectionsQuery.refetch();
            }}
          />
        ) : null}

        {!semestersQuery.isLoading && !semestersQuery.isError ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.formList}>
              <View style={[styles.card, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                  Tạo học phần
                </Text>
                <FormField label="Mã học phần" value={courseCode} onChangeText={setCourseCode} autoCapitalize="characters" />
                <FormField label="Tên học phần" value={courseName} onChangeText={setCourseName} />
                <FormField label="Số tín chỉ" value={courseCredits} onChangeText={setCourseCredits} keyboardType="number-pad" />
                <PrimaryButton
                  label={createCourseMutation.isPending ? 'Đang tạo...' : 'Tạo học phần'}
                  onPress={() => createCourseMutation.mutate()}
                />
              </View>

              <View style={[styles.card, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                  Tạo lớp học phần
                </Text>
                <FormField
                  label="Semester ID"
                  value={semesterId || selectedSemesterId}
                  onChangeText={setSemesterId}
                  hint={`Gợi ý: ${selectedSemesterId || 'sem-2025-2026-2'}`}
                />
                <FormField label="Mã học phần" value={classCourseCode} onChangeText={setClassCourseCode} autoCapitalize="characters" />
                <FormField label="Class code" value={classCode} onChangeText={setClassCode} autoCapitalize="characters" />
                <FormField label="Section code" value={sectionCode} onChangeText={setSectionCode} autoCapitalize="characters" />
                <FormField label="Sức chứa" value={capacity} onChangeText={setCapacity} keyboardType="number-pad" />
                <FormField
                  label="Lecturer ID"
                  value={lecturerId}
                  onChangeText={setLecturerId}
                  hint={`Ví dụ: ${(lecturersQuery.data ?? [])[0]?.id ?? 'dán id giảng viên từ danh sách dưới'}`}
                />
                <PrimaryButton
                  label={createClassMutation.isPending ? 'Đang tạo lớp...' : 'Tạo lớp học phần'}
                  onPress={() => createClassMutation.mutate()}
                />
              </View>

              <View style={[styles.card, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                  Cập nhật lịch học
                </Text>
                <FormField label="Class section ID" value={meetingSectionId} onChangeText={setMeetingSectionId} />
                <FormField label="Thứ (1-7)" value={meetingDay} onChangeText={setMeetingDay} keyboardType="number-pad" />
                <FormField label="Bắt đầu" value={meetingStart} onChangeText={setMeetingStart} />
                <FormField label="Kết thúc" value={meetingEnd} onChangeText={setMeetingEnd} />
                <FormField label="Phòng" value={meetingRoom} onChangeText={setMeetingRoom} />
                <PrimaryButton
                  label={replaceMeetingsMutation.isPending ? 'Đang cập nhật...' : 'Ghi lịch học'}
                  onPress={() => replaceMeetingsMutation.mutate()}
                />
              </View>

              <View style={[styles.card, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                  Giảng viên
                </Text>
                {(lecturersQuery.data ?? []).slice(0, 8).map((lecturer) => (
                  <Text key={lecturer.id} style={[styles.itemMeta, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                    {lecturer.fullName} · {lecturer.id}
                  </Text>
                ))}
              </View>

              <View style={[styles.card, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                  Lớp học phần ({sectionsForSemester.length})
                </Text>
                {(sectionsForSemester.length === 0) ? (
                  <Text style={[styles.itemMeta, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                    Chưa có lớp trong học kỳ này.
                  </Text>
                ) : (
                  sectionsForSemester.slice(0, 20).map((section) => (
                    <Pressable
                      key={section.id}
                      accessibilityRole="button"
                      onPress={() => setMeetingSectionId(section.id)}
                      style={[
                        styles.listItem,
                        {
                          backgroundColor: theme.colors.surfaceSubtle,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.itemTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                        {section.course.code} · {section.classCode}
                      </Text>
                      <Text style={[styles.itemMeta, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                        {section.lecturer?.fullName ?? 'Chưa phân công'} · {section.enrolledCount}/{section.capacity}
                      </Text>
                    </Pressable>
                  ))
                )}
              </View>
              <SecondaryButton label="Làm mới dữ liệu" onPress={() => void classSectionsQuery.refetch()} />
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
  skeletonWrap: {
    gap: 10,
  },
  formList: {
    gap: 10,
    paddingBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
  },
  listItem: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  itemTitle: {
    fontSize: 13,
  },
  itemMeta: {
    fontSize: 12,
    lineHeight: 18,
  },
});
