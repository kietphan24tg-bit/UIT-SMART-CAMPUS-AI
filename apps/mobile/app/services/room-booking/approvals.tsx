import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import { ContentStack, EmptyState, PrimaryButton, Screen, SecondaryButton, SkeletonBlock } from '@/components/ui';
import { roomBookingsApi, type AdminRoomRequestSlot } from '@/services/api/room-bookings';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme';
import { isAdminRole } from '@/utils/app';

function formatDate(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return dateKey;
  }
  return date.toLocaleDateString('vi-VN');
}

export default function RoomBookingApprovalsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const isAdmin = isAdminRole(role);
  const [selectedRoomCode, setSelectedRoomCode] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<AdminRoomRequestSlot | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState('');

  const roomGroupsQuery = useQuery({
    queryKey: ['room-bookings', 'admin', 'request-rooms'],
    queryFn: roomBookingsApi.listAdminRequestRooms,
    enabled: isAdmin,
  });

  const roomSlotsQuery = useQuery({
    queryKey: ['room-bookings', 'admin', 'request-slots', selectedRoomCode],
    queryFn: () => roomBookingsApi.listAdminRoomRequestSlots(selectedRoomCode),
    enabled: isAdmin && Boolean(selectedRoomCode),
  });

  const slotRequestsQuery = useQuery({
    queryKey: [
      'room-bookings',
      'admin',
      'slot-requests',
      selectedRoomCode,
      selectedSlot?.bookingDate,
      selectedSlot?.timeSlotIds[0],
    ],
    queryFn: () =>
      roomBookingsApi.getAdminSlotRequests(
        selectedRoomCode,
        selectedSlot?.bookingDate ?? '',
        selectedSlot?.timeSlotIds[0] ?? '',
      ),
    enabled: isAdmin && Boolean(selectedRoomCode) && Boolean(selectedSlot?.timeSlotIds[0]),
  });

  const invalidateApprovalQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['room-bookings', 'admin'] }),
      queryClient.invalidateQueries({ queryKey: ['room-bookings', 'pending'] }),
      queryClient.invalidateQueries({ queryKey: ['room-bookings', 'room-schedule'] }),
    ]);
  };

  const approveMutation = useMutation({
    mutationFn: roomBookingsApi.approveOneSlotRequest,
    onSuccess: async () => {
      setSelectedBookingId('');
      setSelectedSlot(null);
      await invalidateApprovalQueries();
    },
  });

  const rejectAllMutation = useMutation({
    mutationFn: roomBookingsApi.rejectAllSlotRequests,
    onSuccess: async () => {
      setSelectedBookingId('');
      setSelectedSlot(null);
      await invalidateApprovalQueries();
    },
  });

  if (!isAdmin) {
    return (
      <Screen>
        <ContentStack narrow>
          <EmptyState
            icon="lock-closed-outline"
            title="Bạn không có quyền truy cập"
            description="Màn hình này chỉ dành cho admin."
            actionLabel="Quay lại"
            onActionPress={() => router.back()}
          />
        </ContentStack>
      </Screen>
    );
  }

  const requests = slotRequestsQuery.data?.requests ?? [];
  const singleRequest = requests.length === 1 ? requests[0] : null;
  const effectiveSelectedBookingId = singleRequest?.id ?? selectedBookingId;

  const handleBack = () => {
    if (selectedSlot) {
      setSelectedSlot(null);
      setSelectedBookingId('');
      return;
    }
    if (selectedRoomCode) {
      setSelectedRoomCode('');
      return;
    }
    router.back();
  };

  return (
    <Screen>
      <View style={[styles.headerRow, { paddingTop: theme.spacing.sm, paddingHorizontal: theme.spacing.lg }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lai" onPress={handleBack} style={styles.backHit}>
          <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
          {selectedSlot ? selectedRoomCode : selectedRoomCode ? selectedRoomCode : 'Yêu cầu đặt phòng'}
        </Text>
        <View style={styles.backHit} />
      </View>

      <ContentStack narrow overlapHero={false}>
        {!selectedRoomCode ? (
          <RequestRoomsView
            loading={roomGroupsQuery.isLoading}
            error={roomGroupsQuery.isError}
            rooms={roomGroupsQuery.data ?? []}
            onRetry={() => void roomGroupsQuery.refetch()}
            onSelectRoom={(roomCode) => {
              setSelectedRoomCode(roomCode);
              setSelectedSlot(null);
              setSelectedBookingId('');
            }}
          />
        ) : null}

        {selectedRoomCode && !selectedSlot ? (
          <RequestSlotsView
            loading={roomSlotsQuery.isLoading}
            error={roomSlotsQuery.isError}
            slots={roomSlotsQuery.data?.slots ?? []}
            onRetry={() => void roomSlotsQuery.refetch()}
            onSelectSlot={(slot) => {
              setSelectedSlot(slot);
              setSelectedBookingId('');
            }}
          />
        ) : null}

        {selectedRoomCode && selectedSlot ? (
          <>
            <View style={[styles.slotHeader, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
              <Text style={[styles.slotHeaderTitle, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
                {formatDate(selectedSlot.bookingDate)}
              </Text>
              <Text style={[styles.slotHeaderMeta, { color: theme.colors.textMuted, fontFamily: theme.fonts.medium }]}>
                {selectedSlot.startTime} - {selectedSlot.endTime}
              </Text>
            </View>

            {slotRequestsQuery.isLoading ? (
              <View style={styles.skeletonWrap}>
                <SkeletonBlock height={112} />
                <SkeletonBlock height={112} />
              </View>
            ) : null}

            {!slotRequestsQuery.isLoading && slotRequestsQuery.isError ? (
              <EmptyState
                icon="cloud-offline-outline"
                title="Không tải được yêu cầu"
                description="Vui lòng thử lại."
                actionLabel="Thử lại"
                onActionPress={() => void slotRequestsQuery.refetch()}
              />
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.list}>
                {requests.map((item) => {
                  const selected = effectiveSelectedBookingId === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setSelectedBookingId(item.id)}
                      disabled={Boolean(singleRequest)}
                      style={({ pressed }) => [
                        styles.card,
                        {
                          backgroundColor: selected ? theme.colors.primarySurface : theme.colors.surfaceElevated,
                          borderColor: selected ? theme.colors.primary : theme.colors.border,
                          opacity: pressed ? 0.88 : 1,
                        },
                      ]}
                    >
                      <View style={styles.requestTitleRow}>
                        {!singleRequest ? (
                          <Ionicons
                            name={selected ? 'radio-button-on' : 'radio-button-off'}
                            size={18}
                            color={selected ? theme.colors.primary : theme.colors.textSoft}
                          />
                        ) : null}
                        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                          {item.title ?? 'Yêu cầu đặt phòng'}
                        </Text>
                      </View>
                      <Text style={[styles.meta, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                        {item.requester.fullName || item.requester.email}
                      </Text>
                      <Text style={[styles.meta, { color: theme.colors.textMuted, fontFamily: theme.fonts.regular }]}>
                        {item.attendeeCount ?? '--'} người{item.contactPhone ? ` · ${item.contactPhone}` : ''}
                      </Text>
                      <Text style={[styles.meta, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}>
                        Mục đích: {item.purpose}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.actionRow}>
              <SecondaryButton
                label={rejectAllMutation.isPending ? 'Đang từ chối...' : requests.length > 1 ? 'Từ chối tất cả' : 'Từ chối'}
                disabled={approveMutation.isPending || rejectAllMutation.isPending || !selectedSlot}
                onPress={() =>
                  rejectAllMutation.mutate({
                    roomCode: selectedRoomCode,
                    bookingDate: selectedSlot.bookingDate,
                    timeSlotIds: selectedSlot.timeSlotIds,
                  })
                }
              />
              <PrimaryButton
                label={approveMutation.isPending ? 'Đang duyệt...' : 'Duyệt'}
                disabled={
                  approveMutation.isPending ||
                  rejectAllMutation.isPending ||
                  !effectiveSelectedBookingId
                }
                onPress={() => approveMutation.mutate(effectiveSelectedBookingId)}
              />
            </View>
          </>
        ) : null}
      </ContentStack>
    </Screen>
  );
}

function RequestRoomsView({
  loading,
  error,
  rooms,
  onRetry,
  onSelectRoom,
}: {
  loading: boolean;
  error: boolean;
  rooms: Array<{
    roomCode: string;
    buildingName: string;
    pendingRequestCount: number;
    pendingSlotCount: number;
  }>;
  onRetry: () => void;
  onSelectRoom: (roomCode: string) => void;
}) {
  const theme = useAppTheme();
  if (loading) {
    return (
      <View style={styles.skeletonWrap}>
        <SkeletonBlock height={104} />
        <SkeletonBlock height={104} />
      </View>
    );
  }
  if (error) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        title="Không tải được danh sách phòng"
        description="Vui lòng thử lại."
        actionLabel="Thử lại"
        onActionPress={onRetry}
      />
    );
  }
  if (rooms.length === 0) {
    return (
      <EmptyState
        icon="checkmark-done-outline"
        title="Không còn yêu cầu chờ duyệt"
        description="Danh sách phòng có yêu cầu hiện đang trống."
      />
    );
  }

  return (
    <View style={styles.list}>
      {rooms.map((room) => (
        <Pressable
          key={room.roomCode}
          accessibilityRole="button"
          onPress={() => onSelectRoom(room.roomCode)}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.86 : 1,
            },
          ]}
        >
          <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
            {room.roomCode}
          </Text>
          <Text style={[styles.meta, { color: theme.colors.textMuted, fontFamily: theme.fonts.medium }]}>
            {room.pendingRequestCount} yêu cầu chờ duyệt
          </Text>
          <Text style={[styles.meta, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}>
            {room.pendingSlotCount} khung giờ có yêu cầu · {room.buildingName}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function RequestSlotsView({
  loading,
  error,
  slots,
  onRetry,
  onSelectSlot,
}: {
  loading: boolean;
  error: boolean;
  slots: AdminRoomRequestSlot[];
  onRetry: () => void;
  onSelectSlot: (slot: AdminRoomRequestSlot) => void;
}) {
  const theme = useAppTheme();
  if (loading) {
    return (
      <View style={styles.skeletonWrap}>
        <SkeletonBlock height={96} />
        <SkeletonBlock height={96} />
      </View>
    );
  }
  if (error) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        title="Không tải được khung giờ"
        description="Vui lòng thử lại."
        actionLabel="Thử lại"
        onActionPress={onRetry}
      />
    );
  }
  if (slots.length === 0) {
    return (
      <EmptyState
        icon="checkmark-done-outline"
        title="Phòng này không còn yêu cầu"
        description="Tất cả yêu cầu trong phòng này đã được xử lý."
      />
    );
  }

  return (
    <View style={styles.list}>
      {slots.map((slot) => (
        <Pressable
          key={`${slot.bookingDate}-${slot.timeSlotIds.join('-')}`}
          accessibilityRole="button"
          onPress={() => onSelectSlot(slot)}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.86 : 1,
            },
          ]}
        >
          <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
            {formatDate(slot.bookingDate)}
          </Text>
          <Text style={[styles.meta, { color: theme.colors.textMuted, fontFamily: theme.fonts.medium }]}>
            {slot.startTime} - {slot.endTime}
          </Text>
          <Text style={[styles.meta, { color: theme.colors.textSoft, fontFamily: theme.fonts.regular }]}>
            {slot.requestCount} yêu cầu cùng lịch
          </Text>
        </Pressable>
      ))}
    </View>
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
    fontSize: 15,
  },
  meta: {
    fontSize: 12,
    lineHeight: 18,
  },
  slotHeader: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  slotHeaderTitle: {
    fontSize: 18,
  },
  slotHeaderMeta: {
    fontSize: 13,
  },
  requestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionRow: {
    gap: 8,
    paddingBottom: 12,
  },
});
