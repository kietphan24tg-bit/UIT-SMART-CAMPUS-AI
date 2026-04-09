import { Ionicons } from '@expo/vector-icons';
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
  getDashboardHeroSummary,
  getGreetingName,
  getRoleLabel,
  getRoleQuickActions,
  isLecturerRole,
  getTelemetryHealthLabel,
  isAdminRole,
} from '@/utils/app';

const ACTION_DESCRIPTIONS: Record<string, string> = {
  schedule: 'Xem lịch học hoặc lịch dạy.',
  grades: 'Theo dõi điểm và GPA theo học kỳ.',
  alerts: 'Xem thông báo mới và cảnh báo.',
  parking: 'Theo dõi chỗ trống và cảm biến.',
  operations: 'Theo dõi vận hành campus.',
  services: 'Mở trung tâm dịch vụ theo vai trò.',
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
  const isLecturer = isLecturerRole(user?.role);
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
        eyebrow="Trang chủ"
        title={`Xin chào, ${getGreetingName(user)}!`}
        subtitle={getDashboardHeroSummary(snapshot)}
        badge={{ label: getRoleLabel(user?.role), tone: 'info' }}
        showBrand
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
                <Text style={[styles.bellBadgeText, { fontFamily: theme.fonts.bold }]}>
                  {snapshot.unreadCount > 9 ? '9+' : `${snapshot.unreadCount}`}
                </Text>
              </View>
            ) : null}
          </Pressable>
        }
      />

      <ContentStack>
        {isOperationsRole ? (
          <SectionCard
            title="Tổng quan vận hành"
            subtitle="Tóm tắt parking, gateway và cảnh báo."
            variant="elevated"
          >
            <View style={styles.sectionStack}>
              <MetricGrid
                items={[
                  {
                    label: 'Chỗ trống',
                    value: snapshot.parking
                      ? `${snapshot.parking.availableSlots}/${snapshot.parking.totalSlots}`
                      : '--',
                    helper: 'A1-A4',
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
                    helper: 'Cần theo dõi',
                    tone: 'warning',
                  },
                  {
                    label: 'Gateway',
                    value: getTelemetryHealthLabel(snapshot.telemetryHealth),
                    helper: 'Cảm biến',
                    tone: healthTone,
                  },
                ]}
                minItemWidth={156}
              />

              {shouldShowParkingHealth ? (
                <ParkingHealthCallout
                  state={snapshot.telemetryHealth}
                  tone={healthTone}
                  onPress={() => router.push('/parking')}
                />
              ) : null}

              <View style={styles.opsButtons}>
                <PrimaryButton label="Mở Parking" onPress={() => router.push('/parking')} />
                <SecondaryButton
                  label="Trung tâm cảnh báo"
                  onPress={() => router.push('/alerts')}
                />
              </View>
            </View>
          </SectionCard>
        ) : (
          <SectionCard
            title="Buổi tiếp theo"
            subtitle={`Hôm nay có ${snapshot.todayClasses.length} buổi trong lịch.`}
            actionLabel="Xem lịch"
            onActionPress={() => router.push('/schedule')}
            variant="elevated"
          >
            {snapshot.nextClass ? (
              <View style={styles.sectionStack}>
                <View
                  style={[styles.rowBetween, layout.isCompact ? styles.rowBetweenStacked : null]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.cardTitle,
                        { color: theme.colors.text, fontFamily: theme.fonts.bold },
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
                      {snapshot.nextClass.course.code} · {snapshot.nextClass.instructor}
                    </Text>
                  </View>
                  <StatusBadge label={`Phòng ${snapshot.nextClass.room}`} tone="primary" />
                </View>
                <Text
                  style={[
                    styles.timeText,
                    { color: theme.colors.primary, fontFamily: theme.fonts.bold },
                  ]}
                >
                  {snapshot.nextClass.startTime} - {snapshot.nextClass.endTime}
                </Text>
              </View>
            ) : (
              <EmptyState
                icon="calendar-clear-outline"
                title="Chưa có lịch gần nhất"
                description="Buổi gần nhất sẽ hiển thị tại đây khi có dữ liệu."
              />
            )}
          </SectionCard>
        )}

        <SectionCard
          title="Parking + IoT"
          subtitle="Số chỗ trống A1-A4 và trạng thái cảm biến."
          actionLabel="Mở Parking"
          onActionPress={() => router.push('/parking')}
          variant="outlined"
        >
          {snapshot.parking ? (
            <View style={styles.sectionStack}>
              <View style={[styles.rowBetween, layout.isCompact ? styles.rowBetweenStacked : null]}>
                <Text
                  style={[
                    styles.parkingTitle,
                    { color: theme.colors.text, fontFamily: theme.fonts.bold },
                  ]}
                >
                  {snapshot.parking.availableSlots}/{snapshot.parking.totalSlots} chỗ trống
                </Text>
                <StatusBadge
                  label={getTelemetryHealthLabel(snapshot.telemetryHealth)}
                  tone={healthTone}
                />
              </View>

              <Text
                style={[
                  styles.metaText,
                  { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
                ]}
              >
                {snapshot.parking.activeSessions} lượt gửi xe · cập nhật{' '}
                {formatDateTime(snapshot.parking.lastUpdated)}
              </Text>

              <View style={styles.badgeRow}>
                <StatusBadge
                  label={`Nhiệt độ ${snapshot.parking.sensors.temperature ?? '--'}°C`}
                  tone="info"
                />
                <StatusBadge
                  label={`Độ ẩm ${snapshot.parking.sensors.humidity ?? '--'}%`}
                  tone="success"
                />
                <StatusBadge
                  label={snapshot.parking.sensors.rainDetected ? 'Có mưa' : 'Khô ráo'}
                  tone="warning"
                />
                {snapshot.parking.sensors.fireDetected ? (
                  <StatusBadge label="Cảnh báo cháy" tone="danger" />
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

        <SectionCard
          title="Truy cập nhanh"
          subtitle="Các tính năng dùng nhiều nhất."
          variant="outlined"
        >
          <View style={styles.quickGrid}>
            {quickActionRows.map((row, rowIndex) => (
              <View key={`quick-row-${rowIndex}`} style={styles.quickRow}>
                {row.map((action) => (
                  <QuickActionTile
                    key={action.id}
                    icon={action.icon as never}
                    label={action.label}
                    description={ACTION_DESCRIPTIONS[action.id] ?? 'Mở để tiếp tục.'}
                    route={action.route}
                  />
                ))}
                {row.length === 1 ? <View style={styles.quickCardSpacer} /> : null}
              </View>
            ))}
          </View>
        </SectionCard>

        {!isOperationsRole && !isLecturer ? (
          <SectionCard
            title="Kết quả học tập"
            subtitle="Xem nhanh GPA và số tín chỉ."
            variant="outlined"
          >
            <View style={styles.sectionStack}>
              <Text
                style={[
                  styles.gpaValue,
                  { color: theme.colors.text, fontFamily: theme.fonts.bold },
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
                {snapshot.gpa?.totalCourses ?? 0} học phần · {snapshot.gpa?.totalCredits ?? 0} tín
                chỉ
              </Text>
            </View>
          </SectionCard>
        ) : null}
      </ContentStack>
    </Screen>
  );
}

function QuickActionTile({
  icon,
  label,
  description,
  route,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  route: string;
}) {
  const theme = useAppTheme();
  const router = useRouter();

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
      ]}
    >
      <View style={styles.quickHeader}>
        <View style={[styles.quickIconWrap, { backgroundColor: theme.colors.primarySurface }]}>
          <Ionicons name={icon} size={20} color={theme.colors.primary} />
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
      ? 'Cảnh báo cháy đang kích hoạt'
      : state === 'offline'
        ? 'Gateway đang mất kết nối'
        : 'Dữ liệu cảm biến chưa được làm mới';
  const description =
    state === 'fire-alert'
      ? 'Ưu tiên kiểm tra trạng thái an toàn và xử lý theo quy trình.'
      : state === 'offline'
        ? 'Ứng dụng sẽ cập nhật lại khi gateway online.'
        : 'Ứng dụng đang hiển thị dữ liệu gần nhất.';

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

const styles = StyleSheet.create({
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
    color: '#FFFFFF',
  },
  sectionStack: {
    gap: 12,
  },
  opsButtons: {
    gap: 10,
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
    fontSize: 17,
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
});
