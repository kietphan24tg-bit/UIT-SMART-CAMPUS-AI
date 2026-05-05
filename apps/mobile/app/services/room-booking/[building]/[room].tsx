import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  ContentStack,
  EmptyState,
  FormField,
  PrimaryButton,
  Screen,
  SecondaryButton,
} from '@/components/ui';
import { getBuilding, getRoom, getRoomSchedule } from '@/constants/room-booking-data';
import { roomBookingsApi } from '@/services/api/room-bookings';
import {
  formatWeekRangeLabel,
  getMondayKeyForDateKey,
  listAllBookableDateOptions,
  listAllowedWeekMondayKeys,
  shiftMockScheduleToWeek,
} from '@/utils/room-booking-weeks';
import { useAuthStore } from '@/stores/auth-store';
import type { RoomScheduleDay, RoomScheduleSlot } from '@/types/room-booking';
import { useAppTheme } from '@/theme';
import { isAdminRole } from '@/utils/app';

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

function buildAdminOverrideNote({
  purpose,
  attendeeCount,
  contactPhone,
}: {
  purpose: string;
  attendeeCount: string;
  contactPhone: string;
}) {
  return [
    `Mục đích: ${purpose}`,
    `Số người: ${attendeeCount}`,
    contactPhone ? `Số điện thoại: ${contactPhone}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export default function RoomDetailScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isAdmin = isAdminRole(user?.role);
  const params = useLocalSearchParams<{ building?: string; room?: string }>();
  const buildingId = typeof params.building === 'string' ? params.building.toUpperCase() : '';
  const roomId = typeof params.room === 'string' ? params.room.toUpperCase() : '';
  const building = getBuilding(buildingId);
  const room = getRoom(buildingId, roomId);
  const allowedWeekKeys = listAllowedWeekMondayKeys();
  const hasAvailableWeeks = allowedWeekKeys.length > 0;
  const bookableDateOptions = listAllBookableDateOptions();

  const [scheduleWeekStart, setScheduleWeekStart] = useState(
    () => allowedWeekKeys[0] ?? '',
  );
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const scheduleQuery = useQuery({
    queryKey: ['room-bookings', 'room-schedule', roomId, scheduleWeekStart],
    queryFn: () => roomBookingsApi.getRoomSchedule(roomId, scheduleWeekStart),
    enabled: Boolean(roomId) && Boolean(scheduleWeekStart) && hasAvailableWeeks,
  });

  const schedule = !hasAvailableWeeks
    ? []
    : scheduleQuery.data?.days?.length
      ? scheduleQuery.data.days
      : shiftMockScheduleToWeek(getRoomSchedule(roomId), scheduleWeekStart);
  const [selectedDayKey, setSelectedDayKey] = useState<RoomScheduleDay['dayKey']>('mon');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [mode, setMode] = useState<'schedule' | 'booking'>('schedule');
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [attendeeCount, setAttendeeCount] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [adminSlot, setAdminSlot] = useState<RoomScheduleSlot | null>(null);
  const [adminOverrideTitle, setAdminOverrideTitle] = useState('');
  const [adminOverridePurpose, setAdminOverridePurpose] = useState('');
  const [adminOverrideAttendeeCount, setAdminOverrideAttendeeCount] = useState('');
  const [adminOverrideContactPhone, setAdminOverrideContactPhone] = useState('');
  const [adminOverrideError, setAdminOverrideError] = useState('');

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

  const refreshRoomSchedule = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['room-bookings', 'room-schedule', roomId],
    });
  };

  const resetAdminOverrideForm = () => {
    setAdminOverrideTitle('');
    setAdminOverridePurpose('');
    setAdminOverrideAttendeeCount('');
    setAdminOverrideContactPhone('');
    setAdminOverrideError('');
  };

  const closeAdminSlotModal = () => {
    setAdminSlot(null);
    resetAdminOverrideForm();
  };

  const cancelBookingMutation = useMutation({
    mutationFn: roomBookingsApi.cancelBooking,
    onSuccess: async () => {
      closeAdminSlotModal();
      await refreshRoomSchedule();
    },
  });

  const createOverrideMutation = useMutation({
    mutationFn: roomBookingsApi.createScheduleOverride,
    onSuccess: async () => {
      closeAdminSlotModal();
      await refreshRoomSchedule();
    },
    onError: (error) => {
      setAdminOverrideError(getErrorMessage(error));
    },
  });

  const deleteOverrideMutation = useMutation({
    mutationFn: roomBookingsApi.deleteScheduleOverride,
    onSuccess: async () => {
      closeAdminSlotModal();
      await refreshRoomSchedule();
    },
  });

  const cancelClassMutation = useMutation({
    mutationFn: ({ classMeetingId, overrideDate }: { classMeetingId: string; overrideDate: string }) =>
      roomBookingsApi.cancelClassMeetingOccurrence(classMeetingId, {
        overrideDate,
        note: 'Admin huy buoi hoc',
      }),
    onSuccess: async () => {
      closeAdminSlotModal();
      await refreshRoomSchedule();
    },
  });

  const selectedDay =
    schedule.find((item) => item.dayKey === selectedDayKey) ?? schedule[0] ?? null;

  const openAdminSlotModal = (slot: RoomScheduleSlot) => {
    setAdminSlot(slot);
    setAdminOverrideTitle(slot.status === 'free' ? '' : slot.title ?? '');
    setAdminOverridePurpose('');
    setAdminOverrideAttendeeCount('');
    setAdminOverrideContactPhone('');
    setAdminOverrideError('');
  };

  const handleSubmitAdminOverride = () => {
    if (!room) {
      setAdminOverrideError('Không xác định được phòng tạo lịch.');
      return;
    }

    if (!selectedDay || !adminSlot || !selectedDay.dateKey) {
      setAdminOverrideError('Không xác định được ngày tạo lịch.');
      return;
    }

    const normalizedTitle = adminOverrideTitle.trim();
    const normalizedPurpose = adminOverridePurpose.trim();
    const normalizedAttendeeCount = adminOverrideAttendeeCount.trim();
    const normalizedContactPhone = adminOverrideContactPhone.trim();
    const attendeeNumber = Number.parseInt(normalizedAttendeeCount, 10);

    if (!normalizedTitle) {
      setAdminOverrideError('Vui lòng nhập tên lịch.');
      return;
    }

    if (!normalizedPurpose) {
      setAdminOverrideError('Vui lòng nhập mục đích sử dụng phòng.');
      return;
    }

    if (!Number.isInteger(attendeeNumber) || attendeeNumber < 1) {
      setAdminOverrideError('Số người phải lớn hơn 0.');
      return;
    }

    setAdminOverrideError('');
    createOverrideMutation.mutate({
      roomCode: room.code,
      overrideDate: selectedDay.dateKey,
      timeSlotId: adminSlot.id,
      type: 'manual',
      title: normalizedTitle,
      note: buildAdminOverrideNote({
        purpose: normalizedPurpose,
        attendeeCount: String(attendeeNumber),
        contactPhone: normalizedContactPhone,
      }),
    });
  };

  useEffect(() => {
    if (!hasAvailableWeeks) {
      setScheduleWeekStart('');
      setSelectedDayKey('mon');
      setSelectedSlotId('');
      setDatePickerOpen(false);
      return;
    }

    setScheduleWeekStart((current) => (allowedWeekKeys.includes(current) ? current : allowedWeekKeys[0]));
  }, [allowedWeekKeys, hasAvailableWeeks]);

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

    const firstBookableSlot = selectedDay.slots.find((slot) => slot.status === 'free');
    setSelectedSlotId((current) => {
      if (
        current &&
        selectedDay.slots.some((slot) => slot.id === current && slot.status === 'free')
      ) {
        return current;
      }

      return firstBookableSlot?.id ?? '';
    });
  }, [selectedDay]);

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
    selectedDay?.slots.some((slot) => slot.status === 'free') &&
      selectedSlot &&
      selectedSlot.status === 'free',
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
      timeSlotIds: [selectedSlot.id],
      purpose: normalizedPurpose,
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
            description="Vui lòng thử lại khi máy chủ sẵn sàng."
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

            <Text
              style={[
                styles.weekPickerHint,
                { color: theme.colors.textMuted, fontFamily: theme.fonts.medium },
              ]}
            >
              Chỉ đặt phòng từ tuần kế tiếp.
            </Text>

            {hasAvailableWeeks ? (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.weekChipRow}
                >
                  {allowedWeekKeys.map((weekKey) => {
                    const selected = weekKey === scheduleWeekStart;
                    return (
                      <Pressable
                        key={weekKey}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => {
                          setScheduleWeekStart(weekKey);
                          setSelectedDayKey('mon');
                          setSubmitted(false);
                        }}
                        style={({ pressed }) => [
                          styles.weekChip,
                          {
                            backgroundColor: selected
                              ? theme.colors.primarySurface
                              : theme.colors.surfaceSubtle,
                            borderColor: selected ? theme.colors.primary : theme.colors.border,
                            opacity: pressed ? 0.86 : 1,
                          },
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.weekChipLabel,
                            {
                              color: selected ? theme.colors.primary : theme.colors.textMuted,
                              fontFamily: selected ? theme.fonts.semibold : theme.fonts.medium,
                            },
                          ]}
                        >
                          {formatWeekRangeLabel(weekKey)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dayTabs}
                >
                  {schedule.map((day) => {
                    const isSelected = selectedDayKey === day.dayKey;
                    return (
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
                            backgroundColor: isSelected
                              ? theme.colors.primarySurface
                              : theme.colors.surfaceSubtle,
                            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                            opacity: pressed ? 0.84 : 1,
                          },
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.dayTabLabel,
                            {
                              color: isSelected ? theme.colors.primary : theme.colors.textMuted,
                              fontFamily: isSelected ? theme.fonts.semibold : theme.fonts.medium,
                            },
                          ]}
                        >
                          {day.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

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
                      admin={isAdmin}
                      onPress={() => {
                        if (isAdmin) {
                          openAdminSlotModal(slot);
                          return;
                        }

                        if (slot.status !== 'free') {
                          return;
                        }

                        setSelectedSlotId(slot.id);
                        setSubmitted(false);
                      }}
                    />
                  ))}
                </View>
              </>
            ) : (
              <View
                style={[
                  styles.notice,
                  {
                    backgroundColor: theme.colors.infoSurface,
                    borderColor: theme.colors.info,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.noticeText,
                    { color: theme.colors.info, fontFamily: theme.fonts.semibold },
                  ]}
                >
                  Hiện không có tuần đặt phòng khả dụng.
                </Text>
              </View>
            )}

            <PrimaryButton
              label="Đặt phòng"
              disabled={!canBook || isAdmin}
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Chọn ngày đặt phòng"
                onPress={() => setDatePickerOpen(true)}
                style={({ pressed }) => [
                  styles.metaRowTouchable,
                  {
                    backgroundColor: theme.colors.surfaceSubtle,
                    borderColor: theme.colors.border,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.metaLabel,
                    { color: theme.colors.textSoft, fontFamily: theme.fonts.medium },
                  ]}
                >
                  Ngày:
                </Text>
                <Text
                  style={[
                    styles.metaValue,
                    { color: theme.colors.text, fontFamily: theme.fonts.semibold },
                  ]}
                >
                  {selectedDate}
                </Text>
                <Ionicons name="chevron-down" size={18} color={theme.colors.textSoft} />
              </Pressable>
              <MetaRow label="Giờ:" value={`${selectedSlot.startTime} - ${selectedSlot.endTime}`} />
            </View>

            <Modal
              visible={datePickerOpen}
              transparent
              animationType="fade"
              onRequestClose={() => setDatePickerOpen(false)}
            >
              <View style={styles.modalContainer}>
                <Pressable
                  accessibilityRole="button"
                  style={StyleSheet.absoluteFill}
                  onPress={() => setDatePickerOpen(false)}
                />
                <View
                  style={[
                    styles.modalSheet,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: theme.colors.text, fontFamily: theme.fonts.bold },
                    ]}
                  >
                    Chọn ngày
                  </Text>
                  <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
                    {bookableDateOptions.map((opt) => {
                      const active = opt.dateKey === selectedDay?.dateKey;
                      return (
                        <Pressable
                          key={opt.dateKey}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          onPress={() => {
                            setScheduleWeekStart(getMondayKeyForDateKey(opt.dateKey));
                            setSelectedDayKey(opt.dayKey);
                            setDatePickerOpen(false);
                            setSubmitted(false);
                          }}
                          style={({ pressed }) => [
                            styles.modalOption,
                            {
                              backgroundColor: active
                                ? theme.colors.primarySurface
                                : theme.colors.surfaceSubtle,
                              borderColor: active ? theme.colors.primary : theme.colors.border,
                              opacity: pressed ? 0.9 : 1,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.modalOptionText,
                              {
                                color: active ? theme.colors.primary : theme.colors.text,
                                fontFamily: active ? theme.fonts.semibold : theme.fonts.medium,
                              },
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            </Modal>

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
              label="Gửi yêu cầu"
              loading={createBookingMutation.isPending}
              disabled={submitted || createBookingMutation.isPending}
              onPress={handleSubmitBooking}
            />
            <SecondaryButton
              label="Quay lại lịch phòng"
              disabled={createBookingMutation.isPending}
              onPress={() => setMode('schedule')}
            />
          </View>
        ) : null}

        <Modal
          visible={Boolean(adminSlot)}
          transparent
          animationType="fade"
          onRequestClose={closeAdminSlotModal}
        >
          <View style={styles.modalContainer}>
            <Pressable
              accessibilityRole="button"
              style={StyleSheet.absoluteFill}
              onPress={closeAdminSlotModal}
            />
            <View
              style={[
                styles.modalSheet,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {adminSlot && selectedDay ? (
                <>
                  <Text style={[styles.modalTitle, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
                    Quản lý khung giờ phòng
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: theme.colors.textMuted, fontFamily: theme.fonts.medium }]}>
                    {room.code} · {toDisplayDate(selectedDay.dateKey)} · {adminSlot.startTime} - {adminSlot.endTime}
                  </Text>
                  <Text style={[styles.noticeText, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
                    {adminSlot.title ?? adminSlot.label}
                  </Text>

                  {adminSlot.source !== 'booking' && adminSlot.source !== 'override' ? (
                    <View style={styles.formSection}>
                      <FormField
                        label="Tên lịch"
                        value={adminOverrideTitle}
                        onChangeText={setAdminOverrideTitle}
                      />
                      <FormField
                        label="Mục đích"
                        value={adminOverridePurpose}
                        onChangeText={setAdminOverridePurpose}
                      />
                      <FormField
                        label="Số người"
                        value={adminOverrideAttendeeCount}
                        onChangeText={setAdminOverrideAttendeeCount}
                        keyboardType="number-pad"
                      />
                      <FormField
                        label="Số điện thoại"
                        value={adminOverrideContactPhone}
                        onChangeText={setAdminOverrideContactPhone}
                        keyboardType="phone-pad"
                      />
                    </View>
                  ) : null}

                  {adminOverrideError ? (
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
                        {adminOverrideError}
                      </Text>
                    </View>
                  ) : null}

                  {adminSlot.source !== 'booking' && adminSlot.source !== 'override' ? (
                    <PrimaryButton
                      label={createOverrideMutation.isPending ? 'Đang tạo...' : 'Tạo lịch sử dụng phòng'}
                      loading={createOverrideMutation.isPending}
                      onPress={handleSubmitAdminOverride}
                    />
                  ) : null}

                  {adminSlot.source === 'booking' && adminSlot.bookingId ? (
                    <SecondaryButton
                      label={cancelBookingMutation.isPending ? 'Đang hủy...' : 'Hủy đặt phòng'}
                      disabled={cancelBookingMutation.isPending}
                      onPress={() => cancelBookingMutation.mutate(adminSlot.bookingId as string)}
                    />
                  ) : null}

                  {adminSlot.source === 'semester' && adminSlot.classMeetingId ? (
                    <SecondaryButton
                      label={cancelClassMutation.isPending ? 'Đang hủy...' : 'Hủy buổi học này'}
                      disabled={cancelClassMutation.isPending}
                      onPress={() =>
                        cancelClassMutation.mutate({
                          classMeetingId: adminSlot.classMeetingId as string,
                          overrideDate: selectedDay.dateKey ?? '',
                        })
                      }
                    />
                  ) : null}

                  {adminSlot.source === 'override' && adminSlot.overrideId ? (
                    <SecondaryButton
                      label={deleteOverrideMutation.isPending ? 'Đang xóa...' : 'Xóa lịch admin'}
                      disabled={deleteOverrideMutation.isPending}
                      onPress={() => deleteOverrideMutation.mutate(adminSlot.overrideId as string)}
                    />
                  ) : null}
                </>
              ) : null}
            </View>
          </View>
        </Modal>
      </ContentStack>
    </Screen>
  );
}

function ScheduleRow({
  slot,
  selected,
  admin,
  onPress,
}: {
  slot: RoomScheduleSlot;
  selected: boolean;
  admin?: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const statusColor =
    slot.status === 'free'
      ? theme.colors.success
      : slot.status === 'occupied'
        ? slot.source === 'semester'
          ? theme.colors.text
          : theme.colors.primary
        : theme.colors.info;
  const slotText =
    slot.status === 'free'
      ? slot.label
      : slot.title ??
        slot.courseCode ??
        (slot.source === 'semester' ? 'Lịch cố định' : 'Đã đặt');
  const disabled = !admin && slot.status !== 'free';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.slotRow,
        {
          backgroundColor: selected ? theme.colors.primarySurface : theme.colors.surfaceSubtle,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          opacity: disabled ? 1 : pressed ? 0.84 : 1,
        },
      ]}
    >
      <Text style={[styles.slotTime, { color: theme.colors.text, fontFamily: theme.fonts.medium }]}>
        {slot.startTime} - {slot.endTime}
      </Text>
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[styles.slotLabel, { color: statusColor, fontFamily: theme.fonts.semibold }]}
      >
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
  weekPickerHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  weekChipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
    paddingRight: 12,
  },
  weekChip: {
    minWidth: 116,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  weekChipLabel: {
    fontSize: 13,
  },
  dayTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
    paddingRight: 12,
  },
  dayTab: {
    minWidth: 56,
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
    flexShrink: 1,
    maxWidth: '42%',
    textAlign: 'right',
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
  metaRowTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metaLabel: {
    width: 56,
    fontSize: 14,
  },
  metaValue: {
    flex: 1,
    fontSize: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: '72%',
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 4,
  },
  modalList: {
    marginTop: 4,
  },
  modalOption: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  modalOptionText: {
    fontSize: 15,
  },
  formSection: {
    gap: 8,
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
