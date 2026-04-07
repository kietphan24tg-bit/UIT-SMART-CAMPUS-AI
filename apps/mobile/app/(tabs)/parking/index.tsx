import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import { MetricGrid } from '@/components/tasks';
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
import { getPaymentStatusRecord } from '@/utils/role-ui';

export default function ParkingScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const router = useRouter();
  const parking = useParkingOverview();
  const parkingStatus = parking.data?.status ?? null;
  const vehicles = parking.data?.vehicles ?? [];
  const paymentRecord = getPaymentStatusRecord(parking.data);
  const slotColumns = layout.getGridColumns({
    minItemWidth: 140,
    gap: 10,
    maxColumns: layout.isTablet ? 4 : 2,
  });
  const slotCardWidth = layout.getGridItemWidth({ columns: slotColumns, gap: 10 });

  const healthTone =
    parking.data?.telemetryHealth === 'fire-alert'
      ? 'danger'
      : parking.data?.telemetryHealth === 'offline' || parking.data?.telemetryHealth === 'stale'
        ? 'warning'
        : parking.data?.telemetryHealth === 'no-data'
          ? 'info'
          : 'success';

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
        eyebrow="Flagship live status"
        title="Parking + IoT"
        subtitle="Theo doi cho trong A1-A4, telemetry moi nhat va cac state degraded dung theo snapshot + polling cua mobile."
        badge={{
          label: getTelemetryHealthLabel(parking.data?.telemetryHealth ?? 'offline'),
          tone: healthTone,
        }}
      >
        <View style={styles.heroMeta}>
          <Text style={[styles.heroNumber, { color: theme.colors.heroText }]}>
            {parkingStatus ? `${parkingStatus.availableSlots}/${parkingStatus.totalSlots}` : '--'}
          </Text>
          <Text style={[styles.heroCaption, { color: theme.colors.heroSubtext }]}>cho dang trong</Text>
        </View>
      </TopHero>

      <ContentStack>
        {parking.data?.telemetryHealth === 'fire-alert' ? (
          <View
            style={[
              styles.alertBanner,
              layout.isCompact ? styles.alertBannerStacked : null,
              {
                backgroundColor: theme.colors.emergencySurface,
                borderColor: theme.colors.emergency,
              },
            ]}
          >
            <Ionicons name="flame-outline" size={22} color={theme.colors.emergency} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: theme.colors.emergency }]}>
                Canh bao chay tai khu parking
              </Text>
              <Text style={[styles.alertBody, { color: theme.colors.textMuted }]}>
                Uu tien xu ly su co truoc cac thao tac thong thuong. Snapshot gan nhat van duoc giu de khong mat ngu canh.
              </Text>
            </View>
          </View>
        ) : null}

        <MetricGrid
          items={[
            { label: 'Cho trong', value: `${parkingStatus?.availableSlots ?? '--'}`, helper: 'Available', tone: 'success' },
            { label: 'Dang gui', value: `${parkingStatus?.activeSessions ?? '--'}`, helper: 'Active sessions', tone: 'info' },
            { label: 'Da chiem', value: `${parkingStatus?.occupiedSlots ?? '--'}`, helper: 'Occupied', tone: 'warning' },
            { label: 'Xe da dang ky', value: `${vehicles.length}`, helper: 'Vehicle summary', tone: 'primary' },
          ]}
        />

        <SectionCard title="Tac vu chinh" subtitle="Long-form flows duoc tach rieng de khong lam roi overview.">
          <View style={styles.actionStack}>
            <PrimaryButton
              label="Dang ky xe"
              onPress={() => router.push('/parking/vehicle-registration')}
            />
            <SecondaryButton
              label="Kiem tra payment status"
              onPress={() => router.push('/parking/payment-status')}
            />
          </View>
        </SectionCard>

        <SectionCard title="Telemetry health" subtitle="Luon co last updated va trang thai degraded ro rang.">
          {parkingStatus ? (
            <View style={styles.column}>
              <View style={[styles.rowBetween, layout.isCompact ? styles.rowBetweenStacked : null]}>
                <StatusBadge label={getTelemetryHealthLabel(parking.data?.telemetryHealth ?? 'offline')} tone={healthTone} />
                <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                  {formatDateTime(parkingStatus.lastUpdated)}
                </Text>
              </View>
              <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                Gateway: {parkingStatus.gateId} · IP {parkingStatus.sensors.deviceIp || 'Chua xac dinh'}
              </Text>
              <View style={styles.sensorGrid}>
                <StatusBadge label={`Temp ${parkingStatus.sensors.temperature ?? '--'}°C`} tone="info" />
                <StatusBadge label={`Humidity ${parkingStatus.sensors.humidity ?? '--'}%`} tone="success" />
                <StatusBadge label={parkingStatus.sensors.rainDetected ? 'Co mua' : 'Kho rao'} tone="warning" />
                <StatusBadge label={parkingStatus.sensors.fireDetected ? 'Fire alert' : 'An toan'} tone={parkingStatus.sensors.fireDetected ? 'danger' : 'success'} />
              </View>
            </View>
          ) : (
            <EmptyState
              icon="cloud-offline-outline"
              title="Chua co snapshot parking"
              description="Neu gateway chua gui telemetry, app se chuyen sang no data/offline thay vi hien thi trang thai gia."
            />
          )}
        </SectionCard>

        <SectionCard title="Trang thai slot A1-A4" subtitle="Slot grid ngan gon, de quet nhanh tren dien thoai.">
          {parkingStatus?.slots?.length ? (
            <View style={styles.slotGrid}>
              {parkingStatus.slots.map((slot) => (
                <View
                  key={slot.slotNumber}
                  style={[
                    styles.slotCard,
                    { width: slotCardWidth },
                    {
                      backgroundColor: slot.isOccupied
                        ? theme.colors.dangerSurface
                        : theme.colors.successSurface,
                      borderColor: slot.isOccupied ? theme.colors.danger : theme.colors.success,
                    },
                  ]}
                >
                  <Text style={[styles.slotName, { color: theme.colors.text }]}>{slot.slotNumber}</Text>
                  <Text
                    style={[
                      styles.slotState,
                      { color: slot.isOccupied ? theme.colors.danger : theme.colors.success },
                    ]}
                  >
                    {slot.isOccupied ? 'Da co xe' : 'Dang trong'}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="car-outline"
              title="Chua co du lieu slot"
              description="Slot grid se hien thi ngay khi gateway bat dau gui trang thai A1-A4."
            />
          )}
        </SectionCard>

        <SectionCard title="Vehicle summary" subtitle="Overview chi hien summary, CTA payment da tach rieng thanh task screen.">
          {vehicles.length > 0 ? (
            <View style={styles.column}>
              {vehicles.map((vehicle) => (
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
                      <Text style={[styles.vehiclePlate, { color: theme.colors.text }]}>
                        {vehicle.plateNumber}
                      </Text>
                      <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                        RFID {vehicle.rfidTag} · {vehicle.label || 'Khong co ghi chu'}
                      </Text>
                    </View>
                    <StatusBadge
                      label={
                        vehicle.subscription.status === 'active'
                          ? 'Dang hieu luc'
                          : vehicle.subscription.status === 'pending'
                            ? 'Dang cho'
                            : vehicle.subscription.status === 'expired'
                              ? 'Da het han'
                              : 'Chua kich hoat'
                      }
                      tone={
                        vehicle.subscription.status === 'active'
                          ? 'success'
                          : vehicle.subscription.status === 'pending'
                            ? 'warning'
                            : vehicle.subscription.status === 'expired'
                              ? 'danger'
                              : 'info'
                      }
                    />
                  </View>
                  <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                    Han goi: {formatSubscriptionDate(vehicle.subscription.endDate)}
                  </Text>
                  <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                    Phi thang: {formatCurrency(vehicle.subscription.monthlyFee)} VND
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="car-sport-outline"
              title="Ban chua dang ky xe"
              description="Khi chua co xe, app van hien day du parking status nhung thay CTA bang luong dang ky xe ro rang."
              actionLabel="Dang ky xe"
              onActionPress={() => router.push('/parking/vehicle-registration')}
            />
          )}
        </SectionCard>

        <SectionCard title="Payment snapshot" subtitle="Pending / success / failed duoc hien ro de backend noi status record rieng.">
          {paymentRecord ? (
            <View style={styles.column}>
              <StatusBadge
                label={
                  paymentRecord.status === 'success'
                    ? 'Thanh cong'
                    : paymentRecord.status === 'pending'
                      ? 'Dang cho'
                      : 'Can thanh toan lai'
                }
                tone={
                  paymentRecord.status === 'success'
                    ? 'success'
                    : paymentRecord.status === 'pending'
                      ? 'warning'
                      : 'danger'
                }
              />
              <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                {paymentRecord.provider} · {formatCurrency(paymentRecord.amount)} VND · {formatDateTime(paymentRecord.updatedAt)}
              </Text>
              <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>{paymentRecord.note}</Text>
              <SecondaryButton
                label="Mo payment status"
                onPress={() => router.push('/parking/payment-status')}
              />
            </View>
          ) : (
            <EmptyState
              icon="wallet-outline"
              title="Chua co payment status"
              description="Module nay cho phep chot UI pending/success/failed truoc khi backend tra ve snapshot giao dich rieng."
            />
          )}
        </SectionCard>
      </ContentStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroMeta: {
    marginTop: 6,
  },
  heroNumber: {
    fontSize: 34,
    fontWeight: '900',
  },
  heroCaption: {
    fontSize: 13,
    marginTop: 4,
  },
  alertBanner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  alertBannerStacked: {
    flexDirection: 'column',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  alertBody: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  actionStack: {
    gap: 12,
  },
  column: {
    gap: 12,
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
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  slotName: {
    fontSize: 18,
    fontWeight: '800',
  },
  slotState: {
    fontSize: 13,
    fontWeight: '700',
  },
  vehicleCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  vehiclePlate: {
    fontSize: 17,
    fontWeight: '800',
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
