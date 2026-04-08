import { Ionicons } from '@expo/vector-icons';
import type { ParkingSlotState, RegisteredVehicle } from '@smart-campus/shared';
import { useRouter } from 'expo-router';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import {
  ContentStack,
  EmptyState,
  PrimaryButton,
  Screen,
  SectionCard,
  SecondaryButton,
  StatusBadge,
  TopHero,
} from '@/components/ui';
import { useParkingOverview } from '@/hooks/use-parking-overview';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { useAppTheme } from '@/theme';
import {
  formatCurrency,
  formatDateTime,
  formatSubscriptionDate,
  getTelemetryHealthLabel,
} from '@/utils/app';

export default function ParkingScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const router = useRouter();
  const parking = useParkingOverview();

  const parkingStatus = parking.data?.status ?? null;
  const vehicles = parking.data?.vehicles ?? [];
  const slots = parkingStatus?.slots ?? [];
  const boardSlots = getBoardSlots(slots);
  const subscriptionSummary = summarizeSubscriptions(vehicles);

  const healthTone =
    parking.data?.telemetryHealth === 'fire-alert'
      ? 'danger'
      : parking.data?.telemetryHealth === 'offline' || parking.data?.telemetryHealth === 'stale'
        ? 'warning'
        : parking.data?.telemetryHealth === 'no-data'
          ? 'info'
          : 'success';

  const shouldShowHealthCallout =
    parking.data?.telemetryHealth !== 'online' && parking.data?.telemetryHealth !== 'no-data';

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={parking.isRefetching}
          onRefresh={() => void parking.refetch()}
          tintColor={theme.colors.primary}
        />
      }
    >
      <TopHero
        eyebrow="Parking + IoT"
        title="Bãi xe thông minh UIT"
        subtitle="Theo dõi chỗ trống A1-A4 và trạng thái cảm biến."
        badge={{
          label: getTelemetryHealthLabel(parking.data?.telemetryHealth ?? 'offline'),
          tone: healthTone,
        }}
      >
        <View style={styles.heroMeta}>
          <Text style={[styles.heroNumber, { color: theme.colors.heroText, fontFamily: theme.fonts.bold }]}>
            {parkingStatus ? `${parkingStatus.availableSlots}/${parkingStatus.totalSlots}` : '--'}
          </Text>
          <Text style={[styles.heroCaption, { color: theme.colors.heroSubtext, fontFamily: theme.fonts.regular }]}>
            chỗ đang trống
          </Text>
        </View>
      </TopHero>

      <ContentStack>
        {shouldShowHealthCallout ? (
          <View
            style={[
              styles.healthCallout,
              {
                backgroundColor:
                  healthTone === 'danger'
                    ? theme.colors.emergencySurface
                    : healthTone === 'warning'
                      ? theme.colors.warningSurface
                      : theme.colors.infoSurface,
                borderColor:
                  healthTone === 'danger'
                    ? theme.colors.emergency
                    : healthTone === 'warning'
                      ? theme.colors.warning
                      : theme.colors.info,
              },
            ]}
          >
            <Ionicons
              name={healthTone === 'danger' ? 'flame-outline' : 'cloud-offline-outline'}
              size={20}
              color={
                healthTone === 'danger'
                  ? theme.colors.emergency
                  : healthTone === 'warning'
                    ? theme.colors.warning
                    : theme.colors.info
              }
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.healthTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                {getTelemetryHealthLabel(parking.data?.telemetryHealth ?? 'offline')}
              </Text>
              <Text style={[styles.healthBody, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                {parking.data?.telemetryHealth === 'fire-alert'
                  ? 'Ưu tiên kiểm tra an toàn và xử lý theo quy trình.'
                  : parking.data?.telemetryHealth === 'offline'
                    ? 'Ứng dụng đang hiển thị dữ liệu gần nhất của bãi xe.'
                    : 'Dữ liệu cảm biến chưa mới. Kéo xuống để làm mới.'}
              </Text>
            </View>
          </View>
        ) : null}

        <SectionCard
          title="Sơ đồ chỗ đỗ"
          subtitle="Bảng chỗ đỗ cho khu A1-A4."
          variant="elevated"
        >
          {parkingStatus ? (
            <View style={styles.sectionStack}>
              <View style={styles.board}>
                {boardSlots.map((slot, index) => (
                  <SlotTile
                    key={slot?.slotNumber ?? `slot-${index}`}
                    slot={slot}
                  />
                ))}
              </View>
              <Text style={[styles.metaText, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                Cập nhật {formatDateTime(parkingStatus.lastUpdated ?? parkingStatus.sensors.reportedAt ?? null)}
              </Text>
            </View>
          ) : (
            <EmptyState
              icon="car-sport-outline"
              title="Chưa có dữ liệu bãi xe"
              description="Kéo xuống để làm mới."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Cảm biến"
          subtitle="Thông tin môi trường và an toàn."
          variant="outlined"
        >
          {parkingStatus ? (
            <View style={styles.telemetryGrid}>
              <TelemetryTile
                icon="thermometer-outline"
                label="Nhiệt độ"
                value={
                  typeof parkingStatus.sensors.temperature === 'number'
                    ? `${parkingStatus.sensors.temperature}°C`
                    : '--'
                }
              />
              <TelemetryTile
                icon="water-outline"
                label="Độ ẩm"
                value={
                  typeof parkingStatus.sensors.humidity === 'number'
                    ? `${parkingStatus.sensors.humidity}%`
                    : '--'
                }
              />
              <TelemetryTile
                icon="rainy-outline"
                label="Mưa"
                value={parkingStatus.sensors.rainDetected ? 'Có' : 'Không'}
              />
              <TelemetryTile
                icon="flame-outline"
                label="Cháy"
                value={parkingStatus.sensors.fireDetected ? 'Cảnh báo' : 'An toàn'}
                tone={parkingStatus.sensors.fireDetected ? 'danger' : 'success'}
              />
            </View>
          ) : (
            <EmptyState
              icon="pulse-outline"
              title="Chưa có telemetry"
              description="Telemetry sẽ hiển thị khi gateway gửi dữ liệu."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Tác vụ chính"
          subtitle="Các thao tác chính."
          variant="outlined"
        >
          <View style={styles.sectionStack}>
            <PrimaryButton label="Đăng ký xe" onPress={() => router.push('/parking/vehicle-registration')} />
            <SecondaryButton label="Gói gửi xe và thanh toán" onPress={() => router.push('/parking/payment-status')} />
          </View>
        </SectionCard>

        <SectionCard
          title="Xe đã đăng ký"
          subtitle="Danh sách xe của tài khoản hiện tại."
          variant="outlined"
        >
          {vehicles.length > 0 ? (
            <View style={styles.sectionStack}>
              {vehicles.map((vehicle) => {
                const meta = getSubscriptionMeta(vehicle.subscription.status);
                return (
                  <View
                    key={vehicle.id}
                    style={[
                      styles.vehicleCard,
                      {
                        backgroundColor: theme.colors.surfaceSubtle,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View style={[styles.rowBetween, layout.isCompact ? styles.rowBetweenStacked : null]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.vehiclePlate, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
                          {vehicle.plateNumber}
                        </Text>
                        <Text style={[styles.metaText, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                          RFID {vehicle.rfidTag}
                        </Text>
                      </View>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </View>
                    <Text style={[styles.metaText, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                      Hạn gói: {formatSubscriptionDate(vehicle.subscription.endDate)}
                    </Text>
                    <Text style={[styles.metaText, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                      Phí tháng: {formatCurrency(vehicle.subscription.monthlyFee)} VND
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon="car-outline"
              title="Bạn chưa đăng ký xe"
              description="Đăng ký xe để hệ thống tạo gói gửi xe tương ứng."
              actionLabel="Đăng ký xe"
              onActionPress={() => router.push('/parking/vehicle-registration')}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Tình trạng gói gửi xe"
          subtitle="Trạng thái gói theo dữ liệu thực tế."
          variant="outlined"
        >
          {vehicles.length > 0 ? (
            <View style={styles.sectionStack}>
              <View style={styles.badgeRow}>
                <StatusBadge label={`${subscriptionSummary.active} hiệu lực`} tone="success" />
                <StatusBadge label={`${subscriptionSummary.pending} đang chờ`} tone="warning" />
                <StatusBadge label={`${subscriptionSummary.expired} hết hạn`} tone="danger" />
                <StatusBadge label={`${subscriptionSummary.inactive} chưa kích hoạt`} tone="info" />
              </View>
              <Text style={[styles.metaText, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                Sau khi thanh toán, trạng thái sẽ cập nhật ở lần làm mới tiếp theo.
              </Text>
              <SecondaryButton label="Mở gói gửi xe" onPress={() => router.push('/parking/payment-status')} />
            </View>
          ) : (
            <EmptyState
              icon="wallet-outline"
              title="Chưa có gói gửi xe"
              description="Đăng ký xe trước để hệ thống tạo gói gửi xe tương ứng."
              actionLabel="Đăng ký xe"
              onActionPress={() => router.push('/parking/vehicle-registration')}
            />
          )}
        </SectionCard>
      </ContentStack>
    </Screen>
  );
}

function getBoardSlots(slots: ParkingSlotState[]) {
  const defaultOrder = ['A1', 'A2', 'A3', 'A4'];
  const slotByNumber = new Map(slots.map((slot) => [slot.slotNumber, slot]));
  const hasAllDefault = defaultOrder.every((slotNumber) => slotByNumber.has(slotNumber));
  const picked = hasAllDefault
    ? defaultOrder
    : [...slots]
        .slice()
        .sort((a, b) => a.slotNumber.localeCompare(b.slotNumber))
        .slice(0, 4)
        .map((slot) => slot.slotNumber);

  const numbers = picked.length > 0 ? picked : defaultOrder;
  return numbers.map((slotNumber) => slotByNumber.get(slotNumber) ?? null);
}

function SlotTile({ slot }: { slot: ParkingSlotState | null }) {
  const theme = useAppTheme();
  const state = slot ? (slot.isOccupied ? 'occupied' : 'available') : 'unknown';
  const backgroundColor =
    state === 'available'
      ? theme.colors.successSurface
      : state === 'occupied'
        ? theme.colors.surfaceSubtle
        : theme.colors.infoSurface;
  const borderColor =
    state === 'available'
      ? theme.colors.success
      : state === 'occupied'
        ? theme.colors.border
        : theme.colors.info;
  const label =
    state === 'available' ? 'Trống' : state === 'occupied' ? 'Đang có xe' : 'Chưa có dữ liệu';

  return (
    <View style={[styles.slotTile, { backgroundColor, borderColor }]}>
      <Text style={[styles.slotNumber, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
        {slot?.slotNumber ?? '--'}
      </Text>
      <Text style={[styles.slotState, { color: theme.colors.textMuted, fontFamily: theme.fonts.semibold }]}>
        {label}
      </Text>
      {slot?.vehiclePlate ? (
        <Text style={[styles.slotMeta, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}>
          {slot.vehiclePlate}
        </Text>
      ) : null}
    </View>
  );
}

function TelemetryTile({
  icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const theme = useAppTheme();
  const palette = {
    neutral: { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.border, color: theme.colors.text },
    success: { backgroundColor: theme.colors.successSurface, borderColor: theme.colors.success, color: theme.colors.success },
    warning: { backgroundColor: theme.colors.warningSurface, borderColor: theme.colors.warning, color: theme.colors.warning },
    danger: { backgroundColor: theme.colors.dangerSurface, borderColor: theme.colors.danger, color: theme.colors.danger },
    info: { backgroundColor: theme.colors.infoSurface, borderColor: theme.colors.info, color: theme.colors.info },
  }[tone];

  return (
    <View style={[styles.telemetryTile, { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor }]}>
      <View style={styles.telemetryHeader}>
        <Ionicons name={icon} size={18} color={palette.color} />
        <Text style={[styles.telemetryLabel, { color: theme.colors.textMuted, fontFamily: theme.fonts.medium }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.telemetryValue, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
        {value}
      </Text>
    </View>
  );
}

function getSubscriptionMeta(status: RegisteredVehicle['subscription']['status']) {
  switch (status) {
    case 'active':
      return { label: 'Hiệu lực', tone: 'success' as const };
    case 'pending':
      return { label: 'Đang chờ', tone: 'warning' as const };
    case 'expired':
      return { label: 'Hết hạn', tone: 'danger' as const };
    default:
      return { label: 'Chưa kích hoạt', tone: 'info' as const };
  }
}

function summarizeSubscriptions(vehicles: RegisteredVehicle[]) {
  return vehicles.reduce(
    (acc, vehicle) => {
      acc[vehicle.subscription.status] += 1;
      return acc;
    },
    { inactive: 0, pending: 0, active: 0, expired: 0 },
  );
}

const styles = StyleSheet.create({
  heroMeta: {
    marginTop: 6,
  },
  heroNumber: {
    fontSize: 34,
  },
  heroCaption: {
    fontSize: 13,
    marginTop: 4,
  },
  sectionStack: {
    gap: 12,
  },
  healthCallout: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  healthTitle: {
    fontSize: 14,
  },
  healthBody: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  slotTile: {
    flexGrow: 1,
    flexBasis: 140,
    minHeight: 108,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 6,
  },
  slotNumber: {
    fontSize: 22,
  },
  slotState: {
    fontSize: 13,
  },
  slotMeta: {
    fontSize: 12,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  telemetryTile: {
    flexGrow: 1,
    flexBasis: 150,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  telemetryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  telemetryLabel: {
    fontSize: 12,
  },
  telemetryValue: {
    fontSize: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  vehiclePlate: {
    fontSize: 17,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  rowBetweenStacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
