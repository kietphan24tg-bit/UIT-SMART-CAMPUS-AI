import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { MetricGrid } from '@/components/tasks';
import {
  ContentStack,
  EmptyState,
  InfoRow,
  Screen,
  SectionCard,
  StatusBadge,
  TopHero,
} from '@/components/ui';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useOperationsScreenData, useScheduleScreenData } from '@/hooks/use-schedule-screen';
// import { useAuthStore } from '@/stores/auth-store';
import { useEffectiveRole } from '@/hooks/use-effective-role';
import { useAppTheme } from '@/theme';
import type { FireAlertRecord, ScheduleRecord, SemesterRecord } from '@/types/app-data';
import {
  formatDateTime,
  getDayLabel,
  getDayLabelShort,
  getNextClass,
  getRoleLabel,
  getTelemetryHealthLabel,
  getTodayDayOfWeek,
  groupScheduleByDay,
  isAdminRole,
  isLecturerRole,
} from '@/utils/app';

function getScheduleRoomLabel(room?: string | null) {
  return room ? `Phòng ${room}` : 'Chưa cập nhật';
}

function getScheduleInstructorLabel(instructor?: string | null) {
  return instructor ?? 'Chưa cập nhật';
}

function getClassMetaText(item: ScheduleRecord) {
  return `${item.classCode} · ${getScheduleRoomLabel(item.room)}`;
}

function getPeriodText(item: ScheduleRecord) {
  if (typeof item.startPeriod === 'number' && typeof item.endPeriod === 'number') {
    return `Tiết ${item.startPeriod}-${item.endPeriod}`;
  }

  return 'Chưa có tiết';
}

type ScheduleAccent = {
  accent: string;
  surface: string;
};

type SemesterVisual = {
  borderColor: string;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  opacity: number;
  statusColor: string;
  surface: string;
  titleColor: string;
};

const SUBJECT_COLOR_PALETTE = [
  {
    accent: '#2563EB',
    darkAccent: '#93C5FD',
    surface: '#EAF2FF',
    darkSurface: 'rgba(147, 197, 253, 0.16)',
  },
  {
    accent: '#0F766E',
    darkAccent: '#5EEAD4',
    surface: '#E6FFFA',
    darkSurface: 'rgba(94, 234, 212, 0.14)',
  },
  {
    accent: '#4F46E5',
    darkAccent: '#A5B4FC',
    surface: '#EEF2FF',
    darkSurface: 'rgba(165, 180, 252, 0.14)',
  },
  {
    accent: '#0284C7',
    darkAccent: '#7DD3FC',
    surface: '#E0F2FE',
    darkSurface: 'rgba(125, 211, 252, 0.14)',
  },
  {
    accent: '#7C3AED',
    darkAccent: '#C4B5FD',
    surface: '#F3E8FF',
    darkSurface: 'rgba(196, 181, 253, 0.13)',
  },
  {
    accent: '#0891B2',
    darkAccent: '#67E8F9',
    surface: '#ECFEFF',
    darkSurface: 'rgba(103, 232, 249, 0.13)',
  },
  {
    accent: '#64748B',
    darkAccent: '#CBD5E1',
    surface: '#F1F5F9',
    darkSurface: 'rgba(203, 213, 225, 0.12)',
  },
] as const;

function getSemesterVisualState(
  semester: Pick<SemesterRecord, 'isCurrent' | 'startDate'>,
  now = new Date(),
) {
  if (semester.isCurrent) {
    return 'current';
  }

  const startTime = Date.parse(semester.startDate);
  if (Number.isFinite(startTime) && startTime > now.getTime()) {
    return 'future';
  }

  return 'finished';
}

function getSemesterStatusText(semester: SemesterRecord) {
  const visualState = getSemesterVisualState(semester);
  if (visualState === 'current') {
    return 'Đang học';
  }

  return visualState === 'future' ? 'Sắp tới' : 'Đã kết thúc';
}

export function getSemesterColorByStatus(
  theme: ReturnType<typeof useAppTheme>,
  semester: SemesterRecord,
): SemesterVisual {
  const visualState = getSemesterVisualState(semester);

  if (visualState === 'current') {
    return {
      borderColor: theme.colors.primary,
      borderStyle: 'solid',
      opacity: 1,
      statusColor: theme.colors.primary,
      surface: theme.colors.primarySurface,
      titleColor: theme.colors.primary,
    };
  }

  if (visualState === 'future') {
    return {
      borderColor: theme.colors.info,
      borderStyle: 'dashed',
      opacity: 0.82,
      statusColor: theme.colors.textMuted,
      surface: theme.colors.infoSurface,
      titleColor: theme.colors.info,
    };
  }

  return {
    borderColor: theme.colors.border,
    borderStyle: 'solid',
    opacity: 0.92,
    statusColor: theme.colors.textMuted,
    surface: theme.colors.surfaceSubtle,
    titleColor: theme.colors.textSoft,
  };
}

function getSubjectKey(item: ScheduleRecord) {
  return item.course.code.trim() || item.classCode.trim() || item.course.name.trim();
}

export function buildSubjectColorIndex(schedule: ScheduleRecord[]) {
  const subjectCodes = Array.from(new Set(schedule.map(getSubjectKey))).sort((left, right) =>
    left.localeCompare(right),
  );

  return new Map(subjectCodes.map((code, index) => [code, index]));
}

function getFallbackSubjectIndex(subjectCode: string) {
  return Array.from(subjectCode).reduce((total, char) => total + char.charCodeAt(0), 0);
}

export function getSubjectColorByCode(
  theme: ReturnType<typeof useAppTheme>,
  subjectCode: string,
  subjectColorIndex: Map<string, number>,
): ScheduleAccent {
  const paletteIndex =
    subjectColorIndex.get(subjectCode.trim()) ?? getFallbackSubjectIndex(subjectCode);
  const palette = SUBJECT_COLOR_PALETTE[paletteIndex % SUBJECT_COLOR_PALETTE.length];

  return {
    accent: theme.isDark ? palette.darkAccent : palette.accent,
    surface: theme.isDark ? palette.darkSurface : palette.surface,
  };
}

function getNextOccurrence(item: ScheduleRecord) {
  const now = new Date();
  const jsDay = now.getDay();
  const today = jsDay === 0 ? 7 : jsDay;
  const delta = (item.dayOfWeek + 7 - today) % 7;
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + delta);
  return date;
}

export default function ScheduleScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const router = useRouter();
  // const role = useAuthStore((state) => state.user?.role);
  const role = useEffectiveRole();
  // Bypass role-scoped operations view for local demo/testing. Restore this line to show operations for admin roles again.
  // const isOperationsRole = isAdminRole(role);
  const isOperationsRole = false && isAdminRole(role);
  const isLecturer = isLecturerRole(role);
  const scheduleState = useScheduleScreenData();
  const operationsState = useOperationsScreenData();

  if (isOperationsRole) {
    const parking = operationsState.data?.parking ?? null;
    const telemetry = operationsState.data?.telemetry ?? null;
    const fireAlerts = operationsState.data?.fireAlerts.items ?? [];
    const openFireAlerts = fireAlerts.filter((item: FireAlertRecord) => !item.isResolved).length;
    const healthTone = telemetry?.fireDetected
      ? 'danger'
      : telemetry?.reportedAt
        ? 'success'
        : parking?.lastUpdated
          ? 'warning'
          : 'info';

    const metrics = [
      {
        label: 'Chỗ trống',
        value: parking ? `${parking.availableSlots}/${parking.totalSlots}` : '--',
        helper: 'Bãi A1-A2',
        tone: 'success' as const,
      },
      {
        label: 'Phiên mở',
        value: `${parking?.activeSessions ?? 0}`,
        helper: 'Giao dịch hiện tại',
        tone: 'info' as const,
      },
      {
        label: 'Cảnh báo',
        value: `${openFireAlerts}`,
        helper: 'Fire alert chưa xử lý',
        tone: 'danger' as const,
      },
      {
        label: 'Chưa đọc',
        value: `${operationsState.data?.unreadCount ?? 0}`,
        helper: 'Thông báo hệ thống',
        tone: 'warning' as const,
      },
    ];

    return (
      <Screen
        refreshControl={
          <RefreshControl
            refreshing={operationsState.isRefetching}
            onRefresh={() => void operationsState.refetch()}
            tintColor={theme.colors.primary}
          />
        }
      >
        <TopHero
          eyebrow="Vận hành"
          title={role === 'super_admin' ? 'Trung tâm vận hành' : 'Điều phối campus'}
          subtitle="Parking, telemetry và cảnh báo cháy."
          badge={{ label: getRoleLabel(role), tone: 'info' }}
          showBrand
        />

        <ContentStack>
          <MetricGrid
            items={metrics}
            compactColumns={2}
            cardMinHeight={112}
            layoutPreset="mobileTwoByTwo"
          />

          <SectionCard
            title="Lối vào vận hành"
            subtitle="Tác vụ chính."
            variant="highlight"
            tone="academic"
          >
            <View style={styles.column}>
              <NavigationRow
                icon="flame-outline"
                label="Fire alert"
                description="Mở danh sách cảnh báo."
                badgeLabel="Đang hỗ trợ"
                badgeTone="success"
                onPress={() => router.push('/operations/fire-alerts')}
              />
              <NavigationRow
                icon="car-sport-outline"
                label="Parking + IoT"
                description="Theo dõi bãi xe và slot."
                badgeLabel="Đang hỗ trợ"
                badgeTone="success"
                onPress={() => router.push('/operations/parking-ops')}
              />
              <NavigationRow
                icon="notifications-outline"
                label="Broadcast"
                description="Chuẩn bị gửi thông báo."
                badgeLabel="Sắp triển khai"
                badgeTone="info"
                onPress={() => router.push('/operations/notifications')}
              />
              {role === 'super_admin' ? (
                <NavigationRow
                  icon="settings-outline"
                  label="Hệ thống"
                  description="Cấu hình nội bộ."
                  badgeLabel="Sắp triển khai"
                  badgeTone="info"
                  onPress={() => router.push('/settings/system-controls')}
                />
              ) : null}
            </View>
          </SectionCard>

          <SectionCard
            title="Parking hiện tại"
            subtitle="Tóm tắt bãi xe."
            variant="glass"
            tone="telemetry"
          >
            {parking ? (
              <View style={styles.column}>
                <View
                  style={[styles.rowBetween, layout.isCompact ? styles.rowBetweenStacked : null]}
                >
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                    ]}
                  >
                    {parking.availableSlots}/{parking.totalSlots} chỗ trống
                  </Text>
                  <StatusBadge
                    label={getTelemetryHealthLabel(
                      telemetry?.fireDetected
                        ? 'fire-alert'
                        : parking.lastUpdated
                          ? 'online'
                          : 'no-data',
                    )}
                    tone={healthTone}
                  />
                </View>
                <View style={styles.infoGrid}>
                  <InfoRow label="Cổng" value={parking.gateId} />
                  <InfoRow label="Cập nhật" value={formatDateTime(parking.lastUpdated)} />
                  <InfoRow label="IP thiết bị" value={parking.sensors.deviceIp ?? '--'} />
                </View>
                <View style={styles.badgeRow}>
                  <StatusBadge
                    label={
                      typeof parking.sensors.temperature === 'number'
                        ? `Nhiệt độ ${parking.sensors.temperature}°C`
                        : 'Nhiệt độ --'
                    }
                    tone="info"
                    size="sm"
                  />
                  <StatusBadge
                    label={
                      typeof parking.sensors.humidity === 'number'
                        ? `Độ ẩm ${parking.sensors.humidity}%`
                        : 'Độ ẩm --'
                    }
                    tone="success"
                    size="sm"
                  />
                  <StatusBadge
                    label={parking.sensors.rainDetected ? 'Có mưa' : 'Khô ráo'}
                    tone="warning"
                    size="sm"
                  />
                  <StatusBadge
                    label={parking.sensors.fireDetected ? 'Cảnh báo cháy' : 'An toàn'}
                    tone={parking.sensors.fireDetected ? 'danger' : 'success'}
                    size="sm"
                  />
                </View>
              </View>
            ) : (
              <EmptyState
                icon="car-outline"
                title="Chưa có dữ liệu"
                description="Tải lại để cập nhật parking."
              />
            )}
          </SectionCard>

          <SectionCard
            title="Telemetry mới nhất"
            subtitle="Dữ liệu cảm biến gần nhất."
            variant="outlined"
          >
            {telemetry ? (
              <View style={styles.column}>
                <View
                  style={[styles.rowBetween, layout.isCompact ? styles.rowBetweenStacked : null]}
                >
                  <StatusBadge
                    label={telemetry.fireDetected ? 'Cảnh báo cháy' : 'Thiết bị đang gửi dữ liệu'}
                    tone={telemetry.fireDetected ? 'danger' : 'success'}
                  />
                  <Text
                    style={[
                      styles.metaText,
                      { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                    ]}
                  >
                    {formatDateTime(telemetry.reportedAt)}
                  </Text>
                </View>
                <View style={styles.infoGrid}>
                  <InfoRow label="Gateway" value={telemetry.gateId} />
                  <InfoRow label="IP thiết bị" value={telemetry.deviceIp ?? '--'} />
                </View>
                <View style={styles.badgeRow}>
                  <StatusBadge
                    label={`Nhiệt độ ${telemetry.temperature ?? '--'}°C`}
                    tone="info"
                    size="sm"
                  />
                  <StatusBadge
                    label={`Độ ẩm ${telemetry.humidity ?? '--'}%`}
                    tone="success"
                    size="sm"
                  />
                  <StatusBadge
                    label={telemetry.rainDetected ? 'Có mưa' : 'Khô ráo'}
                    tone="warning"
                    size="sm"
                  />
                  <StatusBadge
                    label={telemetry.fireDetected ? 'Cháy' : 'Không cháy'}
                    tone={telemetry.fireDetected ? 'danger' : 'success'}
                    size="sm"
                  />
                </View>
              </View>
            ) : (
              <EmptyState
                icon="hardware-chip-outline"
                title="Chưa có telemetry"
                description="Dữ liệu sẽ hiện khi gateway gửi bản mới."
              />
            )}
          </SectionCard>

          <SectionCard
            title="Cảnh báo gần đây"
            subtitle="Các mục cần xử lý trước."
            variant="outlined"
          >
            {fireAlerts.length > 0 ? (
              <View style={styles.column}>
                {fireAlerts.slice(0, 5).map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() =>
                      router.push({
                        pathname: '/alerts/[id]',
                        params: { id: item.id, kind: 'fire_alert' },
                      } as never)
                    }
                    style={[
                      styles.alertCard,
                      {
                        backgroundColor: theme.colors.surfaceSubtle,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View style={[styles.rowBetween, styles.alertHeader]}>
                      <Text
                        style={[
                          styles.inlineTitle,
                          { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                        ]}
                      >
                        {item.message || 'Cảnh báo cháy'}
                      </Text>
                      <StatusBadge
                        label={item.isResolved ? 'Đã xử lý' : 'Đang mở'}
                        tone={item.isResolved ? 'info' : 'danger'}
                        size="sm"
                      />
                    </View>
                    <Text
                      style={[
                        styles.metaText,
                        { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                      ]}
                    >
                      Cổng {item.gateId} · {formatDateTime(item.reportedAt)}
                    </Text>
                    {item.telemetrySnapshot ? (
                      <View style={styles.badgeRow}>
                        <StatusBadge
                          label={`Nhiệt độ ${item.telemetrySnapshot.temperature ?? '--'}°C`}
                          tone="info"
                          size="sm"
                        />
                        <StatusBadge
                          label={`Độ ẩm ${item.telemetrySnapshot.humidity ?? '--'}%`}
                          tone="success"
                          size="sm"
                        />
                        <StatusBadge
                          label={item.telemetrySnapshot.rainDetected ? 'Có mưa' : 'Khô ráo'}
                          tone="warning"
                          size="sm"
                        />
                        <StatusBadge
                          label={item.telemetrySnapshot.fireDetected ? 'Cháy' : 'Không cháy'}
                          tone={item.telemetrySnapshot.fireDetected ? 'danger' : 'success'}
                          size="sm"
                        />
                      </View>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            ) : (
              <EmptyState
                icon="shield-checkmark-outline"
                title="Chưa có cảnh báo"
                description="Danh sách sẽ hiện khi có fire alert mới."
              />
            )}
          </SectionCard>
        </ContentStack>
      </Screen>
    );
  }

  const selectedSemester = scheduleState.semesters.find(
    (item) => item.id === scheduleState.resolvedSemesterId,
  );
  const resolvedSchedule = scheduleState.schedule;
  const groupedSchedule = groupScheduleByDay(resolvedSchedule);
  const subjectColorIndex = buildSubjectColorIndex(resolvedSchedule);
  const nextClass = getNextClass(resolvedSchedule);
  const todayScheduleCount = resolvedSchedule.filter(
    (item: ScheduleRecord) => item.dayOfWeek === getTodayDayOfWeek(),
  ).length;

  const overviewMetrics = [
    {
      label: 'Hôm nay',
      value: `${todayScheduleCount}`,
      helper: 'Buổi trong ngày',
      tone: 'primary' as const,
    },
    {
      label: 'Tiếp theo',
      value: nextClass?.course.code ?? '--',
      helper: nextClass ? `${nextClass.startTime} - ${nextClass.endTime}` : 'Chưa có buổi',
      tone: 'success' as const,
    },
    {
      label: 'Vai trò',
      value: getRoleLabel(role),
      helper: isLecturer ? 'Giảng dạy' : 'Học tập',
      tone: 'info' as const,
    },
    {
      label: 'Học kỳ',
      value: selectedSemester?.name ?? '--',
      helper: selectedSemester?.isCurrent ? 'Đang học' : 'Kỳ đang chọn',
      tone: 'warning' as const,
    },
  ];

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={scheduleState.isLoading}
          onRefresh={() => void scheduleState.refetch()}
          tintColor={theme.colors.primary}
        />
      }
    >
      <TopHero
        eyebrow={isLecturer ? 'Lịch giảng dạy' : 'Lịch học'}
        title={isLecturer ? 'Lịch dạy trong học kỳ' : 'Lịch học trong học kỳ'}
        subtitle={
          isLecturer ? 'Lịch dạy và nhiệm vụ hiện tại.' : 'Buổi gần nhất và lịch theo ngày.'
        }
        badge={{ label: getRoleLabel(role), tone: 'info' }}
        showBrand
      />

      <ContentStack>
        <MetricGrid
          items={overviewMetrics}
          compactColumns={2}
          cardMinHeight={112}
          layoutPreset="mobileTwoByTwo"
        />

        {!isLecturer ? (
          <SectionCard
            title="Học kỳ"
            subtitle="Chọn kỳ cần xem."
            variant="highlight"
            tone="academic"
          >
            <View style={styles.semesterGrid}>
              {scheduleState.semesters.map((semester) => {
                const semesterTone = getSemesterColorByStatus(theme, semester);
                return (
                  <Pressable
                    key={semester.id}
                    accessibilityRole="button"
                    onPress={() => router.push(`/schedule/semester/${semester.id}` as never)}
                    style={[
                      styles.semesterCard,
                      layout.isCompact ? styles.semesterCardCompact : null,
                      {
                        backgroundColor: semesterTone.surface,
                        borderColor: semesterTone.borderColor,
                        borderStyle: semesterTone.borderStyle,
                        opacity: semesterTone.opacity,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.semesterTitle,
                        layout.isCompact ? styles.semesterTitleCompact : null,
                        {
                          color: semesterTone.titleColor,
                          fontFamily: theme.fonts.semibold,
                        },
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.78}
                    >
                      {semester.name}
                    </Text>
                    <Text
                      style={[
                        styles.semesterStatus,
                        {
                          color: semesterTone.statusColor,
                          fontFamily: theme.fonts.medium,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {getSemesterStatusText(semester)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </SectionCard>
        ) : null}

        <SectionCard
          title={isLecturer ? 'Buổi dạy gần nhất' : 'Buổi học gần nhất'}
          subtitle="Ưu tiên đầu tiên."
          variant="glass"
          tone="primary"
        >
          {nextClass ? (
            <View
              style={[
                styles.nextClassCard,
                {
                  backgroundColor: theme.colors.surfaceSubtle,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.nextClassDate,
                  {
                    backgroundColor: theme.colors.primarySurface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.nextClassDateNumber,
                    { color: theme.colors.primary, fontFamily: theme.fonts.semibold },
                  ]}
                >
                  {getNextOccurrence(nextClass).getDate()}
                </Text>
                <Text
                  style={[
                    styles.nextClassDateLabel,
                    { color: theme.colors.primary, fontFamily: theme.fonts.medium },
                  ]}
                >
                  {getDayLabelShort(nextClass.dayOfWeek)}
                </Text>
              </View>

              <View style={styles.nextClassBody}>
                <Text
                  style={[
                    styles.nextClassTitle,
                    { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                  ]}
                >
                  {nextClass.course.name}
                </Text>

                <View style={styles.nextClassMetaRow}>
                  <View
                    style={[
                      styles.nextClassMetaChip,
                      { backgroundColor: theme.colors.primarySurface },
                    ]}
                  >
                    <Ionicons name="time-outline" size={14} color={theme.colors.primary} />
                    <Text
                      style={[
                        styles.nextClassMetaText,
                        { color: theme.colors.primary, fontFamily: theme.fonts.medium },
                      ]}
                    >
                      {nextClass.startTime} - {nextClass.endTime}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.nextClassMetaChip,
                      { backgroundColor: theme.colors.primarySurface },
                    ]}
                  >
                    <Ionicons name="location-outline" size={14} color={theme.colors.primary} />
                    <Text
                      style={[
                        styles.nextClassMetaText,
                        { color: theme.colors.primary, fontFamily: theme.fonts.medium },
                      ]}
                      numberOfLines={1}
                    >
                      {getScheduleRoomLabel(nextClass.room)}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.nextClassMetaChip,
                    styles.nextClassInstructorChip,
                    { backgroundColor: theme.colors.primarySurface },
                  ]}
                >
                  <Ionicons name="person-outline" size={14} color={theme.colors.primary} />
                  <Text
                    style={[
                      styles.nextClassMetaText,
                      { color: theme.colors.primary, fontFamily: theme.fonts.medium },
                    ]}
                    numberOfLines={1}
                  >
                    {getScheduleInstructorLabel(nextClass.instructor)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.nextClassStatus,
                    { backgroundColor: theme.colors.successSurface ?? theme.colors.primarySurface },
                  ]}
                >
                  <View
                    style={[
                      styles.nextClassStatusDot,
                      { backgroundColor: theme.colors.success ?? theme.colors.primary },
                    ]}
                  />
                  <Text
                    style={[
                      styles.nextClassStatusText,
                      {
                        color: theme.colors.success ?? theme.colors.primary,
                        fontFamily: theme.fonts.medium,
                      },
                    ]}
                  >
                    {`${getPeriodText(nextClass)} · ${todayScheduleCount > 0 ? 'Đang diễn ra' : 'Sắp diễn ra'}`}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <EmptyState
              icon="calendar-clear-outline"
              title="Không có buổi học"
              description="Dữ liệu sẽ hiện khi có lịch cho học kỳ này."
            />
          )}
        </SectionCard>

        {isLecturer ? (
          <SectionCard title="Công cụ giảng dạy" subtitle="Tác vụ hỗ trợ." variant="outlined">
            <View style={styles.column}>
              <NavigationRow
                icon="school-outline"
                label="Bảng lớp học"
                description="Mở dashboard lớp học."
                badgeLabel="Sắp triển khai"
                badgeTone="info"
                onPress={() => router.push('/schedule/class-dashboard')}
              />
              <NavigationRow
                icon="qr-code-outline"
                label="Điểm danh QR"
                description="Chuẩn bị phiên điểm danh."
                badgeLabel="Sắp triển khai"
                badgeTone="info"
                onPress={() => router.push('/services/attendance/lecturer')}
              />
              <NavigationRow
                icon="bar-chart-outline"
                label="Bảng nhập điểm"
                description="Xem và đối chiếu điểm."
                badgeLabel="Sắp triển khai"
                badgeTone="info"
                onPress={() => router.push('/schedule/grade-sheet')}
              />
            </View>
          </SectionCard>
        ) : null}

        <SectionCard title="Theo ngày" subtitle="Danh sách theo ngày." variant="outlined">
          {Object.keys(groupedSchedule).length > 0 ? (
            <View style={styles.column}>
              {Object.entries(groupedSchedule).map(([day, items]) => (
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
                    {items.map((item) => {
                      const accent = getSubjectColorByCode(
                        theme,
                        item.course.code,
                        subjectColorIndex,
                      );
                      return (
                        <View
                          key={item.id}
                          style={[
                            styles.sessionCard,
                            {
                              backgroundColor: accent.surface,
                              borderColor: accent.accent,
                            },
                          ]}
                        >
                          <View style={[styles.sessionBar, { backgroundColor: accent.accent }]} />
                          <View style={styles.sessionBody}>
                            <View style={styles.sessionHeader}>
                              <View style={styles.sessionHeaderMain}>
                                <Text
                                  style={[
                                    styles.sessionTitle,
                                    { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                                  ]}
                                >
                                  {item.course.name}
                                </Text>
                                <Text
                                  style={[
                                    styles.sessionMeta,
                                    {
                                      color: theme.colors.textMuted,
                                      fontFamily: theme.fonts.regular,
                                    },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {item.course.code}
                                </Text>
                              </View>

                              <View style={styles.sessionTimeBlock}>
                                <Text
                                  style={[
                                    styles.sessionTime,
                                    { color: accent.accent, fontFamily: theme.fonts.semibold },
                                  ]}
                                >
                                  {item.startTime} - {item.endTime}
                                </Text>
                                <Text
                                  style={[
                                    styles.sessionPeriodText,
                                    {
                                      color: theme.colors.textMuted,
                                      fontFamily: theme.fonts.medium,
                                    },
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
                              {getScheduleInstructorLabel(item.instructor)}
                            </Text>

                            <View style={styles.badgeRow}>
                              <StatusBadge
                                label={`Tiết ${item.startPeriod ?? '--'}-${item.endPeriod ?? '--'}`}
                                tone="info"
                                size="sm"
                              />
                              <StatusBadge
                                label={item.sessionType === 'daytime' ? 'Ban ngày' : 'Buổi tối'}
                                tone="primary"
                                size="sm"
                              />
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="albums-outline"
              title="Chưa có lịch"
              description="Danh sách sẽ xuất hiện khi có dữ liệu học kỳ hiện tại."
            />
          )}
        </SectionCard>
      </ContentStack>
    </Screen>
  );
}

function NavigationRow({
  icon,
  label,
  description,
  badgeLabel,
  badgeTone,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  badgeLabel: string;
  badgeTone: 'success' | 'info' | 'warning' | 'danger' | 'primary';
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.inlineCard,
        {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.iconBubble,
          {
            backgroundColor: theme.colors.primarySurface,
          },
        ]}
      >
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowBetween}>
          <Text
            style={[
              styles.inlineTitle,
              { color: theme.colors.text, fontFamily: theme.fonts.semibold },
            ]}
          >
            {label}
          </Text>
          <StatusBadge label={badgeLabel} tone={badgeTone} size="sm" />
        </View>
        <Text
          style={[
            styles.metaText,
            { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
          ]}
        >
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  column: {
    gap: 10,
  },
  infoGrid: {
    gap: 8,
  },
  semesterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  semesterCard: {
    width: '48%',
    minHeight: 64,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  semesterCardCompact: {
    paddingHorizontal: 10,
  },
  semesterTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  semesterTitleCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  semesterStatus: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  inlineCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    flexDirection: 'row',
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowBetweenStacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
  },
  nextClassCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  nextClassDate: {
    width: 72,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextClassDateNumber: {
    fontSize: 24,
    lineHeight: 28,
  },
  nextClassDateLabel: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
  },
  nextClassBody: {
    flex: 1,
    gap: 10,
  },
  nextClassTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  nextClassMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nextClassMetaChip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextClassInstructorChip: {
    alignSelf: 'flex-start',
  },
  nextClassMetaText: {
    fontSize: 12,
    lineHeight: 16,
  },
  nextClassStatus: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextClassStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  nextClassStatusText: {
    fontSize: 12,
    lineHeight: 16,
  },
  inlineTitle: {
    flex: 1,
    fontSize: 15,
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
  },
  sessionList: {
    gap: 8,
  },
  alertCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  alertHeader: {
    alignItems: 'flex-start',
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
    gap: 6,
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
});
