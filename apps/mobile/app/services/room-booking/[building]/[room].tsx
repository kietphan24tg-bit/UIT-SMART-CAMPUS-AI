import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ContentStack,
  EmptyState,
  FormField,
  PrimaryButton,
  Screen,
  SecondaryButton,
} from '@/components/ui';
import { getBuilding, getRoom } from '@/constants/room-booking-data';
import { roomBookingsApi } from '@/services/api/room-bookings';
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

export default function RoomDetailScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const params = useLocalSearchParams<{ building?: string; room?: string }>();
  const buildingId = typeof params.building === 'string' ? params.building.toUpperCase() : '';
  const roomId = typeof params.room === 'string' ? params.room.toUpperCase() : '';
  const building = getBuilding(buildingId);
  const room = getRoom(buildingId, roomId);

  const scheduleQuery = useQuery({
    queryKey: ['room-bookings', 'room-schedule', roomId],
    queryFn: () => roomBookingsApi.getRoomSchedule(roomId),
    enabled: Boolean(roomId),
  });

  const schedule = scheduleQuery.data ?? [];
  const [selectedDayKey, setSelectedDayKey] = useState<RoomScheduleDay['dayKey']>(
    schedule[0]?.dayKey ?? 'mon',
  );
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [mode, setMode] = useState<'schedule' | 'booking'>('schedule');
  const [title, setTitle] = useState('Học nhóm');
  const [purpose, setPurpose] = useState('Học nhóm');
  const [attendeeCount, setAttendeeCount] = useState('5');
  const [contactPhone, setContactPhone] = useState(user?.phone ?? '');
  const [needsProjector, setNeedsProjector] = useState(true);
  const [needsMicrophone, setNeedsMicrophone] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const createBookingMutation = useMutation({
    mutationFn: roomBookingsApi.createRoomBooking,
    onSuccess: async () => {
      setSubmitted(true);
      setFormError('');
      await queryClient.invalidateQueries({
        queryKey: ['room-bookings', 'room-schedule', roomId],
      });
    },
    onError: (error) => {
      setSubmitted(false);
      setFormError(getErrorMessage(error));
    },
  });

  const selectedDay =
    schedule.find((item) => item.dayKey === selectedDayKey) ?? schedule[0] ?? null;

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
      setSelectedSlotId('');
      return;
    }

    const firstBookableSlot = selectedDay.slots.find((slot) => slot.status !== 'occupied');
    setSelectedSlotId((current) => {
      if (
        current &&
        selectedDay.slots.some((slot) => slot.id === current && slot.status !== 'occupied')
      ) {
        return current;
      }

      return firstBookableSlot?.id ?? '';
    });
  }, [selectedDay]);

  useEffect(() => {
    setContactPhone((current) => current || user?.phone || '');
  }, [user?.phone]);

  if (!building || !room) {
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

  const selectedSlot = selectedDay?.slots.find((slot) => slot.id === selectedSlotId) ?? null;
  const canBook = Boolean(
    selectedDay?.slots.some((slot) => slot.status !== 'occupied') && selectedSlot,
  );
  const selectedDate = toDisplayDate(selectedDay?.dateKey);

  const handleSubmitBooking = () => {
    if (!selectedDay || !selectedSlot || !selectedDay.dateKey) {
      setSubmitted(false);
      setFormError('Không xác định được ngày đặt phòng từ lịch tuần hiện tại.');
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
      setSubmitted(false);
      setFormError('Không tìm thấy thông tin người đặt phòng.');
      return;
    }

    if (!normalizedTitle) {
      setSubmitted(false);
      setFormError('Vui lòng nhập tiêu đề yêu cầu.');
      return;
    }

    if (!normalizedPurpose) {
      setSubmitted(false);
      setFormError('Vui lòng nhập mục đích sử dụng phòng.');
      return;
    }

    if (!Number.isInteger(normalizedAttendeeCount) || normalizedAttendeeCount < 1) {
      setSubmitted(false);
      setFormError('Số người phải lớn hơn 0.');
      return;
    }

    setSubmitted(false);
    setFormError('');
    createBookingMutation.mutate({
      roomCode: room.code,
      bookingDate: selectedDay.dateKey ?? '',
      timeSlotId: selectedSlot.id,
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
            {mode === 'booking' ? 'Lịch phòng' : building.name}
          </Text>
        </Pressable>

        {scheduleQuery.isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Không tải được lịch phòng"
            description="Vui lòng thử lại khi backend sẵn sàng."
            actionLabel="Thử lại"
            onActionPress={() => void scheduleQuery.refetch()}
          />
        ) : null}

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
              {room.code}
            </Text>

            <View style={styles.dayTabs}>
              {schedule.map((day) => (
                <Pressable
                  key={day.dayKey}
                  accessibilityRole="button"
                  onPress={() => {
                    setSelectedDayKey(day.dayKey);
                    setSubmitted(false);
                  }}
                  style={({ pressed }) => [
                    styles.dayTab,
                    {
                      backgroundColor:
                        selectedDayKey === day.dayKey
                          ? theme.colors.primarySurface
                          : theme.colors.surfaceSubtle,
                      borderColor:
                        selectedDayKey === day.dayKey ? theme.colors.primary : theme.colors.border,
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
                          selectedDayKey === day.dayKey ? theme.fonts.semibold : theme.fonts.medium,
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
                  selected={slot.id === selectedSlotId}
                  onPress={() => {
                    if (slot.status === 'occupied') {
                      return;
                    }

                    setSelectedSlotId(slot.id);
                    setSubmitted(false);
                  }}
                />
              ))}
            </View>

            <PrimaryButton
              label="Đặt phòng"
              disabled={!canBook}
              onPress={() => setMode('booking')}
            />
          </View>
        ) : null}

        {mode === 'booking' && selectedSlot ? (
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
              <MetaRow label="Phòng:" value={room.code} />
              <MetaRow label="Ngày:" value={selectedDate} />
              <MetaRow label="Giờ:" value={`${selectedSlot.startTime} - ${selectedSlot.endTime}`} />
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

            {submitted ? (
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
              label="Submit"
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
  const slotText = slot.courseCode ?? slot.label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: slot.status === 'occupied', selected }}
      disabled={slot.status === 'occupied'}
      onPress={onPress}
      style={({ pressed }) => [
        styles.slotRow,
        {
          backgroundColor: selected ? theme.colors.primarySurface : theme.colors.surfaceSubtle,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          opacity: slot.status === 'occupied' ? 1 : pressed ? 0.84 : 1,
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
  dayTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayTab: {
    minWidth: 48,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
