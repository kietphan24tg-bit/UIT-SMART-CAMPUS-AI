import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContentStack, EmptyState, PrimaryButton, Screen, SecondaryButton, SkeletonBlock } from '@/components/ui';
import { attendanceApi, type AttendanceSessionStartResponse } from '@/services/api/attendance';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { formatDateTime, getDayLabel, isLecturerRole } from '@/utils/app';

export default function LecturerAttendanceScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const canManageAttendance = isLecturerRole(role);
  const classSectionsQuery = useQuery({
    queryKey: ['attendance', 'lecturer', 'class-sections'],
    queryFn: attendanceApi.getLecturerClassSections,
    enabled: canManageAttendance,
  });

  const [selectedSectionId, setSelectedSectionId] = React.useState<string>('');
  const [activeSession, setActiveSession] = React.useState<AttendanceSessionStartResponse | null>(null);

  const selectedSection =
    classSectionsQuery.data?.find((item) => item.id === selectedSectionId) ??
    classSectionsQuery.data?.[0] ??
    null;

  React.useEffect(() => {
    if (!classSectionsQuery.data?.length) {
      setSelectedSectionId('');
      return;
    }

    setSelectedSectionId((current) =>
      classSectionsQuery.data?.some((item) => item.id === current)
        ? current
        : classSectionsQuery.data?.[0]?.id ?? '',
    );
  }, [classSectionsQuery.data]);

  const startSessionMutation = useMutation({
    mutationFn: (classSectionId: string) => attendanceApi.startSession(classSectionId, 15),
    onSuccess: (result) => {
      setActiveSession(result);
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'lecturer', 'history'] });
    },
  });

  const stopSessionMutation = useMutation({
    mutationFn: (sessionId: string) => attendanceApi.stopSession(sessionId),
    onSuccess: () => {
      setActiveSession(null);
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'lecturer', 'history'] });
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'lecturer', 'records'] });
    },
  });

  const recordsQuery = useQuery({
    queryKey: ['attendance', 'lecturer', 'records', activeSession?.sessionId],
    queryFn: () => attendanceApi.getSessionRecords(activeSession?.sessionId as string, 1, 100),
    enabled: Boolean(activeSession?.sessionId),
    refetchInterval: activeSession?.sessionId ? 5000 : false,
  });

  const historyQuery = useQuery({
    queryKey: ['attendance', 'lecturer', 'history', selectedSection?.id],
    queryFn: () => attendanceApi.getLecturerHistory(selectedSection?.id as string, 1, 10),
    enabled: canManageAttendance && Boolean(selectedSection?.id),
  });

  if (!canManageAttendance) {
    return (
      <Screen>
        <ContentStack narrow overlapHero={false}>
          <EmptyState
            icon="lock-closed-outline"
            title="Bạn không có quyền truy cập"
            description="Màn hình này chỉ dành cho tài khoản giảng viên."
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
          Quản lý điểm danh QR
        </Text>
        <View style={styles.backHit} />
      </View>

      <ContentStack narrow overlapHero={false}>
        {classSectionsQuery.isLoading ? (
          <View style={styles.skeletonWrap}>
            <SkeletonBlock height={96} />
            <SkeletonBlock height={96} />
          </View>
        ) : null}

        {!classSectionsQuery.isLoading && classSectionsQuery.isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Không tải được danh sách lớp"
            description="Vui lòng thử lại."
            actionLabel="Thử lại"
            onActionPress={() => void classSectionsQuery.refetch()}
          />
        ) : null}

        {!classSectionsQuery.isLoading && !classSectionsQuery.isError && (classSectionsQuery.data?.length ?? 0) === 0 ? (
          <EmptyState
            icon="albums-outline"
            title="Chưa có lớp được phân công"
            description="Bạn chưa được gán lớp học phần nào."
          />
        ) : null}

        {(classSectionsQuery.data?.length ?? 0) > 0 ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.sectionList}>
              {classSectionsQuery.data?.map((section) => {
                const selected = selectedSection?.id === section.id;
                return (
                  <Pressable
                    key={section.id}
                    accessibilityRole="button"
                    onPress={() => setSelectedSectionId(section.id)}
                    style={[
                      styles.sectionCard,
                      {
                        backgroundColor: selected ? theme.colors.primarySurface : theme.colors.surfaceElevated,
                        borderColor: selected ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                      {section.course.code} · {section.classCode}
                    </Text>
                    <Text style={[styles.sectionMeta, { color: theme.colors.textMuted, fontFamily: theme.fonts.medium }]}>
                      {section.course.name} · {section.enrolledCount}/{section.capacity}
                    </Text>
                    <Text style={[styles.sectionMeta, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}>
                      {section.meetings
                        .map((meeting) => `${getDayLabel(meeting.dayOfWeek)} ${meeting.startTime}-${meeting.endTime}`)
                        .join(' | ')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        ) : null}

        {selectedSection ? (
          <View style={[styles.panel, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
            <Text style={[styles.panelTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
              Phiên điểm danh
            </Text>

            {activeSession ? (
              <View style={styles.panelBlock}>
                <Text style={[styles.panelMeta, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                  Bắt đầu: {formatDateTime(activeSession.startedAt)}
                </Text>
                <Text style={[styles.panelMeta, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                  Hết hạn: {formatDateTime(activeSession.expiresAt)}
                </Text>
                <PrimaryButton
                  label="Mở màn hình QR"
                  onPress={() => void Linking.openURL(activeSession.displayUrl)}
                />
                <SecondaryButton
                  label={stopSessionMutation.isPending ? 'Đang dừng phiên...' : 'Dừng phiên'}
                  onPress={() => {
                    if (activeSession?.sessionId) {
                      stopSessionMutation.mutate(activeSession.sessionId);
                    }
                  }}
                />
              </View>
            ) : (
              <PrimaryButton
                label={startSessionMutation.isPending ? 'Đang mở phiên...' : 'Mở phiên QR mới'}
                onPress={() => startSessionMutation.mutate(selectedSection.id)}
              />
            )}

            {activeSession && recordsQuery.data ? (
              <View style={styles.panelBlock}>
                <Text style={[styles.panelTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                  Đã điểm danh ({recordsQuery.data.meta.total})
                </Text>
                {recordsQuery.data.items.slice(0, 6).map((record) => (
                  <Text
                    key={record.id}
                    style={[styles.panelMeta, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}
                  >
                    {record.student.studentId ?? record.student.email} · {formatDateTime(record.checkinTime)}
                  </Text>
                ))}
              </View>
            ) : null}

            {historyQuery.data && historyQuery.data.items.length > 0 ? (
              <View style={styles.panelBlock}>
                <Text style={[styles.panelTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                  Lịch sử phiên gần nhất
                </Text>
                {historyQuery.data.items.slice(0, 5).map((item) => (
                  <Text key={item.id} style={[styles.panelMeta, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                    {formatDateTime(item.startedAt)} · {item.checkedInCount} lượt check-in
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
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
  sectionList: {
    gap: 10,
    paddingBottom: 12,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 15,
  },
  sectionMeta: {
    fontSize: 12,
    lineHeight: 18,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 14,
  },
  panelBlock: {
    gap: 6,
  },
  panelMeta: {
    fontSize: 12,
    lineHeight: 18,
  },
});
