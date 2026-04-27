import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContentStack, EmptyState, PrimaryButton, Screen, SecondaryButton, SkeletonBlock } from '@/components/ui';
import { roomBookingsApi } from '@/services/api/room-bookings';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { isAdminRole } from '@/utils/app';

export default function RoomBookingApprovalsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);

  const isAdmin = isAdminRole(role);
  const pendingQuery = useQuery({
    queryKey: ['room-bookings', 'pending'],
    queryFn: roomBookingsApi.listPendingBookings,
    enabled: isAdmin,
  });

  const approveMutation = useMutation({
    mutationFn: (bookingId: string) => roomBookingsApi.approveBooking(bookingId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['room-bookings', 'pending'] }),
        queryClient.invalidateQueries({ queryKey: ['room-bookings', 'my'] }),
      ]);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (bookingId: string) => roomBookingsApi.rejectBooking(bookingId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['room-bookings', 'pending'] }),
        queryClient.invalidateQueries({ queryKey: ['room-bookings', 'my'] }),
      ]);
    },
  });

  if (!isAdmin) {
    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            icon="lock-closed-outline"
            title="Bạn không có quyền truy cập"
            description="Màn hình này chỉ dành cho admin và super admin."
            actionLabel="Quay lại"
            onActionPress={() => router.back()}
          />
        </ContentStack>
      </Screen>
    );
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
          Queue phê duyệt
        </Text>
        <View style={styles.backHit} />
      </View>

      <ContentStack narrow overlapHero={false}>
        <View
          style={[
            styles.noticeCard,
            {
              backgroundColor: theme.colors.primarySurface,
              borderColor: theme.colors.primary,
            },
          ]}
        >
          <Text style={[styles.noticeTitle, { color: theme.colors.primary, fontFamily: theme.fonts.semibold }]}>
            Duyệt theo ưu tiên đến trước
          </Text>
          <Text style={[styles.noticeBody, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
            Nhiều yêu cầu pending có thể trùng cùng một slot. Khi duyệt một yêu cầu, hệ thống sẽ tự từ chối các yêu cầu pending trùng slot còn lại.
          </Text>
        </View>

        {pendingQuery.isLoading ? (
          <View style={styles.skeletonWrap}>
            <SkeletonBlock height={120} />
            <SkeletonBlock height={120} />
          </View>
        ) : null}

        {!pendingQuery.isLoading && pendingQuery.isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Không tải được queue phê duyệt"
            description="Vui lòng thử lại."
            actionLabel="Thử lại"
            onActionPress={() => void pendingQuery.refetch()}
          />
        ) : null}

        {!pendingQuery.isLoading && !pendingQuery.isError && (pendingQuery.data?.length ?? 0) === 0 ? (
          <EmptyState
            icon="checkmark-done-outline"
            title="Không còn yêu cầu pending"
            description="Danh sách yêu cầu đang chờ duyệt hiện trống."
          />
        ) : null}

        {(pendingQuery.data?.length ?? 0) > 0 ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.list}>
              {pendingQuery.data?.map((item) => (
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
                    Người yêu cầu: {item.requester.fullName || item.requester.email}
                  </Text>
                  <Text style={[styles.meta, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}>
                    Mục đích: {item.purpose}
                  </Text>
                  <View style={styles.actionRow}>
                    <PrimaryButton
                      label={approveMutation.isPending ? 'Đang duyệt...' : 'Duyệt'}
                      onPress={() => approveMutation.mutate(item.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    />
                    <SecondaryButton
                      label={rejectMutation.isPending ? 'Đang từ chối...' : 'Từ chối'}
                      onPress={() => rejectMutation.mutate(item.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    />
                  </View>
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
  noticeCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  noticeTitle: {
    fontSize: 13,
  },
  noticeBody: {
    fontSize: 12,
    lineHeight: 18,
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
  actionRow: {
    gap: 8,
  },
});
