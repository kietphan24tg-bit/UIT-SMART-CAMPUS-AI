import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  ContentStack,
  EmptyState,
  Screen,
  SectionCard,
  StatusBadge,
  TopHero,
} from '@/components/ui';
import { useAlertFeed } from '@/hooks/use-alert-feed';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { formatDateTime, getRoleLabel, getSeverityLabel, isAdminRole } from '@/utils/app';

type FilterKey = 'all' | 'unread' | 'emergency';

export default function AlertsScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const role = useAuthStore((state) => state.user?.role);
  const router = useRouter();
  const alerts = useAlertFeed(role);
  const feedItems = alerts.data ?? [];
  const [filter, setFilter] = useState<FilterKey>('all');
  const feedColumns = layout.isTablet ? 2 : 1;
  const feedItemWidth = layout.getGridItemWidth({ columns: feedColumns, gap: 10 });

  const filteredItems = useMemo(() => {
    const items = alerts.data ?? [];
    if (filter === 'unread') {
      return items.filter((item) => !item.isRead);
    }
    if (filter === 'emergency') {
      return items.filter((item) => item.severity === 'critical');
    }
    return items;
  }, [alerts.data, filter]);

  const emergencyItems = filteredItems.filter((item) => item.severity === 'critical');
  const normalItems = filteredItems.filter((item) => item.severity !== 'critical');

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={alerts.isRefetching}
          onRefresh={() => void alerts.refetch()}
          tintColor={theme.colors.primary}
        />
      }
    >
      <TopHero
        eyebrow="Cảnh báo"
        title="Cảnh báo và thông báo"
        subtitle={
          isAdminRole(role)
            ? 'Gồm fire alert từ gateway và thông báo hệ thống.'
            : 'Thông báo học vụ, nhắc việc và cảnh báo theo quyền hiện tại.'
        }
        badge={{ label: getRoleLabel(role), tone: 'info' }}
      />

      <ContentStack>
        <SectionCard
          title="Bộ lọc nhanh"
          subtitle={`${feedItems.length} mục trong feed hiện tại.`}
          actionLabel="Đọc tất cả"
          onActionPress={() => void alerts.markAllAsRead()}
        >
          <View style={styles.filterRow}>
            <FilterChip label="Tất cả" active={filter === 'all'} onPress={() => setFilter('all')} />
            <FilterChip label="Chưa đọc" active={filter === 'unread'} onPress={() => setFilter('unread')} />
            <FilterChip label="Khẩn cấp" active={filter === 'emergency'} onPress={() => setFilter('emergency')} />
          </View>
        </SectionCard>

        {alerts.isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Không tải được danh sách cảnh báo"
            description="Kéo xuống để thử lại."
          />
        ) : null}

        <SectionCard
          title="Khẩn cấp"
          subtitle={
            isAdminRole(role)
              ? 'Ưu tiên fire alert ở đầu danh sách.'
              : 'Các mục quan trọng sẽ hiển thị ở phần đầu.'
          }
        >
          {emergencyItems.length > 0 ? (
            <View style={styles.feed}>
              {emergencyItems.map((item) => (
                <AlertRow
                  key={`${item.kind}-${item.id}`}
                  title={item.title}
                  body={item.body}
                  meta={`${getSeverityLabel(item.severity)} · ${formatDateTime(item.timestamp)}`}
                  severity={item.severity}
                  width={feedItemWidth}
                  unread={!item.isRead}
                  onPress={() =>
                    router.push(
                      {
                        pathname: '/alerts/[id]',
                        params: { id: item.id, kind: item.kind },
                      } as never,
                    )
                  }
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="shield-checkmark-outline"
              title="Không có mục khẩn cấp"
              description="Khi có cảnh báo nghiêm trọng, mục liên quan sẽ xuất hiện tại đây."
            />
          )}
        </SectionCard>

        <SectionCard title="Thông báo gần đây" subtitle="Gồm học vụ, hệ thống và nhắc việc.">
          {normalItems.length > 0 ? (
            <View style={styles.feed}>
              {normalItems.map((item) => (
                <AlertRow
                  key={`${item.kind}-${item.id}`}
                  title={item.title}
                  body={item.body}
                  meta={`${getSeverityLabel(item.severity)} · ${formatDateTime(item.timestamp)}`}
                  severity={item.severity}
                  width={feedItemWidth}
                  unread={!item.isRead}
                  onPress={async () => {
                    if (item.kind === 'notification' && !item.isRead) {
                      await alerts.markAsRead(item.id);
                    }
                    router.push(
                      {
                        pathname: '/alerts/[id]',
                        params: { id: item.id, kind: item.kind },
                      } as never,
                    );
                  }}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="notifications-off-outline"
              title="Không có thông báo phù hợp bộ lọc"
              description="Đổi bộ lọc hoặc kéo xuống để làm mới."
            />
          )}
        </SectionCard>
      </ContentStack>
    </Screen>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: active ? theme.colors.primarySurface : theme.colors.surfaceSubtle,
          borderColor: active ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.filterLabel, { color: active ? theme.colors.primary : theme.colors.textMuted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function AlertRow({
  title,
  body,
  meta,
  severity,
  width,
  unread,
  onPress,
}: {
  title: string;
  body: string;
  meta: string;
  severity: 'normal' | 'warning' | 'critical';
  width: number;
  unread: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const tone = severity === 'critical' ? 'danger' : severity === 'warning' ? 'warning' : 'info';

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.alertRow,
        { width },
        {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.alertHeader}>
        <StatusBadge label={getSeverityLabel(severity)} tone={tone} />
        {unread ? <Ionicons name="ellipse" size={10} color={theme.colors.primary} /> : null}
      </View>
      <Text style={[styles.alertTitle, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.alertBody, { color: theme.colors.textMuted }]}>{body}</Text>
      <Text style={[styles.alertMeta, { color: theme.colors.textSoft }]}>{meta}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  feed: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  alertRow: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  alertBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  alertMeta: {
    fontSize: 12,
  },
});
