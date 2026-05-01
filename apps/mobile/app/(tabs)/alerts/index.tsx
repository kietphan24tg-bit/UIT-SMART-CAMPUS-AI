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

export default function AlertsScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const role = useAuthStore((state) => state.user?.role);
  const router = useRouter();
  const alerts = useAlertFeed(role);
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
  const unreadCount = feedItems.filter((item) => !item.isRead).length;

  const filteredItems = useMemo(() => {
    if (filter === 'unread') {
      return feedItems.filter((item) => !item.isRead);
    }

    if (filter === 'all') {
      return feedItems;
    }

    return feedItems.filter((item) => item.category === filter);
  }, [feedItems, filter]);

  const groupedSections = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        items: filteredItems.filter((item) => item.category === category),
      })).filter((section) => section.items.length > 0),
    [filteredItems],
  );

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
        <SectionCard
          title="Bộ lọc"
          subtitle={`${feedItems.length} mục · ${unreadCount} chưa đọc`}
          actionLabel={unreadCount > 0 ? 'Đọc tất cả' : undefined}
          onActionPress={unreadCount > 0 ? () => void alerts.markAllAsRead() : undefined}
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
        </SectionCard>

        {alerts.isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Không tải được cảnh báo"
            description="Kéo xuống để thử lại."
          />
        ) : null}

        {groupedSections.length > 0 ? (
          groupedSections.map(({ category, items }) => (
            <SectionCard
              key={category}
              title={CATEGORY_LABELS[category]}
              subtitle={`${items.length} mục`}
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
                  <AlertRow
                    key={`${item.kind}-${item.id}`}
                    item={item}
                    width={cardWidth}
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
        ) : (
          <EmptyState
            icon={filter === 'unread' ? 'notifications-off-outline' : 'shield-checkmark-outline'}
            title="Không có mục phù hợp"
            description="Đổi bộ lọc hoặc kéo xuống để làm mới."
          />
        )}
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

function AlertRow({
  item,
  width,
  onPress,
}: {
  item: AlertFeedItem;
  width: number | '100%';
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
    <TouchableOpacity
      accessibilityRole="button"
      testID={`alert-row-${item.id}`}
      onPress={onPress}
      style={[
        styles.alertRow,
        {
          width,
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: item.severity === 'critical' ? theme.colors.danger : theme.colors.border,
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
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
});
