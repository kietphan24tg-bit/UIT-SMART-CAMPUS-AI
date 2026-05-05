import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ContentStack, EmptyState, PrimaryButton, Screen, SecondaryButton, SectionCard, TopHero } from '@/components/ui';
import {
  setRuntimeBuildingAvailability,
  setRuntimeRoomCatalog,
} from '@/constants/room-booking-data';
import { useEffectiveRole } from '@/hooks/use-effective-role';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { roomBookingsApi } from '@/services/api/room-bookings';
import { useAppTheme } from '@/theme';
import { isAdminRole } from '@/utils/app';

const BUILDING_CARD_GAP = 12;
const BUILDING_MIN_WIDTH = 150;
const HIDDEN_BUILDING_CODES = new Set(['SPORT', 'VENUE']);
const HIDDEN_BUILDING_NAMES = new Set(['Sân tập và thể thao', 'Hội trường và không gian chung']);

export default function RoomBookingHomeScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const router = useRouter();
  const role = useEffectiveRole();
  const admin = isAdminRole(role);
  const [showAdminSchedule, setShowAdminSchedule] = useState(false);

  const buildingsQuery = useQuery({
    queryKey: ['room-bookings', 'buildings'],
    queryFn: () => roomBookingsApi.listBuildings(),
  });
  const roomCatalogQuery = useQuery({
    queryKey: ['room-bookings', 'catalog'],
    queryFn: () => roomBookingsApi.listAllBuildingRooms(),
  });
  const adminRequestRoomsQuery = useQuery({
    queryKey: ['room-bookings', 'admin', 'request-rooms'],
    queryFn: roomBookingsApi.listAdminRequestRooms,
    enabled: admin,
  });

  const buildings = (buildingsQuery.data ?? []).filter(
    (building) =>
      !HIDDEN_BUILDING_CODES.has(building.code) && !HIDDEN_BUILDING_NAMES.has(building.name),
  );
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
  const pendingRequestCount =
    adminRequestRoomsQuery.data?.reduce((sum, room) => sum + room.pendingRequestCount, 0) ?? 0;

  useEffect(() => {
    if (buildings.length) {
      setRuntimeBuildingAvailability(buildings);
    }
  }, [buildings]);

  useEffect(() => {
    if (roomCatalogQuery.data) {
      setRuntimeRoomCatalog(roomCatalogQuery.data);
    }
  }, [roomCatalogQuery.data]);

  return (
    <Screen>
      <TopHero
        eyebrow="Dịch vụ campus"
        title={admin ? 'Quản lý đặt phòng' : 'Đặt phòng học'}
        subtitle={
          admin
            ? 'Duyệt yêu cầu và điều chỉnh lịch sử dụng phòng học.'
            : 'Tìm phòng trống theo tòa nhà và chuyển nhanh sang lịch sử dụng.'
        }
        variant="accent"
        showAccentLine
      />

      <ContentStack gap={16} overlapHero={false}>
        {admin && !showAdminSchedule ? (
          <>
            <AdminEntryCard
              icon="file-tray-full-outline"
              title="Yêu cầu đặt phòng"
              subtitle={`${pendingRequestCount} yêu cầu chờ duyệt`}
              meta={`${adminRequestRoomsQuery.data?.length ?? 0} phòng có yêu cầu`}
              onPress={() => router.push('/services/room-booking/approvals' as never)}
            />
            <AdminEntryCard
              icon="calendar-outline"
              title="Lịch phòng"
              subtitle="Xem và điều chỉnh lịch sử dụng phòng học"
              meta={`${buildings.length} khu vực khả dụng`}
              onPress={() => setShowAdminSchedule(true)}
            />
          </>
        ) : null}

        {admin && showAdminSchedule ? (
          <SecondaryButton
            label="Quay lại quản lý đặt phòng"
            onPress={() => setShowAdminSchedule(false)}
          />
        ) : null}

        {!admin || showAdminSchedule ? (
          <>
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
                  </Pressable>
                ))}
              </View>
            </SectionCard>
            {!admin ? (
              <PrimaryButton
                label="Yêu cầu của tôi"
                onPress={() => router.push('/services/room-booking/my' as never)}
              />
            ) : null}
          </>
        ) : null}
      </ContentStack>
    </Screen>
  );
}

function AdminEntryCard({
  icon,
  title,
  subtitle,
  meta,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  meta: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.adminEntryCard,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.86 : 1,
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
        <Ionicons name={icon} size={21} color={theme.colors.accentCampus} />
      </View>
      <View style={styles.adminEntryText}>
        <Text style={[styles.adminEntryTitle, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
          {title}
        </Text>
        <Text style={[styles.adminEntrySubtitle, { color: theme.colors.textMuted, fontFamily: theme.fonts.medium }]}>
          {subtitle}
        </Text>
        <Text style={[styles.adminEntryMeta, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}>
          {meta}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.textSoft} />
    </Pressable>
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
  adminEntryCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    minHeight: 132,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  adminEntryText: {
    flex: 1,
    gap: 4,
  },
  adminEntryTitle: {
    fontSize: 18,
  },
  adminEntrySubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  adminEntryMeta: {
    fontSize: 12,
  },
});
