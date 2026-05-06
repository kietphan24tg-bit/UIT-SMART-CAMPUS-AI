import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContentStack, EmptyState, Screen, SecondaryButton, SkeletonBlock } from '@/components/ui';
import { roomBookingsApi } from '@/services/api/room-bookings';
import { useAppTheme } from '@/theme';
import { formatDateTime } from '@/utils/app';

export default function MyRoomBookingsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const bookingsQuery = useQuery({
    queryKey: ['room-bookings', 'my'],
    queryFn: () => roomBookingsApi.listMyBookings(),
  });

  const deleteMutation = useMutation({
    mutationFn: (bookingId: string) => roomBookingsApi.deleteBooking(bookingId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['room-bookings', 'my'] }),
        queryClient.invalidateQueries({ queryKey: ['room-bookings', 'room-schedule'] }),
      ]);
    },
  });

  function confirmDeleteBooking(bookingId: string) {
    Alert.alert('Xóa yêu cầu', 'Bạn có chắc muốn xóa yêu cầu đặt phòng này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(bookingId),
      },
    ]);
  }

  return (
    <Screen>
      <View style={[styles.headerRow, { paddingTop: theme.spacing.sm, paddingHorizontal: theme.spacing.lg }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
          style={styles.backHit}
        >
          <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
          Yêu cầu của tôi
        </Text>
        <View style={styles.backHit} />
      </View>

      <ContentStack narrow overlapHero={false}>
        {bookingsQuery.isLoading ? (
          <View style={styles.skeletonWrap}>
            <SkeletonBlock height={110} />
            <SkeletonBlock height={110} />
          </View>
        ) : null}

        {!bookingsQuery.isLoading && bookingsQuery.isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Không tải được danh sách yêu cầu"
            description="Vui lòng thử lại."
            actionLabel="Thử lại"
            onActionPress={() => void bookingsQuery.refetch()}
          />
        ) : null}

        {!bookingsQuery.isLoading && !bookingsQuery.isError && (bookingsQuery.data?.length ?? 0) === 0 ? (
          <EmptyState
            icon="albums-outline"
            title="Chưa có yêu cầu nào"
            description="Bạn chưa tạo yêu cầu đặt phòng."
          />
        ) : null}

        {(bookingsQuery.data?.length ?? 0) > 0 ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.list}>
              {bookingsQuery.data?.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                    {item.roomCode} · {item.title ?? 'Yêu cầu đặt phòng'}
                  </Text>
                  <Text style={[styles.meta, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                    {item.bookingDate} · {item.startTime ?? '--'}-{item.endTime ?? '--'}
                  </Text>
                  <Text style={[styles.meta, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                    Trạng thái: {item.status}
                  </Text>
                  <Text style={[styles.meta, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}>
                    Tạo lúc: {formatDateTime(item.createdAt)}
                  </Text>
                  <SecondaryButton
                    label={deleteMutation.isPending ? 'Đang xóa...' : 'Xóa yêu cầu'}
                    onPress={() => confirmDeleteBooking(item.id)}
                    disabled={deleteMutation.isPending}
                  />
                </View>
              ))}
            </View>
          </ScrollView>
        ) : null}
      </ContentStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backHit: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  skeletonWrap: {
    gap: 10,
  },
  list: {
    gap: 10,
    paddingBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  title: {
    fontSize: 14,
  },
  meta: {
    fontSize: 12,
    lineHeight: 18,
  },
});
