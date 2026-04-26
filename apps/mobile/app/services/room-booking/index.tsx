import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ContentStack, EmptyState, PrimaryButton, Screen, SecondaryButton, SectionCard, TopHero } from '@/components/ui';
import { roomBookingsApi } from '@/services/api/room-bookings';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { isAdminRole } from '@/utils/app';

const BUILDING_CARD_GAP = 12;

export default function RoomBookingHomeScreen() {
  const theme = useAppTheme();
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
  const buildingRows: Array<typeof buildings> = [];
  for (let i = 0; i < buildings.length; i += 2) {
    buildingRows.push(buildings.slice(i, i + 2));
  }

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
          <View style={styles.gridRows}>
            {buildingRows.map((row, rowIndex) => (
              <View key={`building-row-${rowIndex}`} style={[styles.gridRow, { gap: BUILDING_CARD_GAP }]}>
                {row.map((building) => (
                  <Pressable
                    key={building.id}
                    accessibilityRole="button"
                    onPress={() => router.push(`/services/room-booking/${building.id}` as never)}
                    style={({ pressed }) => [
                      styles.buildingCard,
                      {
                        flex: 1,
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
                {row.length < 2 ? <View style={{ flex: 1 }} /> : null}
              </View>
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
  gridRows: {
    gap: BUILDING_CARD_GAP,
  },
  gridRow: {
    flexDirection: 'row',
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
