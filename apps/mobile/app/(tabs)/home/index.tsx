import { Ionicons } from '@expo/vector-icons';
import { USER_ROLES } from '@smart-campus/shared';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { MetricGrid } from '@/components/tasks';
import {
  ContentStack,
  EmptyState,
  PrimaryButton,
  Screen,
  SectionCard,
  SecondaryButton,
  StatusBadge,
  TopHero,
} from '@/components/ui';
import { useDashboardSnapshot } from '@/hooks/use-dashboard-snapshot';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import type { DashboardSnapshot } from '@/types/app-data';
import {
  formatDateTime,
  formatGpaValue,
  getGreetingName,
  getRoleLabel,
  getRoleQuickActions,
  getTelemetryHealthLabel,
  isAdminRole,
} from '@/utils/app';

const QUICK_COPY: Record<string, string> = {
  schedule: 'Lịch học.',
  grades: 'Xem GPA.',
  alerts: 'Cảnh báo.',
  parking: 'Parking.',
  operations: 'Vận hành.',
  services: 'Dịch vụ.',
};

export default function HomeScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const dashboard = useDashboardSnapshot(user?.role);
  const snapshot: DashboardSnapshot = dashboard.data ?? {
    role: user?.role ?? 'student',
    todayClasses: [],
    nextClass: null,
    gpa: null,
    unreadCount: 0,
    parking: null,
    telemetryHealth: 'no-data',
  };

  const quickActions = getRoleQuickActions(user?.role);
  const isOperationsRole = isAdminRole(user?.role);
  const isStudent = user?.role === USER_ROLES.STUDENT;
  const shouldShowParkingHealth =
    snapshot.telemetryHealth !== 'online' && snapshot.telemetryHealth !== 'no-data';
  const quickActionRows = Array.from({ length: Math.ceil(quickActions.length / 2) }, (_, index) =>
    quickActions.slice(index * 2, index * 2 + 2),
  );
  const healthTone =
    snapshot.telemetryHealth === 'fire-alert'
      ? 'danger'
      : snapshot.telemetryHealth === 'stale' || snapshot.telemetryHealth === 'offline'
        ? 'warning'
        : snapshot.telemetryHealth === 'no-data'
          ? 'info'
          : 'success';

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={dashboard.isRefetching}
          onRefresh={() => void dashboard.refetch()}
          tintColor={theme.colors.primary}
        />
      }
    >
      <TopHero
        eyebrow="Bảng điều khiển"
        title={`Xin chào, ${getGreetingName(user)}`}
        subtitle={getHomeSubtitle(snapshot, user?.role)}
        badge={{ label: getRoleLabel(user?.role), tone: 'info' }}
        showBrand
        variant="accent"
        headerRight={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mở cảnh báo và thông báo"
            onPress={() => router.push('/alerts')}
            style={({ pressed }) => [
              styles.bellButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.86 : 1,
              },
            ]}
          >
            <Ionicons name="notifications-outline" size={20} color={theme.colors.textMuted} />
            {snapshot.unreadCount > 0 ? (
              <View style={[styles.bellBadge, { backgroundColor: theme.colors.primary }]}>
                <Text
                  style={[
                    styles.bellBadgeText,
                    { color: theme.colors.onPrimary, fontFamily: theme.fonts.semibold },
                  ]}
                >
                  {snapshot.unreadCount > 9 ? '9+' : `${snapshot.unreadCount}`}
                </Text>
              </View>
            ) : null}
          </Pressable>
        }
      />

      <ContentStack gap={16} overlapHero={false}>
        <View style={styles.bentoGrid}>
          <View style={styles.primaryColumn}>
            {isOperationsRole ? (
              <SectionCard
                title="Tổng quan vận hành"
                subtitle="Số liệu chính trong ngày."
                variant="highlight"
                tone="academic"
                headerAccessory={
                  <StatusBadge
                    label={getTelemetryHealthLabel(snapshot.telemetryHealth)}
                    tone={healthTone}
                    size="sm"
                  />
                }
              >
                <View style={styles.sectionStack}>
                  <MetricGrid
                    items={[
                      {
                        label: 'Chỗ trống',
                        value: snapshot.parking
                          ? `${snapshot.parking.availableSlots}/${snapshot.parking.totalSlots}`
                          : '--',
                        helper: 'Parking A1-A2',
                        tone: 'success',
                      },
                      {
                        label: 'Phiên mở',
                        value: `${snapshot.parking?.activeSessions ?? 0}`,
                        helper: 'Đang gửi xe',
                        tone: 'info',
                      },
                      {
                        label: 'Chưa đọc',
                        value: `${snapshot.unreadCount}`,
                        helper: 'Cần xem',
                        tone: 'warning',
                      },
                      {
                        label: 'Cảm biến',
                        value: getTelemetryHealthLabel(snapshot.telemetryHealth),
                        helper: 'Gateway',
                        tone: healthTone,
                      },
                    ]}
                    minItemWidth={132}
                    fixedColumns={2}
                    compactColumns={2}
                    cardMinHeight={112}
                  />
                  <View style={styles.inlineActions}>
                    <PrimaryButton label="Parking" onPress={() => router.push('/parking')} />
                    <SecondaryButton label="Cảnh báo" onPress={() => router.push('/alerts')} />
                  </View>
                </View>
              </SectionCard>
            ) : (
              <SectionCard
                title="Buổi tiếp theo"
                subtitle="Tóm tắt ngắn cho buổi gần nhất."
                variant="highlight"
                tone="academic"
                actionLabel="Lịch học"
                onActionPress={() => router.push('/schedule')}
              >
                {snapshot.nextClass ? (
                  <View style={styles.sectionStack}>
                    <View style={[styles.rowBetween, layout.isCompact ? styles.rowBetweenStacked : null]}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.cardTitle,
                            { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                          ]}
                        >
                          {snapshot.nextClass.course.name}
                        </Text>
                        <Text
                          style={[
                            styles.metaText,
                            { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                          ]}
                        >
                          {(snapshot.nextClass.classCode ?? snapshot.nextClass.course.code) ||
                            'Chưa có mã lớp'}{' '}
                          · {getInstructorLabel(snapshot.nextClass.instructor)}
                        </Text>
                      </View>
                      <StatusBadge
                        label={getRoomLabel(snapshot.nextClass.room)}
                        tone="primary"
                        size="sm"
                      />
                    </View>
                    <Text
                      style={[
                        styles.timeText,
                        { color: theme.colors.primary, fontFamily: theme.fonts.semibold },
                      ]}
                    >
                      {snapshot.nextClass.startTime} - {snapshot.nextClass.endTime}
                    </Text>
                    <Text
                      style={[
                        styles.metaText,
                        { color: theme.colors.textSoft, fontFamily: theme.fonts.regular },
                      ]}
                    >
                      Hôm nay: {snapshot.todayClasses.length} buổi
                    </Text>
                  </View>
                ) : (
                  <EmptyState
                    icon="calendar-clear-outline"
                    title="Chưa có lịch gần nhất"
                    description="Dữ liệu sẽ hiển thị khi đồng bộ."
                  />
                )}
              </SectionCard>
            )}
          </View>

          <View style={styles.secondaryColumn}>
            <SectionCard
              title="Parking"
              subtitle="Trạng thái bãi xe và cảm biến."
              actionLabel="Mở Parking"
              onActionPress={() => router.push('/parking')}
              variant="glass"
              tone="telemetry"
              headerAccessory={
                snapshot.parking ? (
                  <StatusBadge
                    label={getTelemetryHealthLabel(snapshot.telemetryHealth)}
                    tone={healthTone}
                    size="sm"
                  />
                ) : null
              }
            >
              {snapshot.parking ? (
                <View style={styles.sectionStack}>
                  <View style={[styles.rowBetween, layout.isCompact ? styles.rowBetweenStacked : null]}>
                    <Text
                      style={[
                        styles.parkingTitle,
                        { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                      ]}
                    >
                      {snapshot.parking.availableSlots}/{snapshot.parking.totalSlots} chỗ trống
                    </Text>
                    <Text
                      style={[
                        styles.metaText,
                        { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
                      ]}
                    >
                      {snapshot.parking.activeSessions} phiên
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.metaText,
                      { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                    ]}
                  >
                    Cập nhật {formatDateTime(snapshot.parking.lastUpdated)}
                  </Text>

                  <View style={styles.badgeRow}>
                    <StatusBadge
                      label={`Nhiệt ${snapshot.parking.sensors.temperature ?? '--'}°C`}
                      tone="info"
                      size="sm"
                    />
                    <StatusBadge
                      label={`Ẩm ${snapshot.parking.sensors.humidity ?? '--'}%`}
                      tone="success"
                      size="sm"
                    />
                    <StatusBadge
                      label={snapshot.parking.sensors.rainDetected ? 'Có mưa' : 'Khô ráo'}
                      tone="warning"
                      size="sm"
                    />
                    {snapshot.parking.sensors.fireDetected ? (
                      <StatusBadge label="Cảnh báo cháy" tone="danger" size="sm" />
                    ) : null}
                  </View>

                  {shouldShowParkingHealth ? (
                    <ParkingHealthCallout
                      state={snapshot.telemetryHealth}
                      tone={healthTone}
                      onPress={() => router.push('/parking')}
                    />
                  ) : null}
                </View>
              ) : (
                <EmptyState
                  icon="car-sport-outline"
                  title="Chưa có dữ liệu parking"
                  description="Kéo xuống để làm mới."
                />
              )}
            </SectionCard>

            {isOperationsRole ? (
              <SectionCard
                title="Cảnh báo"
                subtitle="Mục chưa đọc trong ngày."
                actionLabel="Mở cảnh báo"
                onActionPress={() => router.push('/alerts')}
                variant="outlined"
                tone="danger"
              >
                {snapshot.unreadCount > 0 ? (
                  <View style={styles.sectionStack}>
                    <Text
                      style={[
                        styles.gpaValue,
                        { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                      ]}
                    >
                      {snapshot.unreadCount}
                    </Text>
                    <Text
                      style={[
                        styles.metaText,
                        { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                      ]}
                    >
                      Mục chưa đọc cần theo dõi
                    </Text>
                    <StatusBadge label="Cần xử lý" tone="warning" size="sm" />
                  </View>
                ) : (
                  <EmptyState
                    icon="checkmark-circle-outline"
                    title="Không có cảnh báo"
                    description="Hệ thống đang ổn định."
                  />
                )}
              </SectionCard>
            ) : isStudent ? (
              <SectionCard
                title="Kết quả"
                subtitle="GPA và tín chỉ."
                actionLabel="Xem GPA"
                onActionPress={() => router.push('/services/grades')}
                variant="outlined"
                tone="campus"
              >
                <View style={styles.sectionStack}>
                  <Text
                    style={[
                      styles.gpaValue,
                      { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                    ]}
                  >
                    {formatGpaValue(snapshot.gpa?.gpa)}
                  </Text>
                  <Text
                    style={[
                      styles.metaText,
                      { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                    ]}
                  >
                    {snapshot.gpa?.totalCourses ?? 0} học phần · {snapshot.gpa?.totalCredits ?? 0} tín chỉ
                  </Text>
                </View>
              </SectionCard>
            ) : null}
          </View>
        </View>

        <SectionCard
          title="Lối tắt"
          subtitle="Truy cập nhanh các mục thường dùng."
          variant="outlined"
        >
          <View style={styles.quickGrid}>
            {quickActionRows.map((row, rowIndex) => (
              <View key={`quick-row-${rowIndex}`} style={styles.quickRow}>
                {row.map((action) => (
                  <QuickActionTile
                    key={action.id}
                    icon={action.icon as never}
                    label={getQuickLabel(action.id, action.label)}
                    description={QUICK_COPY[action.id] ?? 'Mở nhanh.'}
                    route={action.route}
                    tone={getQuickTone(action.id)}
                  />
                ))}
                {row.length === 1 ? <View style={styles.quickCardSpacer} /> : null}
              </View>
            ))}
          </View>
        </SectionCard>
      </ContentStack>
    </Screen>
  );
}

function QuickActionTile({
  icon,
  label,
  description,
  route,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  route: string;
  tone: 'primary' | 'campus' | 'academic' | 'telemetry' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const theme = useAppTheme();
  const router = useRouter();
  const accentColor = getToneColor(theme, tone);
  const accentSurface = getToneSurface(theme, tone);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(route as never)}
      style={({ pressed }) => [
        styles.quickCard,
        {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.86 : 1,
        },
        theme.elevation.level1 as never,
      ]}
    >
      <View style={styles.quickHeader}>
        <View style={[styles.quickIconWrap, { backgroundColor: accentSurface }]}>
          <Ionicons name={icon} size={20} color={accentColor} />
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textSoft} />
      </View>
      <Text
        style={[styles.quickLabel, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.quickDescription,
          { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
        ]}
      >
        {description}
      </Text>
    </Pressable>
  );
}

function ParkingHealthCallout({
  state,
  tone,
  onPress,
}: {
  state: DashboardSnapshot['telemetryHealth'];
  tone: 'success' | 'warning' | 'danger' | 'info';
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const title =
    state === 'fire-alert'
      ? 'Cảnh báo cháy'
      : state === 'offline'
        ? 'Gateway mất kết nối'
        : 'Dữ liệu chưa làm mới';
  const description =
    state === 'fire-alert'
      ? 'Ưu tiên kiểm tra trạng thái an toàn.'
      : state === 'offline'
        ? 'Ứng dụng sẽ cập nhật lại khi gateway online.'
        : 'Dữ liệu đang hiển thị từ lần đồng bộ gần nhất.';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.callout,
        {
          backgroundColor:
            tone === 'danger'
              ? theme.colors.emergencySurface
              : tone === 'warning'
                ? theme.colors.warningSurface
                : theme.colors.infoSurface,
          borderColor:
            tone === 'danger'
              ? theme.colors.emergency
              : tone === 'warning'
                ? theme.colors.warning
                : theme.colors.info,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <Ionicons
        name={
          tone === 'danger'
            ? 'flame-outline'
            : tone === 'warning'
              ? 'cloud-offline-outline'
              : 'alert-circle-outline'
        }
        size={18}
        color={
          tone === 'danger'
            ? theme.colors.emergency
            : tone === 'warning'
              ? theme.colors.warning
              : theme.colors.info
        }
      />
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.calloutTitle,
            { color: theme.colors.text, fontFamily: theme.fonts.semibold },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.calloutBody,
            { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
          ]}
        >
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

function getHomeSubtitle(snapshot: DashboardSnapshot, role?: string | null) {
  if (isAdminRole(role)) {
    if (snapshot.parking) {
      return `Parking còn ${snapshot.parking.availableSlots}/${snapshot.parking.totalSlots} chỗ.`;
    }

    return 'Theo dõi vận hành và cảnh báo trong ngày.';
  }

  if (snapshot.nextClass) {
    return `Buổi kế tiếp: ${snapshot.nextClass.course.name}.`;
  }

  if (typeof snapshot.gpa?.gpa === 'number') {
    return `GPA hiện tại ${formatGpaValue(snapshot.gpa.gpa)}.`;
  }

  return 'Theo dõi lịch, parking và thông báo.';
}

function getRoomLabel(room?: string | null) {
  return room ? `Phòng ${room}` : 'Chưa có phòng';
}

function getInstructorLabel(instructor?: string | null) {
  return instructor ?? 'Chưa có giảng viên';
}

function getQuickLabel(id: string, fallback: string) {
  switch (id) {
    case 'schedule':
      return 'Lịch';
    case 'grades':
      return 'GPA';
    case 'alerts':
      return 'Cảnh báo';
    case 'parking':
      return 'Parking';
    case 'operations':
      return 'Vận hành';
    case 'services':
      return 'Dịch vụ';
    default:
      return fallback;
  }
}

function getQuickTone(actionId: string) {
  switch (actionId) {
    case 'schedule':
      return 'academic';
    case 'grades':
      return 'campus';
    case 'alerts':
      return 'danger';
    case 'parking':
      return 'telemetry';
    case 'operations':
      return 'primary';
    default:
      return 'info';
  }
}

function getToneColor(
  theme: ReturnType<typeof useAppTheme>,
  tone: 'primary' | 'campus' | 'academic' | 'telemetry' | 'success' | 'warning' | 'danger' | 'info',
) {
  switch (tone) {
    case 'campus':
      return theme.colors.accentCampus;
    case 'academic':
      return theme.colors.accentAcademic;
    case 'telemetry':
      return theme.colors.accentTelemetry;
    case 'success':
      return theme.colors.success;
    case 'warning':
      return theme.colors.warning;
    case 'danger':
      return theme.colors.danger;
    case 'info':
      return theme.colors.info;
    default:
      return theme.colors.primary;
  }
}

function getToneSurface(
  theme: ReturnType<typeof useAppTheme>,
  tone: 'primary' | 'campus' | 'academic' | 'telemetry' | 'success' | 'warning' | 'danger' | 'info',
) {
  switch (tone) {
    case 'campus':
      return theme.colors.accentCampusSurface;
    case 'academic':
      return theme.colors.accentAcademicSurface;
    case 'telemetry':
      return theme.colors.accentTelemetrySurface;
    case 'success':
      return theme.colors.successSurface;
    case 'warning':
      return theme.colors.warningSurface;
    case 'danger':
      return theme.colors.dangerSurface;
    case 'info':
      return theme.colors.infoSurface;
    default:
      return theme.colors.primarySurface;
  }
}

const styles = StyleSheet.create({
  bentoGrid: {
    gap: 12,
  },
  primaryColumn: {
    gap: 12,
  },
  secondaryColumn: {
    gap: 12,
  },
  sectionStack: {
    gap: 12,
  },
  inlineActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  rowBetweenStacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 18,
  },
  parkingTitle: {
    fontSize: 18,
  },
  timeText: {
    fontSize: 16,
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickGrid: {
    gap: 12,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  quickCardSpacer: {
    flex: 1,
  },
  quickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 15,
  },
  quickDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  gpaValue: {
    fontSize: 30,
  },
  callout: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  calloutTitle: {
    fontSize: 13,
  },
  calloutBody: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    fontSize: 10,
  },
});
