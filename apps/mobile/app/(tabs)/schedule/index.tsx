import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { MetricGrid, RoleTaskSection } from '@/components/tasks';
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
import {
  formatDateTime,
  getDayLabel,
  getRoleLabel,
  groupScheduleByDay,
  isAdminRole,
  isLecturerRole,
} from '@/utils/app';
import {
  getLecturerDashboardSnapshot,
  getOperationsSummary,
} from '@/utils/role-ui';

export default function ScheduleScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | undefined>(undefined);

  const isOperations = isAdminRole(role);
  const isLecturer = isLecturerRole(role);
  const scheduleState = useScheduleScreenData(selectedSemesterId);
  const operationsState = useOperationsScreenData();

  if (isOperations) {
    const operations = getOperationsSummary(role, operationsState.data);

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
          eyebrow="Operations"
          title={role === 'super_admin' ? 'Trung tam van hanh UIT' : 'Bang dieu phoi van hanh'}
          subtitle="Parking, fire alerts, room approvals va gateway health duoc gom vao mot tab mobile-first cho Admin va Super Admin."
          badge={{ label: getRoleLabel(role), tone: 'info' }}
        />

        <ContentStack>
          <MetricGrid items={operations.metrics} />

          <RoleTaskSection
            title="Tac vu van hanh"
            subtitle="Cac action chinh de backend co diem vao CRUD va workflow ro rang."
            tasks={operations.quickTasks}
            onPressTask={(route) => router.push(route as never)}
          />

          <RoleTaskSection
            title={role === 'super_admin' ? 'System oversight' : 'Hang doi xu ly'}
            subtitle="Queue items va entry points theo role van nam trong cung family Operations."
            tasks={operations.queueItems}
            onPressTask={(route) => router.push(route as never)}
          />

          <SectionCard title="Gateway zones" subtitle="Tong hop suc khoe zone va ghi chu van hanh.">
            <View style={styles.grid}>
              {operations.gatewayZones.map((zone) => (
                <View
                  key={zone.id}
                  style={[
                    styles.zoneCard,
                    {
                      backgroundColor: theme.colors.surfaceSubtle,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <StatusBadge
                    label={zone.health}
                    tone={
                      zone.health === 'offline'
                        ? 'danger'
                        : zone.health === 'warning' || zone.health === 'stale'
                          ? 'warning'
                          : 'success'
                    }
                  />
                  <Text style={[styles.zoneTitle, { color: theme.colors.text }]}>{zone.label}</Text>
                  <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                    {zone.deviceCount} thiet bi · {zone.lastUpdated}
                  </Text>
                  <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>{zone.issueSummary}</Text>
                </View>
              ))}
            </View>
          </SectionCard>

          <SectionCard title="Permission summary" subtitle="Luon hien ro access level, khong de user phai doan quyen.">
            <View style={styles.column}>
              {operations.permissionSummary.map((item) => (
                <View key={item.id} style={styles.column}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.zoneTitle, { color: theme.colors.text }]}>{item.label}</Text>
                    <StatusBadge
                      label={item.accessLevel === 'full' ? 'Toan quyen' : item.accessLevel === 'limited' ? 'Co gioi han' : 'Chi xem'}
                      tone={item.accessLevel === 'full' ? 'success' : 'info'}
                    />
                  </View>
                  <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>{item.description}</Text>
                </View>
              ))}
            </View>
          </SectionCard>

          <SectionCard
            title={role === 'super_admin' ? 'System alerts' : 'Van hanh gan day'}
            subtitle="Card ngan gon de khong desktop-hoa tab Operations."
          >
            <View style={styles.column}>
              {operations.systemAlerts.map((alert) => (
                <View
                  key={alert}
                  style={[
                    styles.inlineItem,
                    {
                      backgroundColor: theme.colors.surfaceSubtle,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>{alert}</Text>
                </View>
              ))}
              {operationsState.data?.telemetry ? (
                <Text style={[styles.metaText, { color: theme.colors.textSoft }]}>
                  Gateway {operationsState.data.telemetry.deviceIp || 'unknown'} · reported {formatDateTime(operationsState.data.telemetry.reportedAt)}
                </Text>
              ) : null}
            </View>
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
  const lecturer = isLecturer ? getLecturerDashboardSnapshot(scheduleState.schedule) : null;

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
        eyebrow="Academic schedule"
        title={isLecturer ? 'Lich day & tac vu lop' : 'Lich hoc tuan nay'}
        subtitle={
          isLecturer
            ? 'Lich day cua lecturer duoc giu chung family voi attendance, grade sheet va class notifications.'
            : 'Thiet ke tap trung vao hoc ky, buoi tiep theo va lich theo ngay de UITer quet nhanh.'
        }
        badge={{ label: getRoleLabel(role), tone: 'info' }}
      />

      <ContentStack>
        {lecturer ? <MetricGrid items={lecturer.metrics} /> : null}

        <SectionCard title="Hoc ky" subtitle="Chon hoc ky de loc dung lich dang quan tam.">
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

        <SectionCard title={isLecturer ? 'Buoi day tiep theo' : 'Buoi gan nhat'} subtitle="Card uu tien de nguoi dung ra quyet dinh nhanh.">
          {scheduleState.schedule[0] ? (
            <View style={styles.column}>
              <Text style={[styles.zoneTitle, { color: theme.colors.text }]}>
                {scheduleState.schedule[0].course.name}
              </Text>
              <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                {getDayLabel(scheduleState.schedule[0].dayOfWeek)} · {scheduleState.schedule[0].startTime} - {scheduleState.schedule[0].endTime} · Phong {scheduleState.schedule[0].room}
              </Text>
            </View>
          ) : (
            <EmptyState
              icon="calendar-clear-outline"
              title="Khong co lich trong hoc ky nay"
              description="Khi backend co du lieu lich cho hoc ky duoc chon, danh sach theo ngay se hien thi ngay ben duoi."
            />
          )}
        </SectionCard>

        {lecturer ? (
          <>
            <RoleTaskSection
              title="Tac vu giang day"
              subtitle="Nhung viec can xu ly nhanh trong ca day hien tai."
              tasks={lecturer.focusTasks}
              onPressTask={(route) => router.push(route as never)}
            />
            <RoleTaskSection
              title="Lop dang theo doi"
              subtitle="Class dashboard, attendance, grade va thong bao van nam trong cung family Schedule."
              tasks={lecturer.activeClasses}
              onPressTask={(route) => router.push(route as never)}
            />
            <SectionCard title="Action screens" subtitle="Long-form flows duoc tach rieng de de thao tac tren Android.">
              <View style={styles.column}>
                <StatusAction label="Class dashboard" route="/schedule/class-dashboard" onPress={(route) => router.push(route as never)} />
                <StatusAction label="Create / edit session" route="/schedule/session-editor" onPress={(route) => router.push(route as never)} />
                <StatusAction label="Attendance report" route="/schedule/attendance-report" onPress={(route) => router.push(route as never)} />
              </View>
            </SectionCard>
          </>
        ) : null}

        <SectionCard title="Theo ngay" subtitle="Gom lich theo thu de de quet nhanh tren phone va tablet.">
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
                  <Text style={[styles.zoneTitle, { color: theme.colors.text }]}>
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
              title="Chua co lich hoc nao"
              description="Man nay da co empty state, loading state va lecturer actions de no backend that sau nay."
            />
          )}
        </SectionCard>
      </ContentStack>
    </Screen>
  );
}

function StatusAction({
  label,
  route,
  onPress,
}: {
  label: string;
  route: string;
  onPress: (route: string) => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={() => onPress(route)}
      style={[
        styles.inlineItem,
        {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.zoneTitle, { color: theme.colors.text }]}>{label}</Text>
      <Text style={[styles.metaText, { color: theme.colors.primary }]}>Mo</Text>
    </Pressable>
  );
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
  zoneCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    flex: 1,
    minWidth: 240,
  },
  zoneTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  className: {
    fontSize: 15,
    fontWeight: '700',
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
  },
  inlineItem: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
});
