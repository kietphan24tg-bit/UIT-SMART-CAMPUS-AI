import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type {
  ParkingStatus,
  ParkingSubscriptionStatus,
  RegisteredVehicle,
} from '@smart-campus/shared';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { parkingApi } from '@/services/api';

function formatDate(value: string | null) {
  if (!value) {
    return 'Chua co';
  }

  return new Date(value).toLocaleString('vi-VN');
}

function getSubscriptionTone(status: ParkingSubscriptionStatus) {
  switch (status) {
    case 'active':
      return { bg: '#DCFCE7', text: '#166534', label: 'Dang hoat dong' };
    case 'expired':
      return { bg: '#FEE2E2', text: '#991B1B', label: 'Da het han' };
    case 'pending':
      return { bg: '#FEF3C7', text: '#92400E', label: 'Dang cho xu ly' };
    default:
      return { bg: '#E5E7EB', text: '#374151', label: 'Chua kich hoat' };
  }
}

export default function ParkingScreen() {
  const [status, setStatus] = useState<ParkingStatus | null>(null);
  const [vehicles, setVehicles] = useState<RegisteredVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingVehicle, setSubmittingVehicle] = useState(false);
  const [payingVehicleId, setPayingVehicleId] = useState<string | null>(null);
  const [plateNumber, setPlateNumber] = useState('');
  const [rfidTag, setRfidTag] = useState('');
  const [label, setLabel] = useState('');

  const availableRatio = useMemo(() => {
    if (!status || !status.totalSlots) {
      return '0/0';
    }

    return `${status.availableSlots}/${status.totalSlots}`;
  }, [status]);

  const loadData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [parkingStatus, registeredVehicles] = await Promise.all([
        parkingApi.getStatus(),
        parkingApi.getVehicles(),
      ]);

      setStatus(parkingStatus);
      setVehicles(registeredVehicles);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Khong tai du lieu parking';
      Alert.alert('Parking', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const handleCreateVehicle = async () => {
    if (!plateNumber.trim() || !rfidTag.trim()) {
      Alert.alert('Parking', 'Vui long nhap bien so va RFID');
      return;
    }

    try {
      setSubmittingVehicle(true);
      await parkingApi.createVehicle({
        plateNumber,
        rfidTag,
        label: label.trim() || undefined,
      });

      setPlateNumber('');
      setRfidTag('');
      setLabel('');
      await loadData(true);
      Alert.alert('Parking', 'Dang ky xe thanh cong');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Khong the dang ky xe';
      Alert.alert('Parking', message);
    } finally {
      setSubmittingVehicle(false);
    }
  };

  const handlePay = async (vehicleId: string) => {
    try {
      setPayingVehicleId(vehicleId);
      const checkout = await parkingApi.createMomoPayment(vehicleId);
      await Linking.openURL(checkout.checkoutUrl);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Khong the tao thanh toan';
      Alert.alert('Thanh toan', message);
    } finally {
      setPayingVehicleId(null);
    }
  };

  if (loading && !status) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text style={styles.loadingText}>Dang tai du lieu bai xe...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void loadData(true)}
          tintColor="#1E40AF"
        />
      }
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>UIT Campus Parking</Text>
        <Text style={styles.heroSubtitle}>
          Theo doi telemetry, slot trong va goi gui xe ngay tren app.
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{availableRatio}</Text>
          <Text style={styles.metricLabel}>Cho trong</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{status?.activeSessions ?? 0}</Text>
          <Text style={styles.metricLabel}>Xe dang gui</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cam bien moi nhat</Text>
        <View style={styles.sensorGrid}>
          <View style={styles.sensorCard}>
            <Text style={styles.sensorValue}>
              {status?.sensors.temperature ?? '--'} C
            </Text>
            <Text style={styles.sensorLabel}>Nhiet do</Text>
          </View>
          <View style={styles.sensorCard}>
            <Text style={styles.sensorValue}>
              {status?.sensors.humidity ?? '--'} %
            </Text>
            <Text style={styles.sensorLabel}>Do am</Text>
          </View>
          <View style={styles.sensorCard}>
            <Text style={styles.sensorValue}>
              {status?.sensors.rainDetected ? 'Dang mua' : 'Kho rao'}
            </Text>
            <Text style={styles.sensorLabel}>Cam bien mua</Text>
          </View>
          <View
            style={[
              styles.sensorCard,
              status?.sensors.fireDetected ? styles.fireCard : null,
            ]}
          >
            <Text
              style={[
                styles.sensorValue,
                status?.sensors.fireDetected ? styles.fireText : null,
              ]}
            >
              {status?.sensors.fireDetected ? 'Phat hien lua' : 'An toan'}
            </Text>
            <Text style={styles.sensorLabel}>Canh bao lua</Text>
          </View>
        </View>
        <Text style={styles.metaText}>
          ESP32: {status?.sensors.deviceIp ?? 'Chua ghi nhan'}
        </Text>
        <Text style={styles.metaText}>
          Cap nhat: {formatDate(status?.sensors.reportedAt ?? null)}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trang thai slot</Text>
        <View style={styles.slotGrid}>
          {(status?.slots ?? []).map((slot) => (
            <View
              key={slot.slotNumber}
              style={[
                styles.slotCard,
                slot.isOccupied ? styles.slotBusy : styles.slotFree,
              ]}
            >
              <Text style={styles.slotName}>{slot.slotNumber}</Text>
              <Text style={styles.slotState}>
                {slot.isOccupied ? 'Da co xe' : 'Trong'}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dang ky xe moi</Text>
        <View style={styles.formCard}>
          <TextInput
            value={plateNumber}
            onChangeText={setPlateNumber}
            placeholder="Bien so xe"
            autoCapitalize="characters"
            style={styles.input}
          />
          <TextInput
            value={rfidTag}
            onChangeText={setRfidTag}
            placeholder="Ma RFID"
            autoCapitalize="characters"
            style={styles.input}
          />
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="Ghi chu (tu chon)"
            style={styles.input}
          />
          <Pressable
            style={[styles.primaryButton, submittingVehicle && styles.buttonDisabled]}
            onPress={() => void handleCreateVehicle()}
            disabled={submittingVehicle}
          >
            <Text style={styles.primaryButtonText}>
              {submittingVehicle ? 'Dang luu...' : 'Dang ky xe'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Xe da dang ky</Text>
        {(vehicles ?? []).map((vehicle) => {
          const tone = getSubscriptionTone(vehicle.subscription.status);
          return (
            <View key={vehicle.id} style={styles.vehicleCard}>
              <View style={styles.vehicleHeader}>
                <View>
                  <Text style={styles.vehiclePlate}>{vehicle.plateNumber}</Text>
                  <Text style={styles.vehicleLabel}>
                    {vehicle.label || 'Khong co ghi chu'}
                  </Text>
                </View>
                <View style={[styles.subscriptionBadge, { backgroundColor: tone.bg }]}>
                  <Text style={[styles.subscriptionText, { color: tone.text }]}>
                    {tone.label}
                  </Text>
                </View>
              </View>

              <Text style={styles.vehicleMeta}>RFID: {vehicle.rfidTag}</Text>
              <Text style={styles.vehicleMeta}>
                Han goi: {formatDate(vehicle.subscription.endDate)}
              </Text>
              <Text style={styles.vehicleMeta}>
                Phi thang: {vehicle.subscription.monthlyFee.toLocaleString('vi-VN')} VND
              </Text>

              <Pressable
                style={[
                  styles.secondaryButton,
                  payingVehicleId === vehicle.id && styles.buttonDisabled,
                ]}
                onPress={() => void handlePay(vehicle.id)}
                disabled={payingVehicleId === vehicle.id}
              >
                <Ionicons name="wallet-outline" size={18} color="#1E40AF" />
                <Text style={styles.secondaryButtonText}>
                  {payingVehicleId === vehicle.id
                    ? 'Dang tao thanh toan...'
                    : 'Thanh toan 40K/thang'}
                </Text>
              </Pressable>
            </View>
          );
        })}

        {vehicles.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="car-sport-outline" size={36} color="#94A3B8" />
            <Text style={styles.emptyText}>
              Ban chua dang ky xe nao tren UIT Campus.
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#475569',
  },
  hero: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: '#BFDBFE',
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: -18,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  metricLabel: {
    marginTop: 6,
    fontSize: 13,
    color: '#475569',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sensorCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
  },
  fireCard: {
    backgroundColor: '#FEF2F2',
  },
  sensorValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  fireText: {
    color: '#B91C1C',
  },
  sensorLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748B',
  },
  metaText: {
    marginTop: 8,
    color: '#475569',
    fontSize: 13,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  slotCard: {
    width: '48%',
    borderRadius: 18,
    padding: 16,
  },
  slotFree: {
    backgroundColor: '#DCFCE7',
  },
  slotBusy: {
    backgroundColor: '#FEE2E2',
  },
  slotName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  slotState: {
    marginTop: 6,
    fontSize: 13,
    color: '#475569',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  primaryButton: {
    backgroundColor: '#1E40AF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  vehiclePlate: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  vehicleLabel: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 13,
  },
  vehicleMeta: {
    color: '#334155',
    fontSize: 13,
  },
  subscriptionBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  subscriptionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#1E40AF',
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: '#64748B',
    textAlign: 'center',
  },
});
