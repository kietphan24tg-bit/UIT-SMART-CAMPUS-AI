import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Linking, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { buildStudentRoster, mapScheduleToAttendanceCards } from '@/app/services/attendance/lecturer-data';
import { ContentStack, EmptyState, PrimaryButton, Screen, SecondaryButton, SkeletonBlock } from '@/components/ui';
import { useScheduleScreenData } from '@/hooks/use-schedule-screen';
import { attendanceApi, type AttendanceSessionStartResponse } from '@/services/api/attendance';
import { useAppTheme } from '@/theme';
import { formatDateTime, getDayLabel } from '@/utils/app';

type AttendanceWorkspaceTab = 'attendance' | 'students' | 'history' | 'stats';

type AttendanceWorkspaceSession = {
  sessionId: string;
  startedAt: string;
  expiresAt: string;
  status: 'active' | 'closed' | 'expired';
  displayKey?: string | null;
  displayUrl?: string | null;
};

type AttendanceSessionState = {
  classSectionId: string;
  session: AttendanceWorkspaceSession;
};

const WORKSPACE_TABS: Array<{
  key: AttendanceWorkspaceTab;
  label: string;
}> = [
  { key: 'attendance', label: 'Điểm danh' },
  { key: 'students', label: 'Sinh viên' },
  { key: 'history', label: 'Lịch sử' },
  { key: 'stats', label: 'Thống kê' },
];

function getRoomLabel(room?: string | null) {
  return room ? `Phòng ${room}` : 'Chưa cập nhật phòng';
}

function getStatusToneColor({
  status,
  theme,
}: {
  status: 'present' | 'absent' | 'pending';
  theme: ReturnType<typeof useAppTheme>;
}) {
  switch (status) {
    case 'present':
      return {
        fill: theme.colors.successSurface,
        text: theme.colors.success,
        label: 'Có mặt',
      };
    case 'absent':
      return {
        fill: theme.colors.dangerSurface,
        text: theme.colors.danger,
        label: 'Vắng',
      };
    default:
      return {
        fill: theme.colors.warningSurface,
        text: theme.colors.warning,
        label: 'Chưa điểm danh',
      };
  }
}

function getAttendanceStats({
  expected,
  checkedIn,
}: {
  expected: number;
  checkedIn: number;
}) {
  const attendanceRate = expected > 0 ? Math.round((checkedIn / expected) * 100) : 0;
  const absentCount = Math.max(expected - checkedIn, 0);
  return {
    attendanceRate,
    averageCheckin: checkedIn,
    absentCount,
    repeatedLate: Math.max(Math.round(absentCount / 3), 0),
  };
}

function formatHistoryDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function formatHistoryTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function mapStartResponseToSession(
  session: AttendanceSessionStartResponse,
): AttendanceWorkspaceSession {
  return {
    sessionId: session.sessionId,
    startedAt: session.startedAt,
    expiresAt: session.expiresAt,
    status: session.status,
    displayKey: session.displayKey,
    displayUrl: session.displayUrl,
  };
}

function WorkspaceTabBar({
  activeTab,
  onChange,
}: {
  activeTab: AttendanceWorkspaceTab;
  onChange: (tab: AttendanceWorkspaceTab) => void;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {WORKSPACE_TABS.map((tab) => {
        const isActive = tab.key === activeTab;

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(tab.key)}
            style={[
              styles.tabButton,
              {
                backgroundColor: isActive ? theme.colors.primary : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive ? theme.colors.onPrimary : theme.colors.textMuted,
                  fontFamily: isActive ? theme.fonts.semibold : theme.fonts.medium,
                },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MetricTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.metricTile,
        {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.metricValue, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
        {value}
      </Text>
      <Text style={[styles.metricLabel, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}>
        {label}
      </Text>
    </View>
  );
}

export default function LecturerAttendanceClassDetailScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ scheduleId?: string }>();
  const scheduleState = useScheduleScreenData();
  const [activeTab, setActiveTab] = React.useState<AttendanceWorkspaceTab>('attendance');
  const [studentQuery, setStudentQuery] = React.useState('');
  const [sessionState, setSessionState] = React.useState<AttendanceSessionState | null>(null);
  const [exportingSessionId, setExportingSessionId] = React.useState<string | null>(null);
  const [isExportingSummary, setIsExportingSummary] = React.useState(false);

  const classSectionsQuery = useQuery({
    queryKey: ['attendance', 'lecturer', 'class-sections'],
    queryFn: attendanceApi.getLecturerClassSections,
  });

  const scheduleCards = React.useMemo(
    () => mapScheduleToAttendanceCards(scheduleState.schedule, classSectionsQuery.data ?? []),
    [classSectionsQuery.data, scheduleState.schedule],
  );

  const selectedCard =
    scheduleCards.find((item) => item.id === params.scheduleId) ?? null;
  const selectedSection = selectedCard?.attendanceSection ?? null;
  const sessionSummaryQuery = useQuery({
    queryKey: ['attendance', 'lecturer', 'session-summary', selectedSection?.id],
    queryFn: () => attendanceApi.getClassSectionSessionSummary(selectedSection?.id as string),
    enabled: Boolean(selectedSection?.id),
    refetchInterval: selectedSection?.id ? 5000 : false,
  });

  const localSession =
    selectedSection?.id === sessionState?.classSectionId ? sessionState?.session ?? null : null;
  const summaryActiveSession = React.useMemo(() => {
    if (sessionSummaryQuery.data?.latestSession?.status !== 'active') {
      return null;
    }

    return {
      sessionId: sessionSummaryQuery.data.latestSession.id,
      startedAt: sessionSummaryQuery.data.latestSession.startedAt,
      expiresAt: sessionSummaryQuery.data.latestSession.expiresAt,
      status: sessionSummaryQuery.data.latestSession.status,
      displayKey: null,
      displayUrl: null,
    } satisfies AttendanceWorkspaceSession;
  }, [sessionSummaryQuery.data?.latestSession]);
  const activeSession =
    localSession?.status === 'active'
      ? summaryActiveSession && summaryActiveSession.sessionId === localSession.sessionId
        ? { ...localSession, ...summaryActiveSession }
        : localSession
      : summaryActiveSession;

  React.useEffect(() => {
    if (!selectedSection?.id) {
      return;
    }

    if (summaryActiveSession) {
      setSessionState((current) => {
        if (
          current?.classSectionId === selectedSection.id &&
          current.session.sessionId === summaryActiveSession.sessionId
        ) {
          return {
            classSectionId: current.classSectionId,
            session: {
              ...current.session,
              startedAt: summaryActiveSession.startedAt,
              expiresAt: summaryActiveSession.expiresAt,
              status: summaryActiveSession.status,
            },
          };
        }

        return {
          classSectionId: selectedSection.id,
          session: summaryActiveSession,
        };
      });
      return;
    }

    setSessionState((current) => {
      if (current?.classSectionId === selectedSection.id && current.session.status === 'active') {
        return null;
      }
      return current;
    });
  }, [selectedSection?.id, summaryActiveSession]);

  const startSessionMutation = useMutation({
    mutationFn: (classSectionId: string) => attendanceApi.startSession(classSectionId, 15),
    onSuccess: (result, classSectionId) => {
      setSessionState({ classSectionId, session: mapStartResponseToSession(result) });
      setActiveTab('attendance');
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'lecturer', 'history'] });
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'lecturer', 'session-summary'] });
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'lecturer', 'records'] });
    },
  });

  const stopSessionMutation = useMutation({
    mutationFn: (sessionId: string) => attendanceApi.stopSession(sessionId),
    onSuccess: () => {
      setSessionState((current) => (current?.classSectionId === selectedSection?.id ? null : current));
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'lecturer', 'history'] });
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'lecturer', 'session-summary'] });
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
    enabled: Boolean(selectedSection?.id),
  });

  const studentsQuery = useQuery({
    queryKey: ['attendance', 'lecturer', 'students', selectedSection?.id],
    queryFn: () => attendanceApi.getClassSectionStudents(selectedSection?.id as string),
    enabled: Boolean(selectedSection?.id),
  });

  const roster = React.useMemo(
    () =>
      buildStudentRoster({
        students: studentsQuery.data ?? [],
        records: recordsQuery.data?.items,
        hasActiveSession: Boolean(activeSession?.sessionId),
      }),
    [activeSession?.sessionId, recordsQuery.data?.items, studentsQuery.data],
  );

  const filteredRoster = React.useMemo(() => {
    const normalizedQuery = studentQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return roster;
    }

    return roster.filter(
      (item) =>
        item.studentId.toLowerCase().includes(normalizedQuery) ||
        item.fullName.toLowerCase().includes(normalizedQuery),
    );
  }, [roster, studentQuery]);

  const stats = getAttendanceStats({
    expected: selectedSection?.enrolledCount ?? 0,
    checkedIn: recordsQuery.data?.meta.total ?? 0,
  });

  const showLoading = scheduleState.isLoading || classSectionsQuery.isLoading;
  const hasClassSectionError = classSectionsQuery.isError;

  const handleExportSession = React.useCallback(
    async (sessionId: string) => {
      try {
        const sharingAvailable = await Sharing.isAvailableAsync();
        if (!sharingAvailable) {
          Alert.alert('Xuất Excel', 'Thiết bị hiện tại không hỗ trợ chia sẻ file.');
          return;
        }

        const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
        if (!baseDir) {
          Alert.alert('Xuất Excel', 'Không tìm được thư mục tạm để tạo file Excel.');
          return;
        }

        setExportingSessionId(sessionId);
        const fileUri = `${baseDir}attendance-session-${sessionId}.xlsx`;
        await attendanceApi.exportSessionExcel(sessionId, fileUri);
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Chia sẻ file Excel điểm danh',
          UTI: 'org.openxmlformats.spreadsheetml.sheet',
        });
      } catch (error) {
        const message =
          error instanceof Error && error.message.trim()
            ? error.message
            : 'Không thể tạo hoặc chia sẻ file Excel.';
        Alert.alert('Xuất Excel thất bại', message);
      } finally {
        setExportingSessionId(null);
      }
    },
    [],
  );

  const handleExportSummary = React.useCallback(async () => {
    if (!selectedSection?.id) {
      Alert.alert('Xuất Excel', 'Chưa tìm được lớp attendance để xuất báo cáo tổng hợp.');
      return;
    }

    try {
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (!sharingAvailable) {
        Alert.alert('Xuất Excel', 'Thiết bị hiện tại không hỗ trợ chia sẻ file.');
        return;
      }

      const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!baseDir) {
        Alert.alert('Xuất Excel', 'Không tìm được thư mục tạm để tạo file Excel.');
        return;
      }

      setIsExportingSummary(true);
      const fileUri = `${baseDir}attendance-class-summary-${selectedSection.id}.xlsx`;
      await attendanceApi.exportClassSectionSummaryExcel(selectedSection.id, fileUri);
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Chia sẻ file Excel tổng hợp điểm danh',
        UTI: 'org.openxmlformats.spreadsheetml.sheet',
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : 'Không thể tạo hoặc chia sẻ file Excel tổng hợp.';
      Alert.alert('Xuất Excel thất bại', message);
    } finally {
      setIsExportingSummary(false);
    }
  }, [selectedSection?.id]);

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
          Chi tiết điểm danh
        </Text>
        <View style={styles.backHit} />
      </View>

      <ContentStack narrow overlapHero={false}>
        {showLoading ? (
          <View style={styles.skeletonWrap}>
            <SkeletonBlock height={120} />
            <SkeletonBlock height={170} />
            <SkeletonBlock height={280} />
          </View>
        ) : null}

        {!showLoading && !selectedCard ? (
          <EmptyState
            icon="albums-outline"
            title="Không tìm thấy lớp học"
            description="Buổi học này không còn trong danh sách lịch hiện tại."
            actionLabel="Quay lại danh sách lớp"
            onActionPress={() => router.replace('/services/attendance/lecturer' as never)}
          />
        ) : null}

        {!showLoading && selectedCard ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.screenStack}>
              <View
                style={[
                  styles.heroPanel,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text style={[styles.heroCode, { color: theme.colors.primary, fontFamily: theme.fonts.semibold }]}>
                  {selectedCard.course.code} · {selectedCard.classCode}
                </Text>
                <Text style={[styles.heroTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                  {selectedCard.course.name}
                </Text>
                <Text style={[styles.heroMeta, { color: theme.colors.textMuted, fontFamily: theme.fonts.medium }]}>
                  {getDayLabel(selectedCard.dayOfWeek)} · {selectedCard.startTime} - {selectedCard.endTime} ·{' '}
                  {getRoomLabel(selectedCard.room)}
                </Text>
              </View>

              <View
                style={[
                  styles.sessionPanel,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text style={[styles.panelTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                  Phiên điểm danh QR
                </Text>

                {hasClassSectionError ? (
                  <View
                    style={[
                      styles.callout,
                      {
                        backgroundColor: theme.colors.warningSurface,
                        borderColor: theme.colors.warning,
                      },
                    ]}
                  >
                    <Text style={[styles.calloutTitle, { color: theme.colors.warning, fontFamily: theme.fonts.semibold }]}>
                      Không đồng bộ được dữ liệu điểm danh
                    </Text>
                    <Text style={[styles.calloutBody, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                      Màn này đang hiển thị theo lịch mock. Tạm thời chưa thể mở phiên QR từ API.
                    </Text>
                  </View>
                ) : null}

                {!hasClassSectionError && !selectedSection ? (
                  <View
                    style={[
                      styles.callout,
                      {
                        backgroundColor: theme.colors.dangerSurface,
                        borderColor: theme.colors.danger,
                      },
                    ]}
                  >
                    <Text style={[styles.calloutTitle, { color: theme.colors.danger, fontFamily: theme.fonts.semibold }]}>
                      Chưa liên kết dữ liệu điểm danh
                    </Text>
                    <Text style={[styles.calloutBody, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                      Buổi học này chưa match được với lớp attendance hiện có nên chưa thể tạo phiên.
                    </Text>
                  </View>
                ) : null}

                <Text style={[styles.sessionStatus, { color: theme.colors.textMuted, fontFamily: theme.fonts.medium }]}>
                  {activeSession ? 'Trạng thái: Đang mở' : 'Chưa có phiên đang mở'}
                </Text>

                {activeSession ? (
                  <View style={styles.sessionActionStack}>
                    <Text style={[styles.sessionMeta, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                      Bắt đầu: {formatDateTime(activeSession.startedAt)}
                    </Text>
                    <Text style={[styles.sessionMeta, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                      Hết hạn: {formatDateTime(activeSession.expiresAt)}
                    </Text>
                    <View style={styles.actionRow}>
                      {activeSession.displayUrl ? (
                        <PrimaryButton
                          label="Mở màn hình QR"
                          onPress={() => void Linking.openURL(activeSession.displayUrl as string)}
                          style={styles.flexAction}
                        />
                      ) : null}
                      <SecondaryButton
                        label={stopSessionMutation.isPending ? 'Đang dừng...' : 'Dừng phiên'}
                        onPress={() => stopSessionMutation.mutate(activeSession.sessionId)}
                        style={activeSession.displayUrl ? styles.flexAction : undefined}
                      />
                    </View>
                    {!activeSession.displayUrl ? (
                      <Text style={[styles.sessionMeta, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}>
                        Phiên đang mở được khôi phục từ máy chủ. Cần tạo phiên mới để lấy lại liên kết màn hình QR.
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <PrimaryButton
                    label={startSessionMutation.isPending ? 'Đang tạo điểm danh...' : 'Tạo điểm danh QR'}
                    disabled={!selectedSection || hasClassSectionError}
                    onPress={() => {
                      if (selectedSection?.id) {
                        startSessionMutation.mutate(selectedSection.id);
                      }
                    }}
                  />
                )}
              </View>

              <WorkspaceTabBar activeTab={activeTab} onChange={setActiveTab} />

              {activeTab === 'attendance' ? (
                <View
                  style={[
                    styles.contentPanel,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.panelTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                      Check-in gần nhất
                    </Text>
                    <Text style={[styles.sectionMetaText, { color: theme.colors.primary, fontFamily: theme.fonts.semibold }]}>
                      {recordsQuery.data?.meta.total ?? 0}/{selectedSection?.enrolledCount ?? 0}
                    </Text>
                  </View>

                  {recordsQuery.isLoading ? (
                    <SkeletonBlock height={180} />
                  ) : recordsQuery.data?.items.length ? (
                    <View style={styles.listStack}>
                      {recordsQuery.data.items.slice(0, 8).map((record) => (
                        <View
                          key={record.id}
                          style={[
                            styles.rowItem,
                            {
                              backgroundColor: theme.colors.surfaceSubtle,
                              borderColor: theme.colors.border,
                            },
                          ]}
                        >
                          <View style={styles.rowText}>
                            <Text style={[styles.rowPrimary, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                              {record.student.studentId ?? record.student.email}
                            </Text>
                            <Text style={[styles.rowSecondary, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                              {[record.student.lastName, record.student.firstName].filter(Boolean).join(' ')}
                            </Text>
                          </View>
                          <Text style={[styles.rowTrailing, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}>
                            {formatDateTime(record.checkinTime)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <EmptyState
                      icon="qr-code-outline"
                      title="Chưa có lượt check-in"
                      description="Các lượt điểm danh sẽ xuất hiện sau khi sinh viên quét mã QR."
                    />
                  )}
                </View>
              ) : null}

              {activeTab === 'students' ? (
                <View
                  style={[
                    styles.contentPanel,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.panelTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                    Danh sách sinh viên
                  </Text>
                  <Text style={[styles.helperText, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}>
                    Danh sách lấy từ sinh viên đã enroll trong lớp. Trạng thái điểm danh sẽ cập nhật theo phiên đang mở.
                  </Text>
                  <TextInput
                    value={studentQuery}
                    onChangeText={setStudentQuery}
                    placeholder="Tìm sinh viên..."
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

                  <View style={styles.listStack}>
                    {studentsQuery.isLoading ? <SkeletonBlock height={220} /> : null}
                    {!studentsQuery.isLoading && filteredRoster.length === 0 ? (
                      <EmptyState
                        icon="people-outline"
                        title="Chưa có dữ liệu sinh viên"
                        description={
                          studentsQuery.isError
                            ? 'Không tải được danh sách sinh viên của lớp này.'
                            : studentQuery.trim()
                              ? 'Không tìm thấy sinh viên phù hợp với từ khóa đang nhập.'
                              : 'Lớp này hiện chưa có sinh viên enroll hoặc đang bị map sai sang lớp attendance khác.'
                        }
                      />
                    ) : null}
                    {!studentsQuery.isLoading && filteredRoster.slice(0, 20).map((item) => {
                      const tone = getStatusToneColor({ status: item.status, theme });

                      return (
                        <View
                          key={item.id}
                          style={[
                            styles.rowItem,
                            {
                              backgroundColor: theme.colors.surfaceSubtle,
                              borderColor: theme.colors.border,
                            },
                          ]}
                        >
                          <View style={styles.rowText}>
                            <Text style={[styles.rowPrimary, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                              {item.studentId}
                            </Text>
                            <Text style={[styles.rowSecondary, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                              {item.fullName}
                            </Text>
                          </View>
                          <View style={[styles.statusPill, { backgroundColor: tone.fill }]}>
                            <Text style={[styles.statusPillText, { color: tone.text, fontFamily: theme.fonts.semibold }]}>
                              {tone.label}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {activeTab === 'history' ? (
                <View
                  style={[
                    styles.contentPanel,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.panelTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                      Lịch sử điểm danh
                    </Text>
                    <SecondaryButton
                      label={isExportingSummary ? 'Đang tạo...' : 'Tổng hợp'}
                      loading={isExportingSummary}
                      disabled={!selectedSection?.id}
                      onPress={() => void handleExportSummary()}
                      style={styles.historySummaryButton}
                      icon={!isExportingSummary ? <Ionicons name="download-outline" size={16} color={theme.colors.primary} /> : undefined}
                    />
                  </View>

                  {historyQuery.data?.items.length ? (
                    <View style={styles.listStack}>
                      {historyQuery.data.items.map((item) => (
                        <View
                          key={item.id}
                          style={[
                            styles.historyCard,
                            {
                              backgroundColor: theme.colors.surfaceSubtle,
                              borderColor: theme.colors.border,
                            },
                          ]}
                        >
                          <View style={styles.historyInfoGrid}>
                            <View
                              style={[
                                styles.historyInfoItem,
                                {
                                  backgroundColor: theme.colors.surfaceElevated,
                                  borderColor: theme.colors.border,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.historyInfoLabel,
                                  { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
                                ]}
                              >
                                Ngày
                              </Text>
                              <Text
                                style={[
                                  styles.historyInfoValue,
                                  { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                                ]}
                              >
                                {formatHistoryDate(item.startedAt)}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.historyInfoItem,
                                {
                                  backgroundColor: theme.colors.surfaceElevated,
                                  borderColor: theme.colors.border,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.historyInfoLabel,
                                  { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
                                ]}
                              >
                                Bắt đầu
                              </Text>
                              <Text
                                style={[
                                  styles.historyInfoValue,
                                  { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                                ]}
                              >
                                {formatHistoryTime(item.startedAt)}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.historyInfoItem,
                                {
                                  backgroundColor: theme.colors.surfaceElevated,
                                  borderColor: theme.colors.border,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.historyInfoLabel,
                                  { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
                                ]}
                              >
                                Kết thúc
                              </Text>
                              <Text
                                style={[
                                  styles.historyInfoValue,
                                  { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                                ]}
                              >
                                {formatHistoryTime(item.expiresAt)}
                              </Text>
                            </View>
                          </View>
                          <SecondaryButton
                            label={exportingSessionId === item.id ? 'Đang tạo file...' : 'Xuất Excel'}
                            loading={exportingSessionId === item.id}
                            disabled={!item.id || Boolean(exportingSessionId && exportingSessionId !== item.id)}
                            onPress={() => void handleExportSession(item.id)}
                          />
                        </View>
                      ))}
                    </View>
                  ) : (
                    <EmptyState
                      icon="time-outline"
                      title="Chưa có lịch sử điểm danh"
                      description="Phiên đã tạo và đã đóng sẽ xuất hiện tại đây."
                    />
                  )}
                </View>
              ) : null}

              {activeTab === 'stats' ? (
                <View
                  style={[
                    styles.contentPanel,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.panelTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                    Thống kê
                  </Text>

                  <View style={styles.metricGrid}>
                    <MetricTile label="Tỷ lệ hiện diện" value={`${stats.attendanceRate}%`} />
                    <MetricTile label="Đã check-in" value={`${recordsQuery.data?.meta.total ?? 0}`} />
                    <MetricTile label="Vắng" value={`${stats.absentCount}`} />
                    <MetricTile label="Trễ nhiều" value={`${stats.repeatedLate}`} />
                  </View>

                  <View
                    style={[
                      styles.chartPanel,
                      {
                        backgroundColor: theme.colors.surfaceSubtle,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chartTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                      Mức độ hiện diện theo buổi
                    </Text>
                    <View style={styles.barRow}>
                      <View style={styles.barLabelBlock}>
                        <Text style={[styles.barLabel, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}>
                          Hiện diện
                        </Text>
                      </View>
                      <View style={[styles.barTrack, { backgroundColor: theme.colors.primarySurface }]}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${stats.attendanceRate}%`,
                              backgroundColor: theme.colors.primary,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <View style={styles.barRow}>
                      <View style={styles.barLabelBlock}>
                        <Text style={[styles.barLabel, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}>
                          Vắng
                        </Text>
                      </View>
                      <View style={[styles.barTrack, { backgroundColor: theme.colors.dangerSurface }]}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${Math.max(100 - stats.attendanceRate, 6)}%`,
                              backgroundColor: theme.colors.danger,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              ) : null}
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
    gap: 12,
  },
  screenStack: {
    gap: 14,
    paddingBottom: 16,
  },
  heroPanel: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 6,
  },
  heroCode: {
    fontSize: 13,
    lineHeight: 18,
  },
  heroTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  heroMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  sessionPanel: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 12,
  },
  panelTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  sessionStatus: {
    fontSize: 13,
    lineHeight: 18,
  },
  sessionActionStack: {
    gap: 8,
  },
  sessionMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  flexAction: {
    flex: 1,
    minWidth: 140,
  },
  callout: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  calloutTitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  calloutBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  tabBar: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tabButton: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tabLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  contentPanel: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionMetaText: {
    fontSize: 14,
    lineHeight: 20,
  },
  historySummaryButton: {
    minHeight: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
  },
  searchInput: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  listStack: {
    gap: 10,
  },
  rowItem: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowPrimary: {
    fontSize: 14,
    lineHeight: 20,
  },
  rowSecondary: {
    fontSize: 13,
    lineHeight: 18,
  },
  rowTrailing: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'right',
    maxWidth: 96,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 12,
    lineHeight: 16,
  },
  historyCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  historyInfoGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  historyInfoItem: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  historyInfoLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  historyInfoValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricTile: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  metricValue: {
    fontSize: 20,
    lineHeight: 26,
  },
  metricLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  chartPanel: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  chartTitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barLabelBlock: {
    width: 64,
  },
  barLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  barTrack: {
    flex: 1,
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
});
