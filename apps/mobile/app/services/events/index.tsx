import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  ContentStack,
  EmptyState,
  Screen,
  SkeletonBlock,
} from '@/components/ui';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import {
  EVENTS_PAGE_SIZE,
  eventsApi,
  type EventListItem,
  type ListEventsResponse,
} from '@/services/api/events';
import { useAppTheme } from '@/theme';

const PAGINATION_EDGE = 3;

function buildPaginationItems(
  totalPages: number,
  currentPage: number,
): Array<'ellipsis' | number> {
  if (totalPages <= 1) {
    return totalPages === 1 ? [1] : [];
  }
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage]);
  const delta = 1;
  for (let p = currentPage - delta; p <= currentPage + delta; p++) {
    if (p >= 1 && p <= totalPages) {
      pages.add(p);
    }
  }
  if (currentPage <= PAGINATION_EDGE) {
    for (let p = 1; p <= Math.min(PAGINATION_EDGE, totalPages); p++) {
      pages.add(p);
    }
  }
  if (currentPage > totalPages - PAGINATION_EDGE) {
    for (let p = Math.max(1, totalPages - PAGINATION_EDGE + 1); p <= totalPages; p++) {
      pages.add(p);
    }
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<'ellipsis' | number> = [];
  let prev: number | undefined;
  for (const p of sorted) {
    if (prev !== undefined && p - prev > 1) {
      out.push('ellipsis');
    }
    out.push(p);
    prev = p;
  }
  return out;
}

function EventsPagination({
  totalPages,
  currentPage,
  onPageChange,
  disabled,
}: {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const theme = useAppTheme();
  if (totalPages <= 1) {
    return null;
  }

  const items = buildPaginationItems(totalPages, currentPage);
  const chipSize = 40;
  const baseBorder = { borderWidth: 1, borderColor: theme.colors.border };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.paginationRow}
    >
      <PaginationNavButton
        icon="chevron-back"
        disabled={disabled || currentPage <= 1}
        onPress={() => onPageChange(currentPage - 1)}
        theme={theme}
        chipSize={chipSize}
        baseBorder={baseBorder}
        label="Trang trước"
      />
      {items.map((token, idx) =>
        token === 'ellipsis' ? (
          <View
            key={`e-${idx}`}
            style={[
              styles.pageChip,
              baseBorder,
              {
                minWidth: chipSize,
                height: chipSize,
                backgroundColor: theme.colors.surfaceElevated,
              },
            ]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Text
              style={[styles.pageEllipsis, { color: theme.colors.textMuted, fontFamily: theme.fonts.medium }]}
            >
              …
            </Text>
          </View>
        ) : (
          <Pressable
            key={token}
            accessibilityRole="button"
            accessibilityLabel={`Trang ${token}`}
            accessibilityState={{ selected: token === currentPage, disabled }}
            disabled={disabled}
            onPress={() => onPageChange(token)}
            style={({ pressed }) => [
              styles.pageChip,
              token === currentPage
                ? { backgroundColor: theme.colors.primary, borderWidth: 0 }
                : [baseBorder, { backgroundColor: theme.colors.surfaceElevated }],
              { opacity: pressed && !disabled ? 0.88 : 1, minWidth: chipSize, height: chipSize },
            ]}
          >
            <Text
              style={[
                styles.pageNumber,
                {
                  color: token === currentPage ? theme.colors.onPrimary : theme.colors.text,
                  fontFamily: token === currentPage ? theme.fonts.bold : theme.fonts.semibold,
                },
              ]}
            >
              {token}
            </Text>
          </Pressable>
        ),
      )}
      <PaginationNavButton
        icon="chevron-forward"
        disabled={disabled || currentPage >= totalPages}
        onPress={() => onPageChange(currentPage + 1)}
        theme={theme}
        chipSize={chipSize}
        baseBorder={baseBorder}
        label="Trang sau"
      />
    </ScrollView>
  );
}

function PaginationNavButton({
  icon,
  disabled,
  onPress,
  theme,
  chipSize,
  baseBorder,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  disabled: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useAppTheme>;
  chipSize: number;
  baseBorder: { borderWidth: number; borderColor: string };
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pageChip,
        baseBorder,
        {
          backgroundColor: theme.colors.surfaceElevated,
          minWidth: chipSize,
          height: chipSize,
          opacity: disabled ? 0.45 : pressed ? 0.88 : 1,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={disabled ? theme.colors.textMuted : theme.colors.text}
      />
    </Pressable>
  );
}

export default function EventsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [page, setPage] = useState(1);

  const eventsQuery = useQuery<ListEventsResponse>({
    queryKey: ['events', 'list', page, EVENTS_PAGE_SIZE],
    queryFn: () => eventsApi.list({ page, limit: EVENTS_PAGE_SIZE }),
  });

  useEffect(() => {
    if (eventsQuery.data?.page != null) {
      setPage(eventsQuery.data.page);
    }
  }, [eventsQuery.data?.page]);

  const items = eventsQuery.data?.items ?? [];
  const totalPages = eventsQuery.data?.totalPages ?? 1;
  const currentPage = eventsQuery.data?.page ?? page;
  const isInitialLoading = eventsQuery.isLoading;
  const isRefreshing = eventsQuery.isRefetching;
  const showListLoading = eventsQuery.isFetching && !isInitialLoading;

  const onPageChange = (next: number) => {
    setPage(next);
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => void eventsQuery.refetch()}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      <ContentStack gap={18} overlapHero={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.82 : 1,
              },
            ]}
          >
            <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
              Sự kiện & cộng đồng
            </Text>
            <Text
              style={[styles.subtitle, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}
            >
              Danh sách sự kiện và cộng đồng từ hệ thống campus.
            </Text>
          </View>
        </View>

        {isInitialLoading ? <EventsSkeleton /> : null}

        {!isInitialLoading && eventsQuery.isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Chưa tải được bài viết"
            description="Vui lòng kiểm tra kết nối hoặc thử lại sau."
            actionLabel="Thử lại"
            onActionPress={() => void eventsQuery.refetch()}
          />
        ) : null}

        {!isInitialLoading && !eventsQuery.isError && items.length === 0 ? (
          <EmptyState
            icon="newspaper-outline"
            title="Chưa có bài viết"
            description="Danh sách sự kiện sẽ hiển thị khi hệ thống có dữ liệu."
          />
        ) : null}

        {!isInitialLoading && !eventsQuery.isError && items.length > 0 ? (
          <View style={styles.list}>
            {items.map((item) => (
              <EventCard
                key={item.slug}
                item={item}
                onPress={() => router.push(`/services/events/${item.slug}` as never)}
              />
            ))}
            {showListLoading ? (
              <View style={styles.pageLoading}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null}
          </View>
        ) : null}

        {!isInitialLoading && !eventsQuery.isError && totalPages > 0 && items.length > 0 ? (
          <EventsPagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={onPageChange}
            disabled={eventsQuery.isFetching}
          />
        ) : null}
      </ContentStack>
    </Screen>
  );
}

function EventCard({ item, onPress }: { item: EventListItem; onPress: () => void }) {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const cardPadding = layout.isCompact ? 12 : 14;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
          padding: cardPadding,
          opacity: pressed ? 0.88 : 1,
        },
        theme.elevation.level1 as never,
      ]}
    >
      <Image
        source={item.thumbnailUrl ? { uri: item.thumbnailUrl } : undefined}
        style={[styles.thumbnail, { backgroundColor: theme.colors.surfaceSubtle }]}
        contentFit="cover"
        transition={120}
        accessibilityLabel={item.title}
      />
      <View style={styles.cardBody}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: theme.colors.primarySurface }]}>
            <Text style={[styles.badgeText, { color: theme.colors.primary, fontFamily: theme.fonts.semibold }]}>
              Tin UIT
            </Text>
          </View>
        </View>
        <Text
          style={[styles.cardTitle, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}
          numberOfLines={3}
        >
          {item.title}
        </Text>
        <Text
          style={[styles.excerpt, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}
          numberOfLines={4}
        >
          {item.excerpt}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={15} color={theme.colors.primary} />
          <Text style={[styles.date, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}>
            {item.dateLabel || 'Chưa có ngày'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function EventsSkeleton() {
  return (
    <View style={styles.list}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <SkeletonBlock height={180} />
          <SkeletonBlock height={20} width="70%" />
          <SkeletonBlock height={48} />
          <SkeletonBlock height={16} width="35%" />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    gap: 14,
  },
  pageLoading: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  pageChip: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  pageNumber: {
    fontSize: 15,
  },
  pageEllipsis: {
    fontSize: 16,
    letterSpacing: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    gap: 12,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
  },
  cardBody: {
    gap: 9,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: 24,
  },
  excerpt: {
    fontSize: 14,
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  date: {
    fontSize: 13,
  },
  skeletonCard: {
    gap: 12,
  },
});
