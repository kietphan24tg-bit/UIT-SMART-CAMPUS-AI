import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  ContentStack,
  EmptyState,
  Screen,
  SecondaryButton,
  SectionCard,
  StatusBadge,
  TopHero,
} from '@/components/ui';
import { useAlertFeed } from '@/hooks/use-alert-feed';
import { usePushNotificationStatus } from '@/hooks/use-push-notification-status';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import type { AlertCategory, AlertFeedItem } from '@/types/app-data';
import { formatDateTime, getRoleLabel, getSeverityLabel, isAdminRole } from '@/utils/app';

type FilterKey = 'all' | 'general' | 'academic' | 'payment' | 'emergency' | 'unread';

const FILTER_OPTIONS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'general', label: 'Chung' },
  { key: 'academic', label: 'Học vụ' },
  { key: 'payment', label: 'Thanh toán' },
  { key: 'emergency', label: 'Khẩn cấp' },
  { key: 'unread', label: 'Chưa đọc' },
];

const CATEGORY_LABELS: Record<AlertCategory, string> = {
  general: 'Chung',
  academic: 'Học vụ',
  payment: 'Thanh toán',
  emergency: 'Khẩn cấp',
};

const CATEGORY_TONES: Record<AlertCategory, 'info' | 'warning' | 'danger'> = {
  general: 'info',
  academic: 'warning',
  payment: 'warning',
  emergency: 'danger',
};

const CATEGORY_ORDER: AlertCategory[] = ['emergency', 'payment', 'academic', 'general'];
const EMPTY_FEED_ITEMS: AlertFeedItem[] = [];
const ALERT_FEED_GAP = 12;

function buildDeleteQueryForFilter(filter: FilterKey) {
  if (filter === 'unread') {
    return { unreadOnly: true } as const;
  }

  if (filter === 'all') {
    return null;
  }

  return { category: filter } as const;
}

export default function AlertsScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const role = useAuthStore((state) => state.user?.role);
  const router = useRouter();
  const alerts = useAlertFeed(role);
  const pushStatus = usePushNotificationStatus();
  const feedItems = alerts.data ?? EMPTY_FEED_ITEMS;
  const [filter, setFilter] = useState<FilterKey>('all');
  const [feedWidth, setFeedWidth] = useState(0);

  const cardColumns = layout.isTablet ? 2 : 1;
  const cardWidth =
    cardColumns === 1
      ? '100%'
      : feedWidth > 0
        ? Math.max((feedWidth - ALERT_FEED_GAP * (cardColumns - 1)) / cardColumns, 0)
        : '100%';
  const canViewFireAlerts = isAdminRole(role);
  const notificationItems = useMemo(
    () => feedItems.filter((item) => item.kind === 'notification'),
    [feedItems],
  );
  const fireAlertItems = useMemo(
    () => feedItems.filter((item) => item.kind === 'fire_alert'),
    [feedItems],
  );
  const unreadNotificationCount = notificationItems.filter((item) => !item.isRead).length;

  const filteredNotificationItems = useMemo(() => {
    if (filter === 'unread') {
      return notificationItems.filter((item) => !item.isRead);
    }

    if (filter === 'all') {
      return notificationItems;
    }

    return notificationItems.filter((item) => item.category === filter);
  }, [filter, notificationItems]);

  const filteredFireAlertItems = useMemo(() => {
    if (!canViewFireAlerts) {
      return EMPTY_FEED_ITEMS;
    }

    if (filter === 'all' || filter === 'emergency') {
      return fireAlertItems;
    }

    if (filter === 'unread') {
      return fireAlertItems.filter((item) => !item.isRead);
    }

    return EMPTY_FEED_ITEMS;
  }, [canViewFireAlerts, filter, fireAlertItems]);

  const notificationSections = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        items: filteredNotificationItems.filter((item) => item.category === category),
      })).filter((section) => section.items.length > 0),
    [filteredNotificationItems],
  );

  const bulkDeleteQuery = useMemo(() => buildDeleteQueryForFilter(filter), [filter]);
  const canBulkDeleteCurrentFilter =
    filter !== 'all' && filteredNotificationItems.length > 0 && bulkDeleteQuery != null;

  const confirmDeleteNotification = (item: AlertFeedItem) => {
    Alert.alert('Xóa thông báo', 'Thông báo này sẽ bị xóa khỏi hộp thư cá nhân của bạn.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          if (alerts.isMutating) {
            return;
          }

          void alerts.deleteNotification(item.id);
        },
      },
    ]);
  };

  const confirmDeleteSection = (category: AlertCategory) => {
    Alert.alert(
      'Xóa tất cả thông báo',
      `Toàn bộ thông báo ${CATEGORY_LABELS[category].toLowerCase()} của bạn sẽ bị xóa.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: () => {
            if (alerts.isMutating) {
              return;
            }

            void alerts.deleteNotifications({ category });
          },
        },
      ],
    );
  };

  const confirmDeleteCurrentFilter = () => {
    if (!bulkDeleteQuery) {
      return;
    }

    const filterLabel =
      filter === 'unread' ? 'chưa đọc' : CATEGORY_LABELS[filter as AlertCategory].toLowerCase();
    Alert.alert(
      'Xóa tất cả thông báo',
      `Toàn bộ thông báo ${filterLabel} trong bộ lọc hiện tại sẽ bị xóa.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: () => {
            if (alerts.isMutating) {
              return;
            }

            void alerts.deleteNotifications(bulkDeleteQuery);
          },
        },
      ],
    );
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={alerts.isRefetching || pushStatus.isRefetching}
          onRefresh={() => {
            void alerts.refetch();
            void pushStatus.refetch();
          }}
          tintColor={theme.colors.primary}
        />
      }
    >
      <TopHero
        eyebrow="Cảnh báo"
        title="Trung tâm cảnh báo"
        subtitle={
          isAdminRole(role)
            ? 'Theo dõi cảnh báo vận hành và thông báo ưu tiên.'
            : 'Theo dõi thông báo mới và mục chưa đọc.'
        }
        badge={{ label: getRoleLabel(role), tone: 'info' }}
        showBrand
        variant="accent"
      />

      <ContentStack>
        <PushNotificationStatusCard
          status={pushStatus.data}
          isLoading={pushStatus.isLoading}
          isRetrying={pushStatus.isRetrying}
          onRetry={() => void pushStatus.retrySync()}
        />

        <SectionCard
          title="Bộ lọc"
          subtitle={`${feedItems.length} mục · ${unreadNotificationCount} chưa đọc`}
          variant="highlight"
          tone="academic"
        >
          <View style={styles.filterRow}>
            {FILTER_OPTIONS.map((option) => (
              <FilterChip
                key={option.key}
                label={option.label}
                active={filter === option.key}
                onPress={() => setFilter(option.key)}
              />
            ))}
          </View>

          <View style={styles.bulkActions}>
            {unreadNotificationCount > 0 ? (
              <SecondaryButton
                label="Đọc tất cả"
                onPress={() => void alerts.markAllAsRead()}
                disabled={alerts.isMutating}
              />
            ) : null}
            {canBulkDeleteCurrentFilter ? (
              <SecondaryButton
                label="Xóa tất cả"
                onPress={confirmDeleteCurrentFilter}
                disabled={alerts.isMutating}
              />
            ) : null}
          </View>
        </SectionCard>

        {alerts.isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Không tải được cảnh báo"
            description="Kéo xuống để thử lại."
          />
        ) : null}

        {notificationSections.length > 0 ? (
          notificationSections.map(({ category, items }) => (
            <SectionCard
              key={category}
              title={CATEGORY_LABELS[category]}
              subtitle={`${items.length} mục`}
              actionLabel={filter === 'all' ? 'Xóa tất cả' : undefined}
              onActionPress={
                filter === 'all'
                  ? () => {
                      confirmDeleteSection(category);
                    }
                  : undefined
              }
              variant={category === 'emergency' ? 'danger' : 'list'}
              tone={category === 'emergency' ? 'danger' : 'neutral'}
              headerAccessory={
                <StatusBadge
                  label={CATEGORY_LABELS[category]}
                  tone={CATEGORY_TONES[category]}
                  size="sm"
                />
              }
            >
              <View
                style={styles.feed}
                onLayout={({ nativeEvent }) => {
                  const nextWidth = nativeEvent.layout.width;
                  if (nextWidth !== feedWidth) {
                    setFeedWidth(nextWidth);
                  }
                }}
              >
                {items.map((item) => (
                  <AlertCard
                    key={`${item.kind}-${item.id}`}
                    item={item}
                    width={cardWidth}
                    canDelete
                    onDelete={() => confirmDeleteNotification(item)}
                    onPress={async () => {
                      if (item.kind === 'notification' && !item.isRead) {
                        await alerts.markAsRead(item.id);
                      }

                      router.push({
                        pathname: '/alerts/[id]',
                        params: { id: item.id, kind: item.kind },
                      } as never);
                    }}
                  />
                ))}
              </View>
            </SectionCard>
          ))
        ) : null}

        {filteredFireAlertItems.length > 0 ? (
          <SectionCard
            title="Fire alert vận hành"
            subtitle={`${filteredFireAlertItems.length} mục`}
            variant="danger"
            tone="danger"
            headerAccessory={<StatusBadge label="Read only" tone="danger" size="sm" />}
          >
            <View
              style={styles.feed}
              onLayout={({ nativeEvent }) => {
                const nextWidth = nativeEvent.layout.width;
                if (nextWidth !== feedWidth) {
                  setFeedWidth(nextWidth);
                }
              }}
            >
              {filteredFireAlertItems.map((item) => (
                <AlertCard
                  key={`${item.kind}-${item.id}`}
                  item={item}
                  width={cardWidth}
                  onPress={() => {
                    router.push({
                      pathname: '/alerts/[id]',
                      params: { id: item.id, kind: item.kind },
                    } as never);
                  }}
                />
              ))}
            </View>
          </SectionCard>
        ) : null}

        {notificationSections.length === 0 && filteredFireAlertItems.length === 0 ? (
          <EmptyState
            icon={filter === 'unread' ? 'notifications-off-outline' : 'shield-checkmark-outline'}
            title="Không có mục phù hợp"
            description="Đổi bộ lọc hoặc kéo xuống để làm mới."
          />
        ) : null}
      </ContentStack>
    </Screen>
  );
}

function PushNotificationStatusCard({
  status,
  isLoading,
  isRetrying,
  onRetry,
}: {
  status?: {
    status: 'enabled_synced' | 'enabled_sync_failed' | 'permission_denied' | 'unsupported_build';
    lastSuccessfulPushSyncAt: string | null;
    errorMessage: string | null;
  } | null;
  isLoading: boolean;
  isRetrying: boolean;
  onRetry: () => void;
}) {
  const theme = useAppTheme();

  if (isLoading && !status) {
    return (
      <SectionCard title="Thông báo trên thiết bị" subtitle="Đang kiểm tra trạng thái" variant="outlined">
        <Text style={[styles.pushCopy, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
          Ứng dụng đang kiểm tra quyền thông báo và trạng thái đăng ký thiết bị.
        </Text>
      </SectionCard>
    );
  }

  const statusTone =
    status?.status === 'enabled_synced'
      ? 'success'
      : status?.status === 'unsupported_build'
        ? 'warning'
        : 'danger';
  const statusLabel =
    status?.status === 'enabled_synced'
      ? 'Đang hoạt động'
      : status?.status === 'enabled_sync_failed'
        ? 'Cần sync lại'
        : status?.status === 'unsupported_build'
          ? 'Build chưa hỗ trợ'
          : 'Chưa cấp quyền';
  const statusDescription =
    status?.status === 'enabled_synced'
      ? 'Thiết bị đã được cấp quyền và đã đăng ký nhận push thành công với hệ thống.'
      : status?.status === 'enabled_sync_failed'
        ? 'Bạn đã cho phép thông báo, nhưng thiết bị chưa đăng ký thành công với backend.'
        : status?.status === 'unsupported_build'
          ? 'Bản build hiện tại chưa đủ cấu hình để nhận push trên thiết bị này.'
          : 'Thiết bị chưa cấp quyền nhận thông báo cho ứng dụng.';

  return (
    <SectionCard
      title="Thông báo trên thiết bị"
      subtitle="Quyền hệ thống và trạng thái đăng ký push"
      variant="outlined"
      headerAccessory={<StatusBadge label={statusLabel} tone={statusTone} size="sm" />}
    >
      <View style={styles.pushStatusContent}>
        <Text style={[styles.pushCopy, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
          {statusDescription}
        </Text>

        {status?.lastSuccessfulPushSyncAt ? (
          <Text style={[styles.pushMeta, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}>
            Sync thành công lần cuối: {formatDateTime(status.lastSuccessfulPushSyncAt)}
          </Text>
        ) : null}

        {status?.errorMessage && status.status !== 'permission_denied' ? (
          <Text style={[styles.pushMeta, { color: theme.colors.danger, fontFamily: theme.fonts.medium }]}>
            {status.errorMessage}
          </Text>
        ) : null}

        <View style={styles.pushActionRow}>
          {status?.status === 'enabled_sync_failed' ? (
            <SecondaryButton label={isRetrying ? 'Đang thử lại...' : 'Thử lại'} onPress={onRetry} disabled={isRetrying} />
          ) : null}
          {status?.status === 'permission_denied' || status?.status === 'unsupported_build' ? (
            <SecondaryButton
              label="Mở cài đặt"
              onPress={() => {
                void Linking.openSettings();
              }}
            />
          ) : null}
        </View>
      </View>
    </SectionCard>
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
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: active ? theme.colors.primarySurface : theme.colors.surfaceSubtle,
          borderColor: active ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.filterLabel,
          { color: active ? theme.colors.primary : theme.colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function AlertCard({
  item,
  width,
  canDelete = false,
  onDelete,
  onPress,
}: {
  item: AlertFeedItem;
  width: number | '100%';
  canDelete?: boolean;
  onDelete?: () => void;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const tone =
    item.severity === 'critical' ? 'danger' : item.severity === 'warning' ? 'warning' : 'info';

  const metaParts = [getSeverityLabel(item.severity), formatDateTime(item.timestamp)];
  if (!item.isRead) {
    metaParts.unshift('Chưa đọc');
  }

  return (
    <View testID={`alert-row-${item.id}`} style={[styles.alertShell, { width }]}>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={onPress}
        style={[
          styles.alertRow,
          {
            backgroundColor: theme.colors.surfaceSubtle,
            borderColor: item.severity === 'critical' ? theme.colors.danger : theme.colors.border,
            paddingRight: canDelete ? 60 : 14,
          },
          theme.elevation.level0,
        ]}
      >
        <View style={styles.alertHeader}>
          <StatusBadge label={getSeverityLabel(item.severity)} tone={tone} size="sm" />
          {!item.isRead ? <Ionicons name="ellipse" size={10} color={theme.colors.primary} /> : null}
        </View>

        <Text style={[styles.alertTitle, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
          {item.title}
        </Text>

        <Text
          numberOfLines={2}
          style={[
            styles.alertBody,
            { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
          ]}
        >
          {item.body}
        </Text>

        <Text
          numberOfLines={1}
          style={[
            styles.alertMeta,
            { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
          ]}
        >
          {metaParts.join(' · ')}
        </Text>
      </TouchableOpacity>

      {canDelete && onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xóa thông báo"
          onPress={onDelete}
          style={[
            styles.deleteButton,
            {
              backgroundColor: theme.colors.dangerSurface,
              borderColor: theme.colors.danger,
            },
          ]}
          testID={`alert-delete-${item.id}`}
        >
          <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bulkActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  feed: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ALERT_FEED_GAP,
    width: '100%',
  },
  alertShell: {
    position: 'relative',
  },
  alertRow: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    minHeight: 138,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  alertTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  alertBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  alertMeta: {
    fontSize: 12,
    lineHeight: 16,
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pushStatusContent: {
    gap: 10,
  },
  pushCopy: {
    fontSize: 14,
    lineHeight: 20,
  },
  pushMeta: {
    fontSize: 12,
    lineHeight: 18,
  },
  pushActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
