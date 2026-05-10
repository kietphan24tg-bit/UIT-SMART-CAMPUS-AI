import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SosMap } from '@/components/maps/sos-map';
import { Screen } from '@/components/ui';
import { sosApi } from '@/services/api/sos';
import { useSosRealtimeStore } from '@/stores/sos-realtime-store';
import { useAppTheme } from '@/theme';

export default function SosFullMapScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sosId } = useLocalSearchParams<{ sosId?: string }>();
  const latestEvent = useSosRealtimeStore((state) =>
    sosId ? state.eventsById[sosId] : undefined,
  );

  const activeQuery = useQuery({
    queryKey: ['sos', 'active'],
    queryFn: () => sosApi.listActive(),
    refetchInterval: 120_000,
  });

  const selectedRequest = sosId
    ? latestEvent?.request ??
      activeQuery.data?.find((item) => item.id === sosId) ??
      null
    : null;

  const markers = selectedRequest
    ? [
        {
          id: selectedRequest.id,
          lat: selectedRequest.lat,
          lng: selectedRequest.lng,
          title: selectedRequest.requester?.fullName ?? 'SOS',
        },
      ]
    : (activeQuery.data ?? []).map((item) => ({
        id: item.id,
        lat: item.lat,
        lng: item.lng,
        title: item.requester?.fullName ?? 'SOS',
      }));

  const sosStatusLabel = getSosStatusLabel(selectedRequest?.status);

  return (
    <Screen scroll={false} variant="fullBleed">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <SosMap markers={markers} height={null} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Thoát bản đồ toàn màn hình"
          onPress={() => router.back()}
          style={[
            styles.backButton,
            {
              top: Math.max(insets.top + 8, 16),
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.semibold, fontSize: 18 }}>
            ←
          </Text>
        </Pressable>

        <View
          style={[
            styles.infoPanel,
            {
              right: 0,
              bottom: 0,
              left: 0,
              paddingTop: 16,
              paddingRight: 16,
              paddingBottom: Math.max(insets.bottom, 12) + 12,
              paddingLeft: 16,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.semibold, fontSize: 16 }}>
            {selectedRequest?.requester?.fullName ?? 'Bản đồ SOS'}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.regular, fontSize: 13 }}>
            {selectedRequest
              ? selectedRequest.addressSnapshot ||
                `${selectedRequest.lat.toFixed(6)}, ${selectedRequest.lng.toFixed(6)}`
              : 'Đang hiển thị toàn bộ SOS đang mở để đối chiếu vị trí snapshot.'}
          </Text>
          {sosStatusLabel ? (
            <Text style={{ color: theme.colors.warning, fontFamily: theme.fonts.medium, fontSize: 13 }}>
              {sosStatusLabel}
            </Text>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

function getSosStatusLabel(status?: string | null) {
  const labelByStatus: Record<string, string> = {
    cancelled: 'SOS này đã được hủy. Bạn không cần tiếp tục đến điểm này.',
    resolved: 'SOS này đã được kết thúc. Bản đồ chỉ giữ lại snapshot đã lưu.',
    expired: 'SOS này đã hết hiệu lực. Bản đồ chỉ giữ lại snapshot đã lưu.',
  };

  return status ? labelByStatus[status] ?? null : null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoPanel: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 20,
    gap: 6,
  },
});
