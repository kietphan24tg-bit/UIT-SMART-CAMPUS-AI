import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import {
  ContentStack,
  EmptyState,
  FormField,
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
import type { ParkingTaskKey } from '@/types/app-data';
import { formatCurrency, formatDateTime, formatSubscriptionDate } from '@/utils/app';

export default function ParkingTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ task?: string }>();
  const task = params.task as ParkingTaskKey | undefined;

  if (task === 'vehicle-registration') {
    return <VehicleRegistrationTask onDone={() => router.replace('/parking')} />;
  }

  if (task === 'payment-status') {
    return <PaymentStatusTask onDone={() => router.replace('/parking')} />;
  }

  return (
    <Screen>
      <ContentStack narrow overlapHero={false}>
        <EmptyState
          title="Không tìm thấy tác vụ"
          description="Tác vụ này chưa có trong nhóm Parking + IoT."
          actionLabel="Quay lại parking"
          onActionPress={() => router.replace('/parking')}
        />
      </ContentStack>
    </Screen>
  );
}

function VehicleRegistrationTask({ onDone }: { onDone: () => void }) {
  const parking = useParkingOverview();
  const [plateNumber, setPlateNumber] = useState('');
  const [rfidTag, setRfidTag] = useState('');
  const [label, setLabel] = useState('');

  const handleSubmit = async () => {
    if (!plateNumber.trim() || !rfidTag.trim()) {
      Alert.alert('Đăng ký xe', 'Vui lòng nhập đầy đủ biển số và mã RFID.');
      return;
    }

    try {
      await parking.createVehicle({
        plateNumber,
        rfidTag,
        label: label.trim() || undefined,
      });
      Alert.alert(
        'Đăng ký xe',
        'Đăng ký thành công. Bạn có thể mở mục Thanh toán để kích hoạt hoặc gia hạn gói.',
      );
      onDone();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể đăng ký xe lúc này.';
      Alert.alert('Đăng ký xe', message);
    }
  };

  return (
    <Screen>
      <TopHero
        eyebrow="Parking + IoT"
        title="Đăng ký xe"
        subtitle="Nhập biển số và RFID để liên kết xe với tài khoản."
        badge={{ label: 'Đang hỗ trợ', tone: 'success' }}
      />

      <ContentStack narrow overlapHero={false}>
        <SectionCard title="Thông tin xe" subtitle="Nhập thông tin để hoàn tất đăng ký.">
          <View style={styles.column}>
            <FormField
              label="Biển số"
              placeholder="51F-446.14"
              value={plateNumber}
              onChangeText={setPlateNumber}
              autoCapitalize="characters"
            />
            <FormField
              label="Mã RFID"
              placeholder="UIT-RFID-0001"
              value={rfidTag}
              onChangeText={setRfidTag}
              autoCapitalize="characters"
            />
            <FormField
              label="Nhãn xe"
              placeholder="Xe máy cá nhân"
              value={label}
              onChangeText={setLabel}
            />
          </View>
        </SectionCard>

        <SectionCard title="Lưu ý" subtitle="Thông tin cần biết trước khi thanh toán gói gửi xe.">
          <InfoRow label="Bắt buộc" value="Biển số và RFID" />
          <InfoRow label="Tạo gói gửi xe" value="Hệ thống tạo theo xe đã đăng ký" />
          <InfoRow label="Thanh toán" value="Thực hiện ở màn Thanh toán và gói gửi xe" />
        </SectionCard>

        <PrimaryButton
          label="Lưu thông tin xe"
          loading={parking.isSubmittingVehicle}
          onPress={() => void handleSubmit()}
        />
        <SecondaryButton label="Quay lại parking" onPress={onDone} />
      </ContentStack>
    </Screen>
  );
}

function PaymentStatusTask({ onDone }: { onDone: () => void }) {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const router = useRouter();
  const parking = useParkingOverview();
  const vehicles = parking.data?.vehicles ?? [];
  const summary = summarizeSubscriptions(vehicles);
  const columns = layout.getGridColumns({
    minItemWidth: 220,
    gap: 12,
    maxColumns: layout.isTablet ? 2 : 1,
  });
  const cardWidth = layout.getGridItemWidth({ columns, gap: 12 });

  const handlePayment = async (vehicleId: string) => {
    try {
      const checkout = await parking.createPayment(vehicleId);
      await Linking.openURL(checkout.checkoutUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạo giao dịch MoMo.';
      const displayMessage = isMomoConfigError(message)
        ? 'Thanh toán MoMo chưa sẵn sàng trên môi trường hiện tại. Hãy kiểm tra các biến MOMO_* ở máy chủ.'
        : message;

      Alert.alert('Thanh toán gửi xe', displayMessage);
    }
  };

  return (
    <Screen>
      <TopHero
        eyebrow="Parking + IoT"
        title="Thanh toán và gói gửi xe"
        subtitle="Hiển thị trạng thái gói thực tế và điểm vào thanh toán MoMo."
        badge={{
          label: vehicles.length > 0 ? `${vehicles.length} xe đã đăng ký` : 'Chưa có xe',
          tone: vehicles.length > 0 ? 'info' : 'warning',
        }}
      />

      <ContentStack overlapHero={false}>
        <SectionCard title="Trạng thái hiện có" subtitle="Tổng hợp trạng thái gói gửi xe.">
          {vehicles.length > 0 ? (
            <View style={styles.column}>
              <View style={styles.badgeRow}>
                <StatusBadge label={`${summary.active} đang hiệu lực`} tone="success" />
                <StatusBadge label={`${summary.pending} đang chờ`} tone="warning" />
                <StatusBadge label={`${summary.expired} đã hết hạn`} tone="danger" />
                <StatusBadge label={`${summary.inactive} chưa kích hoạt`} tone="info" />
              </View>
              <Text style={[styles.body, { color: theme.colors.textMuted }]}>
                Sau khi thanh toán, trạng thái gói sẽ cập nhật ở lần làm mới tiếp theo.
              </Text>
            </View>
          ) : (
            <EmptyState
              icon="wallet-outline"
              title="Chưa có dữ liệu gói gửi xe"
              description="Bạn cần đăng ký ít nhất một xe trước khi thanh toán."
              actionLabel="Đăng ký xe"
              onActionPress={() => router.push('/parking/vehicle-registration')}
            />
          )}
        </SectionCard>

        <SectionCard title="Xe đã đăng ký" subtitle="Mỗi xe có nút thanh toán riêng.">
          {vehicles.length > 0 ? (
            <View style={styles.grid}>
              {vehicles.map((vehicle) => {
                const status = getSubscriptionMeta(vehicle.subscription.status);

                return (
                  <View
                    key={vehicle.id}
                    style={[
                      styles.vehicleCard,
                      { width: cardWidth },
                      {
                        backgroundColor: theme.colors.surfaceSubtle,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.vehicleTitle, { color: theme.colors.text }]}>
                      {vehicle.plateNumber}
                    </Text>
                    <Text style={[styles.body, { color: theme.colors.textMuted }]}>
                      RFID {vehicle.rfidTag} · {vehicle.label || 'Chưa đặt nhãn'}
                    </Text>
                    <StatusBadge label={status.label} tone={status.tone} />
                    <InfoRow label="Hạn gói" value={formatSubscriptionDate(vehicle.subscription.endDate)} />
                    <InfoRow
                      label="Lần thanh toán gần nhất"
                      value={formatDateTime(vehicle.subscription.lastPaymentAt)}
                    />
                    <InfoRow
                      label="Phí tháng"
                      value={`${formatCurrency(vehicle.subscription.monthlyFee)} VND`}
                    />
                    <SecondaryButton
                      label={vehicle.subscription.status === 'active' ? 'Gia hạn qua MoMo' : 'Thanh toán qua MoMo'}
                      loading={parking.isSubmittingPayment}
                      onPress={() => void handlePayment(vehicle.id)}
                    />
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon="car-sport-outline"
              title="Bạn chưa đăng ký xe"
              description="Đăng ký xe trước, sau đó quay lại để thanh toán hoặc gia hạn."
              actionLabel="Đăng ký xe"
              onActionPress={() => router.push('/parking/vehicle-registration')}
            />
          )}
        </SectionCard>

        <SecondaryButton label="Quay lại parking" onPress={onDone} />
      </ContentStack>
    </Screen>
  );
}

function getSubscriptionMeta(status: 'inactive' | 'pending' | 'active' | 'expired') {
  switch (status) {
    case 'active':
      return { label: 'Đang hiệu lực', tone: 'success' as const };
    case 'pending':
      return { label: 'Đang chờ', tone: 'warning' as const };
    case 'expired':
      return { label: 'Đã hết hạn', tone: 'danger' as const };
    default:
      return { label: 'Chưa kích hoạt', tone: 'info' as const };
  }
}

function summarizeSubscriptions(
  vehicles: Array<{ subscription: { status: 'inactive' | 'pending' | 'active' | 'expired' } }>,
) {
  return vehicles.reduce(
    (acc, vehicle) => {
      acc[vehicle.subscription.status] += 1;
      return acc;
    },
    { inactive: 0, pending: 0, active: 0, expired: 0 },
  );
}

function isMomoConfigError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes('cấu hình momo') || normalized.includes('momo configuration is incomplete');
}

const styles = StyleSheet.create({
  column: {
    gap: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vehicleCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  vehicleTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
});
