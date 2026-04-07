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
import {
  formatCurrency,
  formatDateTime,
  formatSubscriptionDate,
} from '@/utils/app';
import { getPaymentStatusRecord } from '@/utils/role-ui';

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
      <ContentStack narrow>
        <EmptyState
          title="Khong tim thay tac vu parking"
          description="Task key nay chua duoc khai bao trong Parking + IoT family."
          actionLabel="Quay lai parking"
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
      Alert.alert('Parking + IoT', 'Vui long nhap day du bien so va RFID.');
      return;
    }

    try {
      await parking.createVehicle({
        plateNumber,
        rfidTag,
        label: label.trim() || undefined,
      });
      Alert.alert('Dang ky xe', 'Thong tin xe da duoc luu. Backend co the noi them validation chi tiet sau.');
      onDone();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Khong the dang ky xe luc nay.';
      Alert.alert('Dang ky xe', message);
    }
  };

  return (
    <Screen>
      <TopHero
        eyebrow="Parking + IoT"
        title="Vehicle registration"
        subtitle="Luong dang ky xe tach rieng khoi overview de thao tac dai va validation khong lam roi man parking chinh."
        badge={{ label: 'Task screen', tone: 'primary' }}
      />

      <ContentStack narrow>
        <SectionCard title="Thong tin can nhap" subtitle="Tap trung vao bien so, RFID va ghi chu ngan.">
          <View style={styles.column}>
            <FormField
              label="Bien so"
              placeholder="51F44614"
              value={plateNumber}
              onChangeText={setPlateNumber}
              autoCapitalize="characters"
            />
            <FormField
              label="RFID"
              placeholder="UIT-RFID-0001"
              value={rfidTag}
              onChangeText={setRfidTag}
              autoCapitalize="characters"
            />
            <FormField
              label="Nhan xe"
              placeholder="Xe may ca nhan"
              value={label}
              onChangeText={setLabel}
            />
          </View>
        </SectionCard>

        <SectionCard title="Contract backend" subtitle="Chot payload cho phase backend tiep theo.">
          <InfoRow label="Mutation" value="POST /parking/vehicles" />
          <InfoRow label="Validation" value="plateNumber, rfidTag, role, duplicate plate" />
          <InfoRow label="States" value="loading, error, success, duplicate, permission denied" />
        </SectionCard>

        <PrimaryButton
          label="Dang ky xe"
          loading={parking.isSubmittingVehicle}
          onPress={() => void handleSubmit()}
        />
        <SecondaryButton label="Quay lai parking" onPress={onDone} />
      </ContentStack>
    </Screen>
  );
}

function PaymentStatusTask({ onDone }: { onDone: () => void }) {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const router = useRouter();
  const parking = useParkingOverview();
  const paymentRecord = getPaymentStatusRecord(parking.data);
  const vehicles = parking.data?.vehicles ?? [];
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
      const message = error instanceof Error ? error.message : 'Khong the tao giao dich MoMo.';
      Alert.alert('Thanh toan gui xe', message);
    }
  };

  const tone =
    paymentRecord?.status === 'success'
      ? 'success'
      : paymentRecord?.status === 'pending'
        ? 'warning'
        : 'danger';

  return (
    <Screen>
      <TopHero
        eyebrow="Parking + IoT"
        title="Parking payment status"
        subtitle="Trang thai thanh toan tach rieng de user kiem tra pending / success / failed ma khong lam loang overview sensor."
        badge={{ label: paymentRecord ? paymentRecord.status.toUpperCase() : 'NO VEHICLE', tone: paymentRecord ? tone : 'info' }}
      />

      <ContentStack>
        {paymentRecord ? (
          <SectionCard title="Thanh toan gan nhat" subtitle="Snapshot de backend noi payment status record rieng.">
            <View style={styles.column}>
              <StatusBadge
                label={paymentRecord.status === 'success' ? 'Thanh cong' : paymentRecord.status === 'pending' ? 'Dang cho' : 'Can thanh toan lai'}
                tone={tone}
              />
              <InfoRow label="Transaction" value={paymentRecord.transactionId} />
              <InfoRow label="Order" value={paymentRecord.orderId} />
              <InfoRow label="Provider" value={paymentRecord.provider} />
              <InfoRow label="So tien" value={`${formatCurrency(paymentRecord.amount)} VND`} />
              <InfoRow label="Cap nhat" value={formatDateTime(paymentRecord.updatedAt)} />
              <Text style={[styles.body, { color: theme.colors.textMuted }]}>{paymentRecord.note}</Text>
            </View>
          </SectionCard>
        ) : (
          <EmptyState
            icon="wallet-outline"
            title="Chua co du lieu thanh toan"
            description="Khi user chua dang ky xe, parking payment status se hien empty state ro rang thay vi handoff URL mo ho."
          />
        )}

        <SectionCard title="Xe da dang ky" subtitle="Mỗi xe co CTA thanh toan rieng va state goi gui xe.">
          {vehicles.length > 0 ? (
            <View style={styles.grid}>
              {vehicles.map((vehicle) => (
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
                  <Text style={[styles.vehicleTitle, { color: theme.colors.text }]}>{vehicle.plateNumber}</Text>
                  <Text style={[styles.body, { color: theme.colors.textMuted }]}>
                    RFID {vehicle.rfidTag} · {vehicle.label || 'Khong co nhan xe'}
                  </Text>
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
                  <Text style={[styles.body, { color: theme.colors.textMuted }]}>
                    Han goi: {formatSubscriptionDate(vehicle.subscription.endDate)}
                  </Text>
                  <Text style={[styles.body, { color: theme.colors.textMuted }]}>
                    Phi thang: {formatCurrency(vehicle.subscription.monthlyFee)} VND
                  </Text>
                  <SecondaryButton
                    label="Thanh toan qua MoMo"
                    loading={parking.isSubmittingPayment}
                    onPress={() => void handlePayment(vehicle.id)}
                  />
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="car-sport-outline"
              title="Ban chua dang ky xe"
              description="Tao luong vehicle registration truoc, sau do quay lai day de xem payment state va CTA."
              actionLabel="Dang ky xe"
              onActionPress={() => router.push('/parking/vehicle-registration')}
            />
          )}
        </SectionCard>

        <SecondaryButton label="Quay lai parking" onPress={onDone} />
      </ContentStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  column: {
    gap: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
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
