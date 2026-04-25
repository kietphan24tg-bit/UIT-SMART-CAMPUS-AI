import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ContentStack,
  EmptyState,
  FormField,
  PrimaryButton,
  Screen,
  SecondaryButton,
} from '@/components/ui';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import {
  roomBookingsApi,
  type RoomBookingResponse,
} from '@/services/api/room-bookings';
import { useAuthStore } from '@/stores/auth-store';
import type { RoomScheduleDay, RoomScheduleSlot } from '@/types/room-booking';
import { useAppTheme } from '@/theme';

const DAY_TITLES: Record<RoomScheduleDay['dayKey'], string> = {
  mon: 'Thứ 2:',
  tue: 'Thứ 3:',
  wed: 'Thứ 4:',
  thu: 'Thứ 5:',
  fri: 'Thứ 6:',
  sat: 'Thứ 7:',
};

function toDisplayDate(dateKey?: string) {
  if (!dateKey) {
    return '--/--/----';
  }

  const parsed = new Date(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return dateKey;
  }

  return parsed.toLocaleDateString('vi-VN');
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return 'Không thể gửi yêu cầu đặt phòng lúc này.';
}

function getUserDisplayName(
  user: { firstName?: string; lastName?: string; email?: string } | null,
) {
  const fullName = [user?.lastName, user?.firstName].filter(Boolean).join(' ').trim();
  return fullName || user?.email || '';
}

function isBookableSlot(slot: RoomScheduleSlot) {
  return slot.status === 'free';
}

function sortSlotsByOrder(slots: RoomScheduleSlot[]) {
  return [...slots].sort((left, right) => left.slotNumber - right.slotNumber);
}

function getSelectedSlots(day: RoomScheduleDay | null, selectedSlotIds: string[]) {
  if (!day || selectedSlotIds.length === 0) {
    return [];
  }

  const selectedIdSet = new Set(selectedSlotIds);
  return sortSlotsByOrder(day.slots.filter((slot) => selectedIdSet.has(slot.id)));
}

function toggleSlotSelection(day: RoomScheduleDay, selectedSlotIds: string[], targetId: string) {
  const targetSlot = day.slots.find((slot) => slot.id === targetId);
  if (!targetSlot || !isBookableSlot(targetSlot)) {
    return selectedSlotIds;
  }

  const selectedSlots = getSelectedSlots(day, selectedSlotIds);
  if (selectedSlots.length === 0) {
    return [targetSlot.id];
  }

  const firstSelected = selectedSlots[0]!;
  const lastSelected = selectedSlots[selectedSlots.length - 1]!;
  const selectedIdSet = new Set(selectedSlotIds);

  if (selectedIdSet.has(targetSlot.id)) {
    if (selectedSlots.length === 1) {
      return [targetSlot.id];
    }

    if (targetSlot.id === firstSelected.id) {
      return selectedSlots.slice(1).map((slot) => slot.id);
    }

    if (targetSlot.id === lastSelected.id) {
      return selectedSlots.slice(0, -1).map((slot) => slot.id);
    }

    return [targetSlot.id];
  }

  if (targetSlot.slotNumber === firstSelected.slotNumber - 1) {
    return [targetSlot.id, ...selectedSlots.map((slot) => slot.id)];
  }

  if (targetSlot.slotNumber === lastSelected.slotNumber + 1) {
    return [...selectedSlots.map((slot) => slot.id), targetSlot.id];
  }

  return [targetSlot.id];
}

function getSelectionSummary(selectedSlots: RoomScheduleSlot[]) {
  if (selectedSlots.length === 0) {
    return '--';
  }

  const firstSlot = selectedSlots[0]!;
  const lastSlot = selectedSlots[selectedSlots.length - 1]!;
  const slotCountLabel = `${selectedSlots.length} tiết`;

  return `${firstSlot.startTime} - ${lastSlot.endTime} · ${slotCountLabel}`;
}

function getScheduleErrorTitle(error: unknown) {
  const message = getErrorMessage(error);
  if (message.toLowerCase().includes('không tìm thấy phòng')) {
    return 'Không tìm thấy phòng';
  }

  return 'Không tải được lịch phòng';
}

function getScheduleErrorDescription(error: unknown) {
  const message = getErrorMessage(error);
  if (message.toLowerCase().includes('không tìm thấy phòng')) {
    return 'Kiểm tra lại liên kết hoặc quay về danh sách phòng.';
  }

  return 'Vui lòng thử lại khi backend sẵn sàng.';
}

export default function RoomDetailScreen() {
  const theme = useAppTheme();
  const layout = useResponsiveLayout();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const params = useLocalSearchParams<{ building?: string; room?: string }>();
  const buildingId = typeof params.building === 'string' ? params.building.toUpperCase() : '';
  const roomId = typeof params.room === 'string' ? params.room.toUpperCase() : '';

  const scheduleQuery = useQuery({
    queryKey: ['room-bookings', 'room-schedule', roomId],
    queryFn: () => roomBookingsApi.getRoomSchedule(roomId),
    enabled: Boolean(roomId),
  });

  const schedule = scheduleQuery.data?.days ?? [];
  const roomCode = scheduleQuery.data?.roomCode ?? roomId;
  const roomName = scheduleQuery.data?.roomName ?? null;
  const buildingCode = scheduleQuery.data?.buildingCode ?? buildingId;
  const buildingName =
    scheduleQuery.data?.buildingName ?? (buildingCode ? `Tòa ${buildingCode}` : 'Đặt phòng');

  const [selectedDayKey, setSelectedDayKey] = useState<RoomScheduleDay['dayKey']>('mon');
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [mode, setMode] = useState<'schedule' | 'booking'>('schedule');
  const [title, setTitle] = useState('Học nhóm');
  const [purpose, setPurpose] = useState('Học nhóm');
  const [attendeeCount, setAttendeeCount] = useState('5');
  const [contactPhone, setContactPhone] = useState(user?.phone ?? '');
  const [needsProjector, setNeedsProjector] = useState(true);
  const [needsMicrophone, setNeedsMicrophone] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState<RoomBookingResponse | null>(null);
  const [formError, setFormError] = useState('');

  const createBookingMutation = useMutation({
    mutationFn: roomBookingsApi.createRoomBooking,
    onSuccess: async (booking) => {
      setSubmittedBooking(booking);
      setFormError('');
      await queryClient.invalidateQueries({
        queryKey: ['room-bookings', 'room-schedule', roomId],
      });
    },
    onError: (error) => {
      setSubmittedBooking(null);
      setFormError(getErrorMessage(error));
    },
  });

  const selectedDay =
    schedule.find((item) => item.dayKey === selectedDayKey) ?? schedule[0] ?? null;
  const selectedSlots = useMemo(
    () => getSelectedSlots(selectedDay, selectedSlotIds),
    [selectedDay, selectedSlotIds],
  );
  const selectedDate = toDisplayDate(selectedDay?.dateKey);
  const selectionSummary = getSelectionSummary(selectedSlots);

  useEffect(() => {
    if (!schedule.length) {
      setSelectedDayKey('mon');
      return;
    }

    setSelectedDayKey((current) =>
      schedule.some((day) => day.dayKey === current) ? current : schedule[0].dayKey,
    );
  }, [schedule]);

  useEffect(() => {
    if (!selectedDay) {
      setSelectedSlotIds([]);
      return;
    }

    const firstBookableSlot = selectedDay.slots.find(isBookableSlot);
    setSelectedSlotIds((current) => {
      const nextSelectedSlots = getSelectedSlots(selectedDay, current).filter(isBookableSlot);
      if (nextSelectedSlots.length > 0) {
        return nextSelectedSlots.map((slot) => slot.id);
      }

      return firstBookableSlot ? [firstBookableSlot.id] : [];
    });
  }, [selectedDay]);

  useEffect(() => {
    setContactPhone((current) => current || user?.phone || '');
  }, [user?.phone]);

  if (!roomId) {
    return (
      <Screen>
        <ContentStack>
          <EmptyState
            title="Không tìm thấy phòng"
            description="Kiểm tra lại liên kết hoặc quay về danh sách phòng."
            actionLabel="Về danh sách phòng"
            onActionPress={() =>
              router.replace(`/services/room-booking/${buildingId || 'C'}` as never)
            }
          />
        </ContentStack>
      </Screen>
    );
  }

  if (scheduleQuery.isError) {
    return (
      <Screen>
        <ContentStack>
          <EmptyState
            icon="cloud-offline-outline"
            title={getScheduleErrorTitle(scheduleQuery.error)}
            description={getScheduleErrorDescription(scheduleQuery.error)}
            actionLabel={
              getScheduleErrorTitle(scheduleQuery.error) === 'Không tìm thấy phòng'
                ? 'Về danh sách phòng'
                : 'Thử lại'
            }
            onActionPress={() => {
              if (getScheduleErrorTitle(scheduleQuery.error) === 'Không tìm thấy phòng') {
                router.replace(`/services/room-booking/${buildingId || 'C'}` as never);
                return;
              }

              void scheduleQuery.refetch();
            }}
          />
        </ContentStack>
      </Screen>
    );
  }

  const canBook = Boolean(selectedDay?.dateKey && selectedSlots.length > 0);

  const handleSubmitBooking = () => {
    if (!selectedDay?.dateKey || selectedSlots.length === 0) {
      setSubmittedBooking(null);
      setFormError('Không xác định được khung giờ đặt phòng hợp lệ.');
      return;
    }

    const contactName = getUserDisplayName(user);
    const normalizedTitle = title.trim();
    const normalizedPurpose = purpose.trim();
    const normalizedContactPhone = contactPhone.trim();
    const normalizedAttendeeCount = Number.parseInt(attendeeCount.trim(), 10);
    const equipment = [
      needsProjector ? 'Máy chiếu' : null,
      needsMicrophone ? 'Micro' : null,
    ].filter(Boolean);

    if (!contactName) {
      setSubmittedBooking(null);
      setFormError('Không tìm thấy thông tin người đặt phòng.');
      return;
    }

    if (!normalizedTitle) {
      setSubmittedBooking(null);
      setFormError('Vui lòng nhập tên yêu cầu.');
      return;
    }

    if (!normalizedPurpose) {
      setSubmittedBooking(null);
      setFormError('Vui lòng nhập mục đích sử dụng phòng.');
      return;
    }

    if (!Number.isInteger(normalizedAttendeeCount) || normalizedAttendeeCount < 1) {
      setSubmittedBooking(null);
      setFormError('Số người phải lớn hơn 0.');
      return;
    }

    setSubmittedBooking(null);
    setFormError('');
    createBookingMutation.mutate({
      roomCode,
      bookingDate: selectedDay.dateKey,
      timeSlotIds: selectedSlots.map((slot) => slot.id),
      purpose: equipment.length
        ? `${normalizedPurpose} - Thiết bị cần: ${equipment.join(', ')}`
        : normalizedPurpose,
      contactName,
      attendeeCount: normalizedAttendeeCount,
      title: normalizedTitle,
      ...(normalizedContactPhone ? { contactPhone: normalizedContactPhone } : {}),
    });
  };

  return (
    <Screen>
      <ContentStack gap={16} overlapHero={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại danh sách phòng"
          onPress={() => {
            if (mode === 'booking') {
              setMode('schedule');
              return;
            }

            router.back();
          }}
          style={({ pressed }) => [
            styles.backPill,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.82 : 1,
            },
          ]}
        >
          <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
          <Text
            style={[
              styles.backLabel,
              { color: theme.colors.text, fontFamily: theme.fonts.semibold },
            ]}
          >
            {mode === 'booking' ? 'Lịch phòng' : buildingName}
          </Text>
        </Pressable>

        {mode === 'schedule' ? (
          <View
            style={[
              styles.panel,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
              theme.elevation.level1 as never,
            ]}
          >
            <Text
              style={[styles.roomTitle, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}
            >
              {roomCode}
            </Text>
            {roomName ? (
              <Text
                style={[
                  styles.roomMeta,
                  { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
                ]}
              >
                {roomName}
              </Text>
            ) : null}

            <View style={styles.dayTabs}>
              {schedule.map((day) => (
                <Pressable
                  key={day.dayKey}
                  testID={`room-day-tab-${day.dayKey}`}
                  accessibilityRole="button"
                  onPress={() => {
                    setSelectedDayKey(day.dayKey);
                    setSubmittedBooking(null);
                    setFormError('');
                  }}
                  style={({ pressed }) => [
                    styles.dayTab,
                    !layout.isTablet ? styles.dayTabMobile : null,
                    {
                      backgroundColor:
                        selectedDayKey === day.dayKey
                          ? theme.colors.primarySurface
                          : theme.colors.surfaceSubtle,
                      borderColor:
                        selectedDayKey === day.dayKey
                          ? theme.colors.primary
                          : theme.colors.border,
                      opacity: pressed ? 0.84 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayTabLabel,
                      {
                        color:
                          selectedDayKey === day.dayKey
                            ? theme.colors.primary
                            : theme.colors.textMuted,
                        fontFamily:
                          selectedDayKey === day.dayKey
                            ? theme.fonts.semibold
                            : theme.fonts.medium,
                      },
                    ]}
                  >
                    {day.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text, fontFamily: theme.fonts.semibold },
              ]}
            >
              {DAY_TITLES[selectedDay?.dayKey ?? 'mon']}
            </Text>

            <View style={styles.slotList}>
              {selectedDay?.slots.map((slot) => (
                <ScheduleRow
                  key={slot.id}
                  slot={slot}
                  selected={selectedSlotIds.includes(slot.id)}
                  onPress={() => {
                    setSelectedSlotIds((current) => toggleSlotSelection(selectedDay, current, slot.id));
                    setSubmittedBooking(null);
                    setFormError('');
                  }}
                />
              ))}
            </View>

            <View
              style={[
                styles.selectionCard,
                {
                  backgroundColor: theme.colors.surfaceSubtle,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <MetaRow label="Ngày:" value={selectedDate} />
              <MetaRow label="Giờ:" value={selectionSummary} />
            </View>

            <PrimaryButton
              label="Đặt phòng"
              disabled={!canBook}
              onPress={() => setMode('booking')}
            />
          </View>
        ) : null}

        {mode === 'booking' && selectedSlots.length > 0 ? (
          <View
            style={[
              styles.panel,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
              theme.elevation.level1 as never,
            ]}
          >
            <Text
              style={[
                styles.bookingHeader,
                { color: theme.colors.text, fontFamily: theme.fonts.bold },
              ]}
            >
              Đặt phòng
            </Text>

            <View style={styles.metaList}>
              <MetaRow label="Phòng:" value={roomCode} />
              <MetaRow label="Ngày:" value={selectedDate} />
              <MetaRow label="Giờ:" value={selectionSummary} />
            </View>

            <View style={styles.formSection}>
              <FormField label="Tên" value={title} onChangeText={setTitle} />
              <FormField label="Mục đích" value={purpose} onChangeText={setPurpose} />
              <FormField
                label="Số người"
                value={attendeeCount}
                onChangeText={setAttendeeCount}
                keyboardType="number-pad"
              />
              <FormField
                label="Số điện thoại"
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formSection}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                ]}
              >
                Thiết bị cần:
              </Text>
              <View style={styles.checkboxList}>
                <CheckboxRow
                  label="Máy chiếu"
                  checked={needsProjector}
                  onPress={() => setNeedsProjector((prev) => !prev)}
                />
                <CheckboxRow
                  label="Micro"
                  checked={needsMicrophone}
                  onPress={() => setNeedsMicrophone((prev) => !prev)}
                />
              </View>
            </View>

            {submittedBooking ? (
              <View
                style={[
                  styles.notice,
                  {
                    backgroundColor: theme.colors.successSurface,
                    borderColor: theme.colors.success,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.noticeText,
                    { color: theme.colors.success, fontFamily: theme.fonts.semibold },
                  ]}
                >
                  Yêu cầu đặt phòng đã được gửi.
                </Text>
              </View>
            ) : null}

            {formError ? (
              <View
                style={[
                  styles.notice,
                  {
                    backgroundColor: theme.colors.dangerSurface,
                    borderColor: theme.colors.danger,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.noticeText,
                    { color: theme.colors.danger, fontFamily: theme.fonts.semibold },
                  ]}
                >
                  {formError}
                </Text>
              </View>
            ) : null}

            <PrimaryButton
              label="Gửi yêu cầu"
              loading={createBookingMutation.isPending}
              onPress={handleSubmitBooking}
            />
            <SecondaryButton
              label="Quay lại lịch phòng"
              disabled={createBookingMutation.isPending}
              onPress={() => setMode('schedule')}
            />
          </View>
        ) : null}
      </ContentStack>
    </Screen>
  );
}

function ScheduleRow({
  slot,
  selected,
  onPress,
}: {
  slot: RoomScheduleSlot;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const statusColor =
    slot.status === 'free'
      ? theme.colors.success
      : slot.status === 'occupied'
        ? theme.colors.text
        : theme.colors.info;
  const slotText = slot.courseCode ?? slot.statusLabel ?? slot.label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !isBookableSlot(slot), selected }}
      disabled={!isBookableSlot(slot)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.slotRow,
        {
          backgroundColor: selected ? theme.colors.primarySurface : theme.colors.surfaceSubtle,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          opacity: !isBookableSlot(slot) ? 1 : pressed ? 0.84 : 1,
        },
      ]}
    >
      <Text style={[styles.slotTime, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>
        {slot.startTime} - {slot.endTime}
      </Text>
      <Text style={[styles.slotLabel, { color: statusColor, fontFamily: theme.fonts.semibold }]}>
        {slotText}
      </Text>
    </Pressable>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();

  return (
    <View style={styles.metaRow}>
      <Text
        style={[styles.metaLabel, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}
      >
        {label}
      </Text>
      <Text
        style={[styles.metaValue, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}
      >
        {value}
      </Text>
    </View>
  );
}

function CheckboxRow({
  label,
  checked,
  onPress,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={styles.checkboxRow}
    >
      <Ionicons
        name={checked ? 'checkbox-outline' : 'square-outline'}
        size={20}
        color={checked ? theme.colors.primary : theme.colors.textSoft}
      />
      <Text
        style={[styles.checkboxLabel, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backPill: {
    alignSelf: 'flex-start',
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  backLabel: {
    fontSize: 14,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 16,
  },
  roomTitle: {
    fontSize: 28,
  },
  roomMeta: {
    marginTop: -8,
    fontSize: 14,
  },
  dayTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayTab: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayTabMobile: {
    width: '31.5%',
  },
  dayTabLabel: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 17,
  },
  slotList: {
    gap: 10,
  },
  slotRow: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  slotTime: {
    flex: 1,
    fontSize: 15,
  },
  slotLabel: {
    flexShrink: 0,
    fontSize: 14,
  },
  selectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  bookingHeader: {
    fontSize: 26,
  },
  metaList: {
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    width: 56,
    fontSize: 14,
  },
  metaValue: {
    flex: 1,
    fontSize: 15,
  },
  formSection: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
  },
  checkboxList: {
    gap: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkboxLabel: {
    fontSize: 15,
  },
  notice: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noticeText: {
    fontSize: 14,
  },
});
