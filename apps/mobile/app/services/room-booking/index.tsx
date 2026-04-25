import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ContentStack, EmptyState, PrimaryButton, Screen, SecondaryButton, SectionCard, TopHero } from '@/components/ui';
import {
  setRuntimeBuildingAvailability,
  setRuntimeRoomCatalog,
} from '@/constants/room-booking-data';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { roomBookingsApi } from '@/services/api/room-bookings';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { isAdminRole } from '@/utils/app';

const BUILDING_CARD_GAP = 12;
const BUILDING_MIN_WIDTH = 150;

export default function RoomBookingHomeScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const admin = isAdminRole(role);
  const buildingsQuery = useQuery({
    queryKey: ['room-bookings', 'buildings'],
    queryFn: () => roomBookingsApi.listBuildings(),
  });
  const roomCatalogQuery = useQuery({
    queryKey: ['room-bookings', 'catalog'],
    queryFn: () => roomBookingsApi.listAllBuildingRooms(),
  });
  const buildings = buildingsQuery.data ?? [];
  const availableWidth =
    typeof layout.availableWidth === 'number'
      ? layout.availableWidth
      : layout.getGridItemWidth({ columns: 1, gap: 0 });
  const contentWidth = Math.max(availableWidth - (layout.isTablet ? 44 : 32), 0);
  const estimatedColumns = Math.floor(
    (contentWidth + BUILDING_CARD_GAP) / (BUILDING_MIN_WIDTH + BUILDING_CARD_GAP),
  );
  const columns = Math.max(1, Math.min(layout.isTablet ? 2 : 1, estimatedColumns || 1));
  const cardWidth =
    columns <= 1
      ? contentWidth
      : Math.max((contentWidth - BUILDING_CARD_GAP * (columns - 1)) / columns, 0);

  useEffect(() => {
    if (buildingsQuery.data?.length) {
      setRuntimeBuildingAvailability(buildingsQuery.data);
    }
  }, [buildingsQuery.data]);

  useEffect(() => {
    if (roomCatalogQuery.data) {
      setRuntimeRoomCatalog(roomCatalogQuery.data);
    }
  }, [roomCatalogQuery.data]);

  return (
    <Screen>
      <TopHero
        eyebrow="Dịch vụ campus"
        title="Đặt phòng học"
        subtitle="Tìm phòng trống theo tòa nhà và chuyển nhanh sang lịch sử dụng."
        variant="accent"
        showAccentLine
      />

      <ContentStack gap={16} overlapHero={false}>
        {buildingsQuery.isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Không tải được dữ liệu đặt phòng"
            description="Vui lòng kiểm tra kết nối tới backend."
            actionLabel="Thử lại"
            onActionPress={() => void buildingsQuery.refetch()}
          />
        ) : null}
        <SectionCard
          title="Tòa nhà"
          subtitle={`${buildings.length} khu vực khả dụng`}
          variant="highlight"
          tone="campus"
        >
          <View style={[styles.grid, { gap: BUILDING_CARD_GAP }]}>
            {buildings.map((building) => (
              <Pressable
                key={building.id}
                accessibilityRole="button"
                onPress={() => router.push(`/services/room-booking/${building.id}` as never)}
                style={({ pressed }) => [
                  styles.buildingCard,
                  {
                    width: cardWidth,
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                    opacity: pressed ? 0.88 : 1,
                  },
                  theme.elevation.level1 as never,
                ]}
              >
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor: theme.colors.accentCampusSurface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="business-outline"
                    size={20}
                    color={theme.colors.accentCampus}
                  />
                </View>
                <Text
                  style={[
                    styles.buildingCode,
                    { color: theme.colors.text, fontFamily: theme.fonts.bold },
                  ]}
                >
                  {building.name}
                </Text>
                <Text
                  style={[
                    styles.buildingMeta,
                    { color: theme.colors.primary, fontFamily: theme.fonts.semibold },
                  ]}
                >
                  {building.subtitle}
                </Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>
        <PrimaryButton
          label="Yêu cầu của tôi"
          onPress={() => router.push('/services/room-booking/my' as never)}
        />
        {admin ? (
          <SecondaryButton
            label="Queue phê duyệt"
            onPress={() => router.push('/services/room-booking/approvals' as never)}
          />
        ) : null}
      </ContentStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
  buildingCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    minHeight: 150,
    gap: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildingCode: {
    fontSize: 18,
  },
  buildingMeta: {
    fontSize: 14,
  },
});
