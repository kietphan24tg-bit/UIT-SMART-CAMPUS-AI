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
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { getRoleLabel, getServiceEntries, isAdminRole } from '@/utils/app';

const SERVICE_CARD_GAP = 12;

export default function ServicesScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const services = getServiceEntries(role);
  const featuredService = getFeaturedService(role, services);
  const liveServices = services.filter(
    (service) => service.supportState === 'live' && service.id !== featuredService.id,
  );
  const upcomingServices = services.filter((service) => service.supportState !== 'live');
  const showLiveSection = liveServices.length > 0;
  const liveRows = buildGridRows(liveServices, 2);
  const upcomingRows = buildGridRows(upcomingServices, 2);

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
          <ServiceTile
            service={featuredService}
            featured
            onPress={
              featuredService.isInteractive
                ? () => router.push(featuredService.route as never)
                : undefined
            }
          />
        </SectionCard>

        {showLiveSection ? (
          <SectionCard
            title="Đang hỗ trợ"
            subtitle={`${liveServices.length} mục`}
            variant="glass"
            tone="academic"
          >
            <View style={styles.gridRows}>
              {liveRows.map((row, rowIndex) => (
                <View key={`live-row-${rowIndex}`} style={[styles.gridRow, { gap: SERVICE_CARD_GAP }]}>
                  {row.map((service) => (
                    <ServiceTile
                      key={service.id}
                      service={service}
                      onPress={() => router.push(service.route as never)}
                    />
                  ))}
                  {row.length < 2 ? <View style={{ flex: 1 }} /> : null}
                </View>
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
            <View style={styles.gridRows}>
              {upcomingRows.map((row, rowIndex) => (
                <View key={`upcoming-row-${rowIndex}`} style={[styles.gridRow, { gap: SERVICE_CARD_GAP }]}>
                  {row.map((service) => (
                    <ServiceTile
                      key={service.id}
                      service={service}
                      onPress={service.isInteractive ? () => router.push(service.route as never) : undefined}
                    />
                  ))}
                  {row.length < 2 ? <View style={{ flex: 1 }} /> : null}
                </View>
              ))}
            </View>
          </SectionCard>
        ) : null}
      </ContentStack>
    </Screen>
  );
}

function buildGridRows<T>(items: T[], columns: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }
  return rows;
}

function ServiceTile({
  service,
  featured = false,
  onPress,
}: {
  service: ReturnType<typeof getServiceEntries>[number];
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
          flex: featured ? undefined : 1,
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
  gridRows: {
    gap: SERVICE_CARD_GAP,
  },
  gridRow: {
    flexDirection: 'row',
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
