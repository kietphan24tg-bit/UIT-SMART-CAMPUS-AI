import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { MetricGrid } from '@/components/tasks';
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
  getRoleLabel,
  getTelemetryHealthLabel,
  groupScheduleByDay,
  isAdminRole,
  isLecturerRole,
} from '@/utils/app';

export default function ScheduleScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | undefined>(undefined);

  const isOperationsRole = isAdminRole(role);
  const isLecturer = isLecturerRole(role);
  const scheduleState = useScheduleScreenData(selectedSemesterId);
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

  const groupedSchedule = groupScheduleByDay(scheduleState.schedule);
  const dayColumns = layout.isTablet
    ? layout.getGridColumns({ minItemWidth: 280, gap: 12, maxColumns: 2 })
    : 1;
  const dayBlockWidth = layout.getGridItemWidth({ columns: dayColumns, gap: 12 });

  const scheduleMetrics = [
    {
      label: 'Trong tuần',
      value: `${scheduleState.schedule.length}`,
      helper: isLecturer ? 'Buổi dạy đã có lịch' : 'Buổi học đã có lịch',
      tone: 'info' as const,
    },
    {
      label: 'Hôm nay',
      value: `${scheduleState.schedule.filter((item: ScheduleRecord) => item.dayOfWeek === currentDayOfWeek()).length}`,
      helper: isLecturer ? 'Buổi dạy hôm nay' : 'Buổi học hôm nay',
      tone: 'success' as const,
    },
    {
      label: 'Học kỳ',
      value:
        scheduleState.semesters.find((item) => item.id === scheduleState.resolvedSemesterId)
          ?.name ?? '--',
      helper: 'Bộ lọc hiện tại',
      tone: 'primary' as const,
    },
    {
      label: 'Tiếp theo',
      value: scheduleState.schedule[0]?.startTime ?? '--',
      helper: scheduleState.schedule[0]?.course.code ?? 'Chưa có dữ liệu',
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
          isLecturer
            ? 'Lịch giảng dạy và tác vụ hiện đang hỗ trợ.'
            : 'Lịch học theo học kỳ, buổi gần nhất và theo ngày.'
        }
        badge={{ label: getRoleLabel(role), tone: 'info' }}
        showBrand
      />

      <ContentStack>
        <MetricGrid items={scheduleMetrics} />

        <SectionCard title="Học kỳ" subtitle="Chọn học kỳ cần theo dõi.">
          <View style={styles.chips}>
            {scheduleState.semesters.map((semester) => (
              <Pressable
                key={semester.id}
                onPress={() => setSelectedSemesterId(semester.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      scheduleState.resolvedSemesterId === semester.id
                        ? theme.colors.primarySurface
                        : theme.colors.surfaceSubtle,
                    borderColor:
                      scheduleState.resolvedSemesterId === semester.id
                        ? theme.colors.primary
                        : theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    {
                      color:
                        scheduleState.resolvedSemesterId === semester.id
                          ? theme.colors.primary
                          : theme.colors.textMuted,
                    },
                  ]}
                >
                  {semester.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>

        <SectionCard
          title={isLecturer ? 'Buổi dạy gần nhất' : 'Buổi học gần nhất'}
          subtitle="Thông tin ưu tiên hiển thị đầu tiên."
        >
          {scheduleState.schedule[0] ? (
            <View style={styles.column}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                {scheduleState.schedule[0].course.name}
              </Text>
              <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                {getDayLabel(scheduleState.schedule[0].dayOfWeek)} ·{' '}
                {scheduleState.schedule[0].startTime} - {scheduleState.schedule[0].endTime} · Phòng{' '}
                {scheduleState.schedule[0].room}
              </Text>
              <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                {scheduleState.schedule[0].instructor}
              </Text>
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

        <SectionCard title="Theo ngày" subtitle="Gom lịch theo thứ để đọc nhanh.">
          {Object.keys(groupedSchedule).length > 0 ? (
            <View style={styles.grid}>
              {Object.entries(groupedSchedule).map(([day, items]) => (
                <View
                  key={day}
                  style={[
                    styles.dayBlock,
                    { width: dayBlockWidth },
                    {
                      backgroundColor: theme.colors.surfaceSubtle,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                    {getDayLabel(Number(day))}
                  </Text>
                  {items.map((item) => (
                    <View key={item.id} style={styles.column}>
                      <Text style={[styles.className, { color: theme.colors.text }]}>
                        {item.course.name}
                      </Text>
                      <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                        {item.startTime} - {item.endTime} · {item.room} · {item.instructor}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="albums-outline"
              title="Chưa có lịch học nào"
              description="Danh sách sẽ xuất hiện khi có dữ liệu cho học kỳ đang chọn."
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

function currentDayOfWeek() {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  column: {
    gap: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dayBlock: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
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
  className: {
    fontSize: 15,
    fontWeight: '700',
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
});
