import { MetricGrid } from '@/components/tasks';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import {
  ContentStack,
  EmptyState,
  Screen,
  SectionCard,
  StatusBadge,
  TopHero,
} from '@/components/ui';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useOperationsScreenData, useScheduleScreenData } from '@/hooks/use-schedule-screen';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import type { FireAlertRecord, ScheduleRecord } from '@/types/app-data';
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
  return room ? `Phòng ${room}` : 'Chưa cập nhật phòng';
}

function getScheduleInstructorLabel(instructor?: string | null) {
  return instructor ?? 'Chưa cập nhật giảng viên';
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

function getSemesterStatusText(isCurrent: boolean) {
  return isCurrent ? 'Đang học' : 'Đã kết thúc';
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
  const role = useAuthStore((state) => state.user?.role);

  const isOperationsRole = isAdminRole(role);
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
          title={role === 'super_admin' ? 'Trung tâm vận hành UIT' : 'Điều phối campus'}
          subtitle="Tập trung parking, telemetry và fire alert."
          badge={{ label: getRoleLabel(role), tone: 'info' }}
          showBrand
        />

        <ContentStack>
          <MetricGrid
            items={[
              {
                label: 'Chỗ trống',
                value: parking ? `${parking.availableSlots}/${parking.totalSlots}` : '--',
                helper: 'Bãi xe A1-A4',
                tone: 'success',
              },
              {
                label: 'Phiên mở',
                value: `${parking?.activeSessions ?? 0}`,
                helper: 'Lượt gửi xe hiện tại',
                tone: 'info',
              },
              {
                label: 'Cảnh báo cháy',
                value: `${openFireAlerts}`,
                helper: 'Mục chưa xử lý',
                tone: 'danger',
              },
              {
                label: 'Chưa đọc',
                value: `${operationsState.data?.unreadCount ?? 0}`,
                helper: 'Thông báo hệ thống',
                tone: 'warning',
              },
            ]}
          />

          <SectionCard title="Lối vào vận hành" subtitle="Các điểm vào quan trọng cho vận hành.">
            <View style={styles.column}>
              <NavigationRow
                icon="flame-outline"
                label="Lịch sử cảnh báo cháy"
                description="Xem fire alert gần đây."
                badgeLabel="Đang hỗ trợ"
                badgeTone="success"
                onPress={() => router.push('/operations/fire-alerts')}
              />
              <NavigationRow
                icon="car-sport-outline"
                label="Parking + IoT"
                description="Theo dõi bãi xe, slot và cảm biến."
                badgeLabel="Đang hỗ trợ"
                badgeTone="success"
                onPress={() => router.push('/operations/parking-ops')}
              />
              <NavigationRow
                icon="notifications-outline"
                label="Broadcast thông báo"
                description="Sắp triển khai gửi thông báo chủ động."
                badgeLabel="Chưa hỗ trợ"
                badgeTone="info"
                onPress={() => router.push('/operations/notifications')}
              />
              {role === 'super_admin' ? (
                <NavigationRow
                  icon="settings-outline"
                  label="Thiết lập hệ thống"
                  description="Sắp triển khai cấu hình hệ thống trên mobile."
                  badgeLabel="Chưa hỗ trợ"
                  badgeTone="info"
                  onPress={() => router.push('/settings/system-controls')}
                />
              ) : null}
            </View>
          </SectionCard>

          <SectionCard
            title="Parking hiện tại"
            subtitle="Tóm tắt bãi xe hiện tại."
            actionLabel="Mở parking"
            onActionPress={() => router.push('/parking')}
          >
            {parking ? (
              <View style={styles.column}>
                <View
                  style={[styles.rowBetween, layout.isCompact ? styles.rowBetweenStacked : null]}
                >
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
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
                <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                  {parking.activeSessions} lượt gửi xe đang mở · cập nhật{' '}
                  {formatDateTime(parking.lastUpdated)}
                </Text>
                <View style={styles.badgeRow}>
                  <StatusBadge
                    label={`Nhiệt độ ${parking.sensors.temperature ?? '--'}°C`}
                    tone="info"
                  />
                  <StatusBadge
                    label={`Độ ẩm ${parking.sensors.humidity ?? '--'}%`}
                    tone="success"
                  />
                  <StatusBadge
                    label={parking.sensors.rainDetected ? 'Có mưa' : 'Khô ráo'}
                    tone="warning"
                  />
                  <StatusBadge
                    label={parking.sensors.fireDetected ? 'Cảnh báo cháy' : 'An toàn'}
                    tone={parking.sensors.fireDetected ? 'danger' : 'success'}
                  />
                </View>
              </View>
            ) : (
              <EmptyState
                icon="car-outline"
                title="Chưa có dữ liệu bãi xe"
                description="Kéo xuống để làm mới dữ liệu."
              />
            )}
          </SectionCard>

          <SectionCard title="Telemetry mới nhất" subtitle="Dữ liệu cảm biến mới nhất.">
            {telemetry ? (
              <View style={styles.column}>
                <View
                  style={[styles.rowBetween, layout.isCompact ? styles.rowBetweenStacked : null]}
                >
                  <StatusBadge
                    label={telemetry.fireDetected ? 'Cảnh báo cháy' : 'Thiết bị đang gửi dữ liệu'}
                    tone={telemetry.fireDetected ? 'danger' : 'success'}
                  />
                  <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                    {formatDateTime(telemetry.reportedAt)}
                  </Text>
                </View>
                <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                  Gateway {telemetry.gateId} · IP {telemetry.deviceIp || 'Chưa xác định'}
                </Text>
                <View style={styles.badgeRow}>
                  <StatusBadge label={`Nhiệt độ ${telemetry.temperature ?? '--'}°C`} tone="info" />
                  <StatusBadge label={`Độ ẩm ${telemetry.humidity ?? '--'}%`} tone="success" />
                  <StatusBadge
                    label={telemetry.rainDetected ? 'Có mưa' : 'Khô ráo'}
                    tone="warning"
                  />
                </View>
              </View>
            ) : (
              <EmptyState
                icon="hardware-chip-outline"
                title="Chưa có telemetry mới"
                description="Chưa có dữ liệu telemetry mới."
              />
            )}
          </SectionCard>

          <SectionCard title="Cảnh báo gần đây" subtitle="Ưu tiên các mục cần xử lý trước.">
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
                      styles.inlineCard,
                      {
                        backgroundColor: theme.colors.surfaceSubtle,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View style={styles.rowBetween}>
                      <Text style={[styles.inlineTitle, { color: theme.colors.text }]}>
                        {item.message}
                      </Text>
                      <StatusBadge
                        label={item.isResolved ? 'Đã xử lý' : 'Đang mở'}
                        tone={item.isResolved ? 'info' : 'danger'}
                      />
                    </View>
                    <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                      Cổng {item.gateId} · {formatDateTime(item.reportedAt)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <EmptyState
                icon="shield-checkmark-outline"
                title="Không có cảnh báo cháy đang mở"
                description="Danh sách sẽ hiển thị khi có fire alert mới."
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
  const groupedSchedule = groupScheduleByDay(scheduleState.schedule);
  const nextClass = getNextClass(scheduleState.schedule);
  const todayScheduleCount = scheduleState.schedule.filter(
    (item: ScheduleRecord) => item.dayOfWeek === getTodayDayOfWeek(),
  ).length;

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
          isLecturer
            ? 'Lịch giảng dạy và tác vụ hiện đang hỗ trợ.'
            : 'Lịch học theo học kỳ, buổi gần nhất và theo ngày.'
        }
        badge={{ label: getRoleLabel(role), tone: 'info' }}
        showBrand
      />

      <ContentStack>
        <SectionCard title="Học kỳ" subtitle="Chọn học kỳ để xem lịch.">
          <View style={styles.semesterGrid}>
            {scheduleState.semesters.map((semester) => (
              <Pressable
                key={semester.id}
                accessibilityRole="button"
                onPress={() => router.push(`/schedule/semester/${semester.id}` as never)}
                style={[
                  styles.semesterCard,
                  {
                    backgroundColor: semester.isCurrent
                      ? theme.colors.primarySurface
                      : theme.colors.surfaceSubtle,
                    borderColor: semester.isCurrent ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.semesterTitle,
                    {
                      color: semester.isCurrent ? theme.colors.primary : theme.colors.text,
                      fontFamily: theme.fonts.bold,
                    },
                  ]}
                >
                  {semester.name}
                </Text>
                <Text
                  style={[
                    styles.semesterStatus,
                    {
                      color: semester.isCurrent ? theme.colors.primary : theme.colors.textMuted,
                      fontFamily: theme.fonts.medium,
                    },
                  ]}
                >
                  {getSemesterStatusText(semester.isCurrent)}
                </Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>

        <SectionCard
          title={isLecturer ? 'Buổi dạy gần nhất' : 'Buổi học gần nhất'}
          subtitle="Thông tin ưu tiên hiển thị đầu tiên."
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
                    { color: theme.colors.primary, fontFamily: theme.fonts.bold },
                  ]}
                >
                  {getNextOccurrence(nextClass).getDate()}
                </Text>
                <Text
                  style={[
                    styles.nextClassDateLabel,
                    { color: theme.colors.primary, fontFamily: theme.fonts.semibold },
                  ]}
                >
                  {getDayLabelShort(nextClass.dayOfWeek)}
                </Text>
              </View>

              <View style={styles.nextClassBody}>
                <Text
                  style={[
                    styles.nextClassTitle,
                    { color: theme.colors.text, fontFamily: theme.fonts.bold },
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
                    {
                      backgroundColor: theme.colors.successSurface ?? theme.colors.primarySurface,
                    },
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
                        fontFamily: theme.fonts.semibold,
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
              title="Không có lịch trong học kỳ này"
              description="Danh sách sẽ hiển thị khi có dữ liệu cho học kỳ này."
            />
          )}
        </SectionCard>

        {isLecturer ? (
          <SectionCard
            title="Công cụ giảng dạy"
            subtitle="Một số công cụ đang ở trạng thái sắp triển khai."
          >
            <View style={styles.column}>
              <NavigationRow
                icon="school-outline"
                label="Bảng lớp học"
                description="Mở phạm vi dashboard lớp học."
                badgeLabel="Chưa hỗ trợ"
                badgeTone="info"
                onPress={() => router.push('/schedule/class-dashboard')}
              />
              <NavigationRow
                icon="qr-code-outline"
                label="Điểm danh QR"
                description="Sắp triển khai điểm danh QR."
                badgeLabel="Chưa hỗ trợ"
                badgeTone="info"
                onPress={() => router.push('/schedule/attendance-session')}
              />
              <NavigationRow
                icon="bar-chart-outline"
                label="Bảng nhập điểm"
                description="Hiện chỉ hỗ trợ xem điểm."
                badgeLabel="Chưa hỗ trợ"
                badgeTone="info"
                onPress={() => router.push('/schedule/grade-sheet')}
              />
            </View>
          </SectionCard>
        ) : null}

        <SectionCard title="Theo ngày">
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
                            {getScheduleInstructorLabel(item.instructor)}
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
              ))}
            </View>
          ) : (
            <EmptyState
              icon="albums-outline"
              title="Chưa có lịch học nào"
              description="Danh sách sẽ xuất hiện khi có dữ liệu cho học kỳ hiện tại."
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
          <Text style={[styles.inlineTitle, { color: theme.colors.text }]}>{label}</Text>
          <StatusBadge label={badgeLabel} tone={badgeTone} />
        </View>
        <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>{description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  semesterTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  semesterStatus: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  column: {
    gap: 10,
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
    fontWeight: '800',
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
    fontWeight: '800',
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
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
