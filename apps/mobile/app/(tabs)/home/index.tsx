import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import { MetricGrid, RoleTaskSection } from '@/components/tasks';
import {
  ContentStack,
  EmptyState,
  Screen,
  SectionCard,
  StatusBadge,
  TopHero,
} from '@/components/ui';
import { useDashboardSnapshot } from '@/hooks/use-dashboard-snapshot';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import {
  formatDateTime,
  formatGpaValue,
  getDashboardHeroSummary,
  getGreetingName,
  getRoleLabel,
  getRoleQuickActions,
  getTelemetryHealthLabel,
  isAdminRole,
} from '@/utils/app';
import { getHomeRoleModel } from '@/utils/role-ui';

export default function HomeScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const dashboard = useDashboardSnapshot(user?.role);
  const quickActions = getRoleQuickActions(user?.role);
  const roleModel = getHomeRoleModel(dashboard.data.role, dashboard.data);
  const quickColumns = layout.getGridColumns({
    minItemWidth: 150,
    gap: 12,
    maxColumns: layout.isTablet ? 3 : 2,
  });
  const quickCardWidth = layout.getGridItemWidth({ columns: quickColumns, gap: 12 });

  const emergencyTone =
    dashboard.data.telemetryHealth === 'fire-alert'
      ? 'danger'
      : dashboard.data.telemetryHealth === 'stale' || dashboard.data.telemetryHealth === 'offline'
        ? 'warning'
        : 'info';

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
        eyebrow="Dashboard ca nhan hoa"
        title={`Xin chao, ${getGreetingName(user)}!`}
        subtitle={getDashboardHeroSummary(dashboard.data)}
        badge={{ label: getRoleLabel(user?.role), tone: 'info' }}
      />

      <ContentStack>
        {dashboard.data.telemetryHealth !== 'online' ? (
          <View
            style={[
              styles.banner,
              layout.isCompact ? styles.bannerStacked : null,
              {
                backgroundColor:
                  emergencyTone === 'danger'
                    ? theme.colors.emergencySurface
                    : theme.colors.warningSurface,
                borderColor:
                  emergencyTone === 'danger' ? theme.colors.emergency : theme.colors.warning,
              },
            ]}
          >
            <Ionicons
              name={emergencyTone === 'danger' ? 'warning-outline' : 'cloud-offline-outline'}
              size={20}
              color={emergencyTone === 'danger' ? theme.colors.emergency : theme.colors.warning}
            />
            <View style={styles.bannerContent}>
              <Text
                style={[
                  styles.bannerTitle,
                  {
                    color:
                      emergencyTone === 'danger' ? theme.colors.emergency : theme.colors.warning,
                  },
                ]}
              >
                {getTelemetryHealthLabel(dashboard.data.telemetryHealth)}
              </Text>
              <Text style={[styles.bannerText, { color: theme.colors.textMuted }]}>
                {dashboard.data.telemetryHealth === 'fire-alert'
                  ? 'Cam bien lua dang kich hoat tai khu parking. Uu tien kiem tra canh bao ngay.'
                  : 'Du lieu parking chua duoc lam moi dung chu ky. App van giu snapshot gan nhat de ban theo doi.'}
              </Text>
            </View>
          </View>
        ) : null}

        <MetricGrid items={roleModel.metrics} />

        <SectionCard title="Thao tac nhanh" subtitle="Duong vao chinh thay doi theo tung role nhung van giu mot bo cuc UIT thong nhat.">
          <View style={styles.quickGrid}>
            {quickActions.map((action) => (
              <View
                key={action.id}
                style={[
                  styles.quickCard,
                  { width: quickCardWidth },
                  {
                    backgroundColor: theme.colors.surfaceSubtle,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Ionicons name={action.icon as never} size={22} color={theme.colors.primary} />
                <Text style={[styles.quickLabel, { color: theme.colors.text }]}>{action.label}</Text>
                <Text
                  style={[styles.quickLink, { color: theme.colors.primary }]}
                  onPress={() => router.push(action.route as never)}
                >
                  Mo
                </Text>
              </View>
            ))}
          </View>
        </SectionCard>

        <RoleTaskSection
          title={roleModel.focusTitle}
          subtitle={roleModel.focusSubtitle}
          tasks={roleModel.focusTasks}
          onPressTask={(route) => router.push(route as never)}
        />

        {roleModel.supportTasks?.length ? (
          <RoleTaskSection
            title={roleModel.supportTitle || 'Tac vu ho tro'}
            subtitle={roleModel.supportSubtitle}
            tasks={roleModel.supportTasks}
            onPressTask={(route) => router.push(route as never)}
          />
        ) : null}

        {!isAdminRole(user?.role) ? (
          <SectionCard
            title="Buoi tiep theo"
            subtitle="Thong tin buoi hoc hoac buoi day sap toi can duoc quet nhanh tren mobile."
            actionLabel="Xem lich"
            onActionPress={() => router.push('/schedule')}
          >
            {dashboard.data.nextClass ? (
              <View style={styles.column}>
                <View style={[styles.rowBetween, layout.isCompact ? styles.rowBetweenStacked : null]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.classTitle, { color: theme.colors.text }]}>
                      {dashboard.data.nextClass.course.name}
                    </Text>
                    <Text style={[styles.classMeta, { color: theme.colors.textMuted }]}>
                      {dashboard.data.nextClass.course.code} · {dashboard.data.nextClass.instructor}
                    </Text>
                  </View>
                  <StatusBadge label={`Phong ${dashboard.data.nextClass.room}`} tone="primary" />
                </View>
                <Text style={[styles.classTime, { color: theme.colors.primary }]}>
                  {dashboard.data.nextClass.startTime} - {dashboard.data.nextClass.endTime}
                </Text>
              </View>
            ) : (
              <EmptyState
                icon="calendar-clear-outline"
                title="Hom nay chua co lich moi"
                description="Khi co lich hoc hoac lich day, buoi gan nhat se xuat hien tai day de ban quyet dinh nhanh."
              />
            )}
          </SectionCard>
        ) : null}

        <SectionCard
          title={isAdminRole(user?.role) ? 'Parking & telemetry' : 'Parking + IoT'}
          subtitle="Hero status, slot snapshot va telemetry cua bai xe UIT duoc giu gon de hop mobile phone va tablet."
          actionLabel="Mo parking"
          onActionPress={() => router.push('/parking')}
        >
          {dashboard.data.parking ? (
            <View style={styles.column}>
              <View style={[styles.rowBetween, layout.isCompact ? styles.rowBetweenStacked : null]}>
                <Text style={[styles.classTitle, { color: theme.colors.text }]}>
                  {dashboard.data.parking.availableSlots}/{dashboard.data.parking.totalSlots} cho trong
                </Text>
                <StatusBadge
                  label={getTelemetryHealthLabel(dashboard.data.telemetryHealth)}
                  tone={emergencyTone}
                />
              </View>
              <Text style={[styles.classMeta, { color: theme.colors.textMuted }]}>
                {dashboard.data.parking.activeSessions} session dang mo · cap nhat {formatDateTime(dashboard.data.parking.lastUpdated)}
              </Text>
              <View style={styles.sensorRow}>
                <StatusBadge
                  label={`Temp ${dashboard.data.parking.sensors.temperature ?? '--'}°C`}
                  tone="info"
                />
                <StatusBadge
                  label={`Humidity ${dashboard.data.parking.sensors.humidity ?? '--'}%`}
                  tone="success"
                />
                <StatusBadge
                  label={dashboard.data.parking.sensors.fireDetected ? 'Fire alert' : 'An toan'}
                  tone={dashboard.data.parking.sensors.fireDetected ? 'danger' : 'success'}
                />
              </View>
            </View>
          ) : (
            <EmptyState
              icon="car-sport-outline"
              title="Parking chua san sang"
              description="App chua lay duoc snapshot bai xe o thoi diem hien tai. Ban van co the mo man parking chi tiet hoac thu tai lai."
            />
          )}
        </SectionCard>

        {!isAdminRole(user?.role) ? (
          <SectionCard title="GPA hien tai" subtitle="Student-first block van duoc giu gon va ro rang trong dashboard.">
            <Text style={[styles.classTitle, { color: theme.colors.text }]}>
              {formatGpaValue(dashboard.data.gpa?.gpa)}
            </Text>
            <Text style={[styles.classMeta, { color: theme.colors.textMuted }]}>
              {dashboard.data.gpa?.totalCourses ?? 0} hoc phan · {dashboard.data.gpa?.totalCredits ?? 0} tin chi
            </Text>
          </SectionCard>
        ) : null}
      </ContentStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  bannerStacked: {
    flexDirection: 'column',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  bannerText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  quickLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  quickLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  column: {
    gap: 12,
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
  classTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  classMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  classTime: {
    fontSize: 16,
    fontWeight: '700',
  },
  sensorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
