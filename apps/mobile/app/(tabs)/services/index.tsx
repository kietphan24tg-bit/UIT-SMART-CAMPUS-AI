import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ContentStack,
  Screen,
  SectionCard,
  StatusBadge,
  TopHero,
} from '@/components/ui';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { getRoleLabel, getServiceEntries, isAdminRole } from '@/utils/app';

const SERVICE_CARD_GAP = 12;
const SERVICE_MIN_CARD_WIDTH = 220;

export default function ServicesScreen() {
  const layout = useResponsiveLayout();
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const services = getServiceEntries(role);
  const featuredService = getFeaturedService(role, services);
  const liveServices = services.filter(
    (service) => service.supportState === 'live' && service.id !== featuredService.id,
  );
  const upcomingServices = services.filter((service) => service.supportState !== 'live');
  const serviceGridWidth = getServiceGridWidth(layout);
  const maxServiceColumns = layout.isTablet ? 2 : 1;
  const liveColumns = getGridColumnsForWidth({
    width: serviceGridWidth,
    minItemWidth: SERVICE_MIN_CARD_WIDTH,
    gap: SERVICE_CARD_GAP,
    maxColumns: maxServiceColumns,
  });
  const liveCardWidth = getGridItemWidthForWidth({
    width: serviceGridWidth,
    columns: liveColumns,
    gap: SERVICE_CARD_GAP,
  });
  const upcomingColumns = getGridColumnsForWidth({
    width: serviceGridWidth,
    minItemWidth: SERVICE_MIN_CARD_WIDTH,
    gap: SERVICE_CARD_GAP,
    maxColumns: maxServiceColumns,
  });
  const upcomingCardWidth = getGridItemWidthForWidth({
    width: serviceGridWidth,
    columns: upcomingColumns,
    gap: SERVICE_CARD_GAP,
  });
  const featuredCardWidth = serviceGridWidth;
  const showLiveSection = liveServices.length > 0;

  return (
    <Screen>
      <TopHero
        eyebrow="Dịch vụ"
        title="Dịch vụ campus"
        subtitle="Chọn mục đang hỗ trợ."
        badge={{ label: getRoleLabel(role), tone: 'info' }}
        showBrand
        variant="accent"
      />

      <ContentStack gap={16} overlapHero={false}>
        <SectionCard
          title="Nổi bật"
          subtitle="Mục dùng ngay trong app."
          variant="highlight"
          tone="campus"
        >
          <View style={[styles.grid, { gap: SERVICE_CARD_GAP }]}>
            <ServiceTile
              service={featuredService}
              width={featuredCardWidth}
              featured
              onPress={
                featuredService.isInteractive
                  ? () => router.push(featuredService.route as never)
                  : undefined
              }
            />
          </View>
        </SectionCard>

        {showLiveSection ? (
          <SectionCard
            title="Đang hỗ trợ"
            subtitle={`${liveServices.length} mục`}
            variant="glass"
            tone="academic"
          >
            <View style={[styles.grid, { gap: SERVICE_CARD_GAP }]}>
              {liveServices.map((service) => (
                <ServiceTile
                  key={service.id}
                  service={service}
                  width={liveCardWidth}
                  onPress={() => router.push(service.route as never)}
                />
              ))}
            </View>
          </SectionCard>
        ) : null}

        {upcomingServices.length > 0 ? (
          <SectionCard
            title="Sắp tới"
            subtitle={`${upcomingServices.length} mục`}
            variant="outlined"
            tone="neutral"
          >
            <View style={[styles.grid, { gap: SERVICE_CARD_GAP }]}>
              {upcomingServices.map((service) => (
                <ServiceTile
                  key={service.id}
                  service={service}
                  width={upcomingCardWidth}
                  onPress={service.isInteractive ? () => router.push(service.route as never) : undefined}
                />
              ))}
            </View>
          </SectionCard>
        ) : null}
      </ContentStack>
    </Screen>
  );
}

function ServiceTile({
  service,
  width,
  featured = false,
  onPress,
}: {
  service: ReturnType<typeof getServiceEntries>[number];
  width: number;
  featured?: boolean;
  onPress?: () => void;
}) {
  const theme = useAppTheme();
  const interactive = Boolean(onPress);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !interactive }}
      disabled={!interactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        featured ? styles.cardFeatured : null,
        {
          width,
          backgroundColor: interactive ? theme.colors.surfaceElevated : theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
          opacity: interactive ? (pressed ? 0.88 : 1) : 0.92,
        },
        theme.elevation.level1 as never,
      ]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: getServiceSurface(theme, service.category),
            },
          ]}
        >
          <Ionicons name={service.icon as never} size={featured ? 22 : 20} color={getServiceTone(theme, service.category)} />
        </View>
        <StatusBadge
          label={getSupportLabel(service.supportState)}
          tone={getSupportTone(service.supportState)}
          size="sm"
        />
      </View>
      <Text style={[styles.cardTitle, featured ? styles.cardTitleFeatured : null, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
        {service.title}
      </Text>
      <Text
        style={[
          styles.cardCategory,
          { color: theme.colors.textMuted, fontFamily: theme.fonts.regular },
        ]}
        numberOfLines={1}
      >
        {service.category}
      </Text>
      <Text
        style={[
          styles.cardAction,
          {
            color: interactive ? theme.colors.primary : theme.colors.textSoft,
            fontFamily: theme.fonts.medium,
          },
        ]}
      >
        {getServiceActionLabel(service.supportState)}
      </Text>
    </Pressable>
  );
}

function getFeaturedService(
  role: string | null | undefined,
  services: ReturnType<typeof getServiceEntries>,
) {
  if (isAdminRole(role)) {
    return services.find((service) => service.id === 'parking') ?? services[0];
  }

  return services.find((service) => service.id === 'campus-map') ?? services[0];
}

export function getServiceGridWidth(layout: ReturnType<typeof useResponsiveLayout>) {
  const sectionPadding = layout.isTablet ? 22 : layout.isCompact ? 16 : 18;
  const availableWidth =
    typeof layout.availableWidth === 'number'
      ? layout.availableWidth
      : layout.getGridItemWidth({ columns: 1, gap: SERVICE_CARD_GAP });

  return Math.max(availableWidth - sectionPadding * 2, 0);
}

function getGridColumnsForWidth({
  width,
  minItemWidth,
  gap,
  maxColumns,
}: {
  width: number;
  minItemWidth: number;
  gap: number;
  maxColumns: number;
}) {
  const estimatedColumns = Math.floor((width + gap) / (minItemWidth + gap));
  return Math.max(1, Math.min(maxColumns, estimatedColumns || 1));
}

function getGridItemWidthForWidth({
  width,
  columns,
  gap,
}: {
  width: number;
  columns: number;
  gap: number;
}) {
  if (columns <= 1) {
    return width;
  }

  return Math.max((width - gap * (columns - 1)) / columns, 0);
}

function getSupportLabel(state: 'live' | 'partial' | 'unsupported') {
  switch (state) {
    case 'live':
      return 'Khả dụng';
    case 'partial':
      return 'Giới hạn';
    default:
      return 'Sắp mở';
  }
}

function getSupportTone(state: 'live' | 'partial' | 'unsupported') {
  switch (state) {
    case 'live':
      return 'success';
    case 'partial':
      return 'warning';
    default:
      return 'info';
  }
}

function getServiceActionLabel(state: 'live' | 'partial' | 'unsupported') {
  switch (state) {
    case 'live':
      return 'Mở ngay';
    case 'partial':
      return 'Xem chi tiết';
    default:
      return 'Theo dõi';
  }
}

function getServiceTone(
  theme: ReturnType<typeof useAppTheme>,
  category: ReturnType<typeof getServiceEntries>[number]['category'],
) {
  switch (category) {
    case 'Công cụ giảng dạy':
      return theme.colors.accentAcademic;
    case 'Công cụ quản trị':
      return theme.colors.primary;
    case 'Tiện ích campus':
      return theme.colors.accentCampus;
    case 'Đời sống campus':
      return theme.colors.accentTelemetry;
    default:
      return theme.colors.info;
  }
}

function getServiceSurface(
  theme: ReturnType<typeof useAppTheme>,
  category: ReturnType<typeof getServiceEntries>[number]['category'],
) {
  switch (category) {
    case 'Công cụ giảng dạy':
      return theme.colors.accentAcademicSurface;
    case 'Công cụ quản trị':
      return theme.colors.primarySurface;
    case 'Tiện ích campus':
      return theme.colors.accentCampusSurface;
    case 'Đời sống campus':
      return theme.colors.accentTelemetrySurface;
    default:
      return theme.colors.infoSurface;
  }
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 8,
    minHeight: 150,
  },
  cardFeatured: {
    borderRadius: 20,
    padding: 14,
    minHeight: 150,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
  },
  cardTitleFeatured: {
    fontSize: 16,
  },
  cardCategory: {
    fontSize: 12,
    lineHeight: 17,
  },
  cardAction: {
    fontSize: 13,
  },
});
