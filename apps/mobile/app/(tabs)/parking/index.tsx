import { Ionicons } from '@expo/vector-icons';
import type { ParkingSlotState, RegisteredVehicle } from '@smart-campus/shared';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  ContentStack,
  EmptyState,
  InfoRow,
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
  const gatewayState = parking.data?.telemetryHealth ?? 'offline';
  const gatewayLabel = getTelemetryHealthLabel(gatewayState);
  const gatewayTone =
    gatewayState === 'fire-alert'
      ? 'danger'
      : gatewayState === 'offline' || gatewayState === 'stale'
        ? 'warning'
        : gatewayState === 'no-data'
          ? 'info'
          : 'success';
  const shouldShowGatewayCallout = gatewayState !== 'online' && gatewayState !== 'no-data';
  const cardGap = layout.isCompact ? 10 : 12;
  const sensorColumns = layout.isTablet ? 4 : 2;
  const sensorCardWidth = layout.getGridItemWidth({ columns: sensorColumns, gap: cardGap });
  const slotColumns = layout.isTablet ? 4 : 2;
  const slotCardWidth = layout.getGridItemWidth({ columns: slotColumns, gap: cardGap });
  const climateState = getClimateState(
    parkingStatus?.sensors.temperature ?? null,
    parkingStatus?.sensors.humidity ?? null,
  );

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
        title="Bãi xe UIT"
        subtitle="Slot và cảm biến."
        badge={{ label: gatewayLabel, tone: gatewayTone }}
      />

      <ContentStack>
        {shouldShowGatewayCallout ? (
          <View
            style={[
              styles.gatewayCallout,
              {
                backgroundColor:
                  gatewayTone === 'danger'
                    ? theme.colors.emergencySurface
                    : gatewayTone === 'warning'
                      ? theme.colors.warningSurface
                      : theme.colors.infoSurface,
                borderColor:
                  gatewayTone === 'danger'
                    ? theme.colors.emergency
                    : gatewayTone === 'warning'
                      ? theme.colors.warning
                      : theme.colors.info,
              },
            ]}
          >
            <Ionicons
              name={gatewayTone === 'danger' ? 'flame-outline' : 'cloud-offline-outline'}
              size={18}
              color={
                gatewayTone === 'danger'
                  ? theme.colors.emergency
                  : gatewayTone === 'warning'
                    ? theme.colors.warning
                    : theme.colors.info
              }
            />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.calloutTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                Dữ liệu {gatewayLabel.toLowerCase()}
              </Text>
              <Text style={[styles.calloutBody, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                {gatewayState === 'fire-alert'
                  ? 'Ưu tiên xử lý cảnh báo cháy.'
                  : gatewayState === 'offline'
                    ? 'Hiển thị dữ liệu gần nhất.'
                    : 'Kéo xuống để làm mới.'}
              </Text>
            </View>
          </View>
        ) : null}

        <SectionCard title="Cảm biến" subtitle="Theo phần cứng đang có." variant="highlight" tone="campus">
          {parkingStatus ? (
            <View style={styles.sectionStack}>
              <View style={[styles.sensorGrid, { gap: cardGap }]}>
                <SensorStatusCard
                  width={sensorCardWidth}
                  label="Chỗ trống"
                  value={`${parkingStatus.availableSlots}/${parkingStatus.totalSlots}`}
                  caption="IR A1-A4"
                  advisory="4 cảm biến hồng ngoại"
                  icon="scan-outline"
                  tone="success"
                  motion="slot"
                  active
                />
                <SensorStatusCard
                  width={sensorCardWidth}
                  label="Mưa"
                  value={parkingStatus.sensors.rainDetected ? 'Có mưa' : 'Không mưa'}
                  caption="Cảm biến mưa"
                  advisory={parkingStatus.sensors.rainDetected ? 'Mang dù' : 'Khô ráo'}
                  icon={parkingStatus.sensors.rainDetected ? 'rainy-outline' : 'partly-sunny-outline'}
                  tone={parkingStatus.sensors.rainDetected ? 'warning' : 'info'}
                  motion={parkingStatus.sensors.rainDetected ? 'rain' : 'calm'}
                  active
                />
                <SensorStatusCard
                  width={sensorCardWidth}
                  label="Nhiệt ẩm"
                  value={climateState.value}
                  caption={climateState.caption}
                  advisory={climateState.advisory}
                  icon={climateState.icon}
                  tone={climateState.tone}
                  motion={climateState.motion}
                  active={climateState.active}
                />
                <SensorStatusCard
                  width={sensorCardWidth}
                  label="Cháy"
                  value={parkingStatus.sensors.fireDetected ? 'Có cháy' : 'Không cháy'}
                  caption="Cảm biến cháy"
                  advisory={parkingStatus.sensors.fireDetected ? 'Sơ tán' : 'An toàn'}
                  icon={parkingStatus.sensors.fireDetected ? 'flame-outline' : 'shield-checkmark-outline'}
                  tone={parkingStatus.sensors.fireDetected ? 'danger' : 'success'}
                  motion={parkingStatus.sensors.fireDetected ? 'fire' : 'calm'}
                  active
                />
              </View>
            </View>
          ) : (
            <EmptyState icon="pulse-outline" title="Chưa có telemetry" description="Kéo xuống để làm mới dữ liệu." />
          )}
        </SectionCard>

        <SectionCard title="4 cảm biến hồng ngoại" subtitle="Slot A1-A4." variant="list" tone="academic">
          {parkingStatus ? (
            <View style={[styles.board, { gap: cardGap }]}>
              {boardSlots.map((slot, index) => (
                <SlotTile key={slot?.slotNumber ?? `slot-${index}`} slot={slot} width={slotCardWidth} />
              ))}
            </View>
          ) : (
            <EmptyState icon="car-sport-outline" title="Chưa có dữ liệu" description="Sơ đồ sẽ hiện sau khi tải xong." />
          )}
        </SectionCard>

        <SectionCard title="Dữ liệu hệ thống" subtitle="Gateway và thời điểm ghi nhận." variant="glass" tone="telemetry">
          {parkingStatus ? (
            <View style={styles.infoGrid}>
              <InfoRow label="Cổng" value={parkingStatus.gateId} />
              <InfoRow
                label="Cập nhật"
                value={formatDateTime(parkingStatus.lastUpdated ?? parkingStatus.sensors.reportedAt ?? null)}
              />
              <InfoRow label="Gateway" value={gatewayLabel} />
              <InfoRow label="IP thiết bị" value={parkingStatus.sensors.deviceIp ?? '--'} />
            </View>
          ) : (
            <EmptyState icon="hardware-chip-outline" title="Chưa có dữ liệu" description="Kéo xuống để làm mới." />
          )}
        </SectionCard>

        <SectionCard title="Xe đã đăng ký" subtitle="Danh sách hiện có." variant="outlined">
          {vehicles.length > 0 ? (
            <View style={styles.vehicleGrid}>
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
                        <Text style={[styles.vehiclePlate, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                          {vehicle.plateNumber}
                        </Text>
                        <Text style={[styles.metaText, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                          RFID {vehicle.rfidTag}
                        </Text>
                      </View>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </View>
                    <Text style={[styles.metaText, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                      {vehicle.label ?? 'Chưa có nhãn'}
                    </Text>
                    <View style={styles.infoGrid}>
                      <InfoRow label="Hạn gói" value={formatSubscriptionDate(vehicle.subscription.endDate)} />
                      <InfoRow label="Phí tháng" value={`${formatCurrency(vehicle.subscription.monthlyFee)} VND`} />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon="car-outline"
              title="Chưa có xe đăng ký"
              description="Đăng ký xe để hệ thống tạo gói tương ứng."
              actionLabel="Đăng ký xe"
              onActionPress={() => router.push('/parking/vehicle-registration')}
            />
          )}
        </SectionCard>

        <SectionCard title="Gói gửi xe" subtitle="Trạng thái gói hiện tại." variant="subtle" tone="telemetry">
          {vehicles.length > 0 ? (
            <View style={styles.sectionStack}>
              <View style={styles.badgeRow}>
                <StatusBadge label={`${subscriptionSummary.active} hiệu lực`} tone="success" />
                <StatusBadge label={`${subscriptionSummary.pending} chờ duyệt`} tone="warning" />
                <StatusBadge label={`${subscriptionSummary.expired} hết hạn`} tone="danger" />
                <StatusBadge label={`${subscriptionSummary.inactive} chưa kích hoạt`} tone="info" />
              </View>
              <SecondaryButton label="Mở gói gửi xe" onPress={() => router.push('/parking/payment-status')} />
            </View>
          ) : (
            <EmptyState
              icon="wallet-outline"
              title="Chưa có gói gửi xe"
              description="Đăng ký xe trước để tạo gói tương ứng."
              actionLabel="Đăng ký xe"
              onActionPress={() => router.push('/parking/vehicle-registration')}
            />
          )}
        </SectionCard>

        <SectionCard title="Hành động" subtitle="Tác vụ chính." variant="metric" tone="primary">
          <View style={styles.sectionStack}>
            <PrimaryButton label="Đăng ký xe" onPress={() => router.push('/parking/vehicle-registration')} />
            <SecondaryButton label="Thanh toán" onPress={() => router.push('/parking/payment-status')} />
          </View>
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

type SensorTone = 'success' | 'warning' | 'danger' | 'info' | 'primary';
type SensorMotion = 'slot' | 'rain' | 'heat' | 'cold' | 'humidity' | 'fire' | 'calm';

function getClimateState(temperature: number | null, humidity: number | null) {
  const hasTemperature = typeof temperature === 'number';
  const hasHumidity = typeof humidity === 'number';
  const value = `${hasTemperature ? `${temperature}°C` : '--°C'} · ${hasHumidity ? `${humidity}%` : '--%'}`;
  const caption = 'Nhiệt độ · Độ ẩm';

  if (!hasTemperature && !hasHumidity) {
    return {
      value,
      caption,
      advisory: 'Chưa có dữ liệu',
      icon: 'thermometer-outline' as keyof typeof Ionicons.glyphMap,
      tone: 'info' as SensorTone,
      motion: 'calm' as SensorMotion,
      active: false,
    };
  }

  if (hasTemperature && temperature >= 34) {
    return {
      value,
      caption,
      advisory: 'Uống nước',
      icon: 'sunny-outline' as keyof typeof Ionicons.glyphMap,
      tone: 'warning' as SensorTone,
      motion: 'heat' as SensorMotion,
      active: true,
    };
  }

  if (hasTemperature && temperature <= 22) {
    return {
      value,
      caption,
      advisory: 'Giữ ấm',
      icon: 'snow-outline' as keyof typeof Ionicons.glyphMap,
      tone: 'info' as SensorTone,
      motion: 'cold' as SensorMotion,
      active: true,
    };
  }

  if (hasHumidity && humidity <= 40) {
    return {
      value,
      caption,
      advisory: 'Khô hanh',
      icon: 'water-outline' as keyof typeof Ionicons.glyphMap,
      tone: 'warning' as SensorTone,
      motion: 'humidity' as SensorMotion,
      active: true,
    };
  }

  if (hasHumidity && humidity >= 85) {
    return {
      value,
      caption,
      advisory: 'Ẩm cao',
      icon: 'water-outline' as keyof typeof Ionicons.glyphMap,
      tone: 'info' as SensorTone,
      motion: 'humidity' as SensorMotion,
      active: true,
    };
  }

  return {
    value,
    caption,
    advisory: 'Ổn định',
    icon: 'thermometer-outline' as keyof typeof Ionicons.glyphMap,
    tone: 'success' as SensorTone,
    motion: 'calm' as SensorMotion,
    active: true,
  };
}

function SensorStatusCard({
  width,
  label,
  value,
  caption,
  advisory,
  icon,
  tone,
  motion,
  active,
}: {
  width: number;
  label: string;
  value: string;
  caption: string;
  advisory: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: SensorTone;
  motion: SensorMotion;
  active: boolean;
}) {
  const theme = useAppTheme();
  const [reduceMotion, setReduceMotion] = useState(process.env.NODE_ENV === 'test');
  const progress = useRef(new Animated.Value(0)).current;
  const toneStyle = getSensorToneStyle(theme, tone);
  const shouldAnimate = active && !reduceMotion;

  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      return undefined;
    }

    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setReduceMotion(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!shouldAnimate) {
      progress.stopAnimation();
      progress.setValue(0);
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: motion === 'fire' ? 520 : 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: motion === 'fire' ? 520 : 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [motion, progress, shouldAnimate]);

  const iconScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, motion === 'fire' ? 1.12 : motion === 'slot' ? 1.08 : motion === 'calm' ? 1.03 : 1.06],
  });
  const iconTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, motion === 'slot' ? 3 : 0],
  });
  const iconTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      0,
      motion === 'rain'
        ? 5
        : motion === 'cold'
          ? -4
          : motion === 'heat' || motion === 'humidity' || motion === 'calm'
            ? -2
            : 0,
    ],
  });
  const haloOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      0.12,
      motion === 'fire' ? 0.42 : motion === 'heat' || motion === 'humidity' ? 0.32 : motion === 'calm' ? 0.18 : 0.28,
    ],
  });

  return (
    <View
      style={[
        styles.sensorCard,
        {
          backgroundColor: toneStyle.surface,
          borderColor: toneStyle.border,
          width,
        },
      ]}
    >
      <View style={styles.sensorHeader}>
        <View style={[styles.sensorIconWrap, { backgroundColor: toneStyle.iconSurface }]}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.sensorHalo,
              {
                backgroundColor: toneStyle.accent,
                opacity: shouldAnimate ? haloOpacity : 0.12,
              },
            ]}
          />
          <Animated.View
            style={{
              transform: [{ scale: iconScale }, { translateX: iconTranslateX }, { translateY: iconTranslateY }],
            }}
          >
            <Ionicons name={icon} size={22} color={toneStyle.accent} />
          </Animated.View>
        </View>
        <Text style={[styles.sensorAdvisory, { color: toneStyle.accent, fontFamily: theme.fonts.semibold }]}>
          {advisory}
        </Text>
      </View>
      <Text style={[styles.sensorLabel, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>{label}</Text>
      <Text style={[styles.sensorValue, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>{value}</Text>
      <Text style={[styles.sensorCaption, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
        {caption}
      </Text>
    </View>
  );
}

function getSensorToneStyle(theme: ReturnType<typeof useAppTheme>, tone: SensorTone) {
  switch (tone) {
    case 'success':
      return {
        surface: theme.colors.successSurface,
        iconSurface: theme.colors.surfaceElevated,
        border: theme.colors.success,
        accent: theme.colors.success,
      };
    case 'warning':
      return {
        surface: theme.colors.warningSurface,
        iconSurface: theme.colors.surfaceElevated,
        border: theme.colors.warning,
        accent: theme.colors.warning,
      };
    case 'danger':
      return {
        surface: theme.colors.emergencySurface,
        iconSurface: theme.colors.surfaceElevated,
        border: theme.colors.emergency,
        accent: theme.colors.emergency,
      };
    case 'info':
      return {
        surface: theme.colors.infoSurface,
        iconSurface: theme.colors.surfaceElevated,
        border: theme.colors.info,
        accent: theme.colors.info,
      };
    default:
      return {
        surface: theme.colors.primarySurface,
        iconSurface: theme.colors.surfaceElevated,
        border: theme.colors.primary,
        accent: theme.colors.primary,
      };
  }
}

function SlotTile({ slot, width }: { slot: ParkingSlotState | null; width: number }) {
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
  const label = state === 'available' ? 'Trống' : state === 'occupied' ? 'Có xe' : 'Chưa có';

  return (
    <View style={[styles.slotTile, { backgroundColor, borderColor, width }]}>
      <Text style={[styles.slotNumber, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
        {slot?.slotNumber ?? '--'}
      </Text>
      <Text style={[styles.slotState, { color: theme.colors.textMuted, fontFamily: theme.fonts.medium }]}>{label}</Text>
      {slot?.vehiclePlate ? (
        <Text style={[styles.slotMeta, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}>
          {slot.vehiclePlate}
        </Text>
      ) : null}
    </View>
  );
}

function getSubscriptionMeta(status: RegisteredVehicle['subscription']['status']) {
  switch (status) {
    case 'active':
      return { label: 'Hiệu lực', tone: 'success' as const };
    case 'pending':
      return { label: 'Chờ duyệt', tone: 'warning' as const };
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
  sectionStack: {
    gap: 12,
  },
  infoGrid: {
    gap: 8,
  },
  gatewayCallout: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  calloutTitle: {
    fontSize: 14,
  },
  calloutBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sensorCard: {
    minHeight: 142,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    overflow: 'hidden',
  },
  sensorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  sensorIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sensorHalo: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 999,
  },
  sensorAdvisory: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'right',
  },
  sensorLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  sensorValue: {
    fontSize: 19,
    lineHeight: 24,
  },
  sensorCaption: {
    fontSize: 11,
    lineHeight: 15,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  slotTile: {
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
  vehicleGrid: {
    gap: 12,
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
