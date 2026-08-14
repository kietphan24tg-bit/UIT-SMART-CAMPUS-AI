import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

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
  const handleServicePress = (service: (typeof services)[number]) => {
    if (service.isInteractive) {
      if (service.id === 'gps-sos') {
        router.push({
          pathname: service.route,
          params: { from: 'services' },
        } as never);
        return;
      }

      router.push(service.route as never);
      return;
    }

    Alert.alert(
      'Không khả dụng',
      service.disabledReason ?? `${service.title} hiện chưa khả dụng với ${getRoleLabel(role)}.`,
    );
  };

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
            onPress={() => handleServicePress(featuredService)}
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
                      onPress={() => handleServicePress(service)}
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
            title="Chưa khả dụng"
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
                      onPress={() => handleServicePress(service)}
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
  const available = service.isInteractive;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      android_ripple={{ color: 'rgba(150, 150, 150, 0.15)' }}
      style={({ pressed }) => [
        styles.card,
        featured ? styles.cardFeatured : null,
        {
          flex: featured ? undefined : 1,
          backgroundColor: available ? theme.colors.surfaceElevated : theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
          opacity: pressed ? (available ? 0.88 : 0.9) : 1,
        },
        theme.elevation.level1 as never,
      ]}
    >
      <View style={featured ? styles.cardHeaderFeatured : styles.cardHeaderCompact}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: available
                ? getServiceSurface(theme, service.category)
                : theme.colors.surface,
            },
          ]}
        >
          <Ionicons
            name={service.icon as never}
            size={featured ? 22 : 20}
            color={available ? getServiceTone(theme, service.category) : theme.colors.textSoft}
          />
        </View>
        <StatusBadge
          label={getSupportLabel(service.supportState)}
          tone={getSupportTone(service.supportState)}
          size="sm"
        />
      </View>
      <Text
        style={[
          styles.cardTitle,
          featured ? styles.cardTitleFeatured : null,
          {
            color: available ? theme.colors.text : theme.colors.textMuted,
            fontFamily: theme.fonts.semibold,
          },
        ]}
      >
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
            color: available ? theme.colors.primary : theme.colors.textSoft,
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
      return 'Không khả dụng';
  }
}

function getSupportTone(state: 'live' | 'partial' | 'unsupported') {
  switch (state) {
    case 'live':
      return 'success';
    case 'partial':
      return 'warning';
    default:
      return 'neutral';
  }
}

function getServiceActionLabel(state: 'live' | 'partial' | 'unsupported') {
  switch (state) {
    case 'live':
      return 'Mở ngay';
    case 'partial':
      return 'Xem chi tiết';
    default:
      return 'Xem lý do';
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
    // @ts-ignore - Web only focus ring suppression
    outlineWidth: 0,
  },
  cardFeatured: {
    borderRadius: 20,
    padding: 14,
    minHeight: 150,
    // @ts-ignore - Web only focus ring suppression
    outlineWidth: 0,
  },
  cardHeaderFeatured: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cardHeaderCompact: {
    alignItems: 'flex-start',
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
