import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContentStack, EmptyState, Screen } from '@/components/ui';
import {
  getBuilding,
  getRoomsForBuilding,
  setRuntimeRoomsForBuilding,
} from '@/constants/room-booking-data';
import { roomBookingsApi } from '@/services/api/room-bookings';
import type { RoomAvailabilitySummary } from '@/types/room-booking';
import { useAppTheme } from '@/theme';

const CAPACITY_OPTIONS = [
  'Tất cả',
  '30',
  '40',
  '50',
  '60',
  '70',
  '80',
  '90',
  '100',
  '110',
  '120',
  '130',
  '140',
  '150',
  '160',
  '170',
  '180',
] as const;

type DropdownType = 'floor' | 'capacity' | null;

export default function RoomsInBuildingScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ building?: string }>();
  const buildingId = typeof params.building === 'string' ? params.building.toUpperCase() : '';
  const building = getBuilding(buildingId);

  const roomsQuery = useQuery({
    queryKey: ['room-bookings', 'building', buildingId],
    queryFn: () => roomBookingsApi.listBuildingRooms(buildingId),
    enabled: Boolean(buildingId),
    initialData: getRoomsForBuilding(buildingId),
  });

  const rooms = roomsQuery.data ?? [];
  const floorOptions = useMemo(
    () => ['Tất cả', ...Array.from(new Set(rooms.map((room) => String(room.floor)))).sort((left, right) => Number(left) - Number(right))],
    [rooms],
  );
  const [selectedFloor, setSelectedFloor] = useState('Tất cả');
  const [selectedCapacity, setSelectedCapacity] = useState<(typeof CAPACITY_OPTIONS)[number]>('Tất cả');
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);

  useEffect(() => {
    if (buildingId && roomsQuery.data) {
      setRuntimeRoomsForBuilding(buildingId, roomsQuery.data);
    }
  }, [buildingId, roomsQuery.data]);

  useEffect(() => {
    if (!floorOptions.includes(selectedFloor)) {
      setSelectedFloor('Tất cả');
    }
  }, [floorOptions, selectedFloor]);

  const minCapacity = selectedCapacity === 'Tất cả' ? undefined : Number(selectedCapacity);

  const filteredRooms = rooms.filter((room) => {
    const matchesFloor = selectedFloor === 'Tất cả' || String(room.floor) === selectedFloor;
    const matchesCapacity = minCapacity == null || room.capacity >= minCapacity;
    return matchesFloor && matchesCapacity;
  });

  if (!building) {
    return (
      <Screen>
        <ContentStack>
          <EmptyState
            title="Không tìm thấy tòa nhà"
            description="Dữ liệu mock không có khu vực này."
            actionLabel="Quay lại đặt phòng"
            onActionPress={() => router.replace('/services/room-booking')}
          />
        </ContentStack>
      </Screen>
    );
  }

  return (
    <Screen>
      <ContentStack gap={16} overlapHero={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại danh sách tòa nhà"
          onPress={() => router.back()}
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
          <Text style={[styles.backLabel, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
            Đặt phòng
          </Text>
        </Pressable>

        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
            },
            openDropdown ? styles.headerCardRaised : null,
            theme.elevation.level1 as never,
          ]}
        >
          <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
            {building.name}
          </Text>

          <View style={styles.filterBlock}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}>
              Filter
            </Text>
            <View style={styles.filterRow}>
              <InlineDropdown
                label="Tầng"
                value={selectedFloor}
                options={floorOptions}
                open={openDropdown === 'floor'}
                onToggle={() => setOpenDropdown((current) => (current === 'floor' ? null : 'floor'))}
                onSelect={(value) => {
                  setSelectedFloor(value);
                  setOpenDropdown(null);
                }}
              />
              <InlineDropdown
                label="Sức chứa"
                value={selectedCapacity}
                options={CAPACITY_OPTIONS as unknown as string[]}
                open={openDropdown === 'capacity'}
                onToggle={() => setOpenDropdown((current) => (current === 'capacity' ? null : 'capacity'))}
                onSelect={(value) => {
                  setSelectedCapacity(value as (typeof CAPACITY_OPTIONS)[number]);
                  setOpenDropdown(null);
                }}
              />
            </View>
          </View>
        </View>

        <View style={styles.roomsSection}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}>
            Danh sách phòng
          </Text>

          <View style={styles.roomList}>
            {filteredRooms.map((room) => (
              <Pressable
                key={room.id}
                accessibilityRole="button"
                onPress={() => router.push(`/services/room-booking/${building.id}/${room.id}` as never)}
                style={({ pressed }) => [
                  styles.roomCard,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                    opacity: pressed ? 0.86 : 1,
                  },
                  theme.elevation.level1 as never,
                ]}
              >
                <Text style={[styles.roomCode, { color: theme.colors.text, fontFamily: theme.fonts.bold }]}>
                  [{room.code}]
                </Text>
                <Text style={[styles.roomInfo, { color: theme.colors.textMuted, fontFamily: theme.fonts.medium }]}>
                  {getRoomDescriptor(room)}
                </Text>
                <Text
                  style={[
                    styles.roomStatus,
                    {
                      color: getRoomStatusColor(theme, room.status),
                      fontFamily: theme.fonts.semibold,
                    },
                  ]}
                >
                  {room.statusLabel}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>


      </ContentStack>
    </Screen>
  );
}

function InlineDropdown({
  label,
  value,
  options,
  open,
  onToggle,
  onSelect,
}: {
  label: string;
  value: string;
  options: string[];
  open: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.dropdownWrap}>
      <Pressable
        accessibilityRole="button"
        onPress={onToggle}
        style={({ pressed }) => [
          styles.selector,
          {
            backgroundColor: theme.colors.surfaceSubtle,
            borderColor: theme.colors.border,
            opacity: pressed ? 0.84 : 1,
          },
        ]}
      >
        <View style={styles.selectorTextWrap}>
          <Text style={[styles.selectorHint, { color: theme.colors.textSoft, fontFamily: theme.fonts.medium }]}>
            {label}
          </Text>
          <Text style={[styles.selectorLabel, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
            {value}
          </Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={theme.colors.textSoft} />
      </Pressable>

      {open ? (
        <View
          style={[
            styles.dropdownPanel,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
            },
            theme.elevation.level1 as never,
          ]}
        >
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={styles.dropdownScroll}>
            {options.map((option) => {
              const selected = option === value;

              return (
                <Pressable
                  key={`${label}-${option}`}
                  accessibilityRole="button"
                  onPress={() => onSelect(option)}
                  style={({ pressed }) => [
                    styles.dropdownOption,
                    {
                      backgroundColor: selected ? theme.colors.primarySurface : theme.colors.surfaceElevated,
                      borderColor: selected ? theme.colors.primary : theme.colors.border,
                      opacity: pressed ? 0.84 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dropdownOptionLabel,
                      {
                        color: selected ? theme.colors.primary : theme.colors.text,
                        fontFamily: selected ? theme.fonts.semibold : theme.fonts.medium,
                      },
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function getRoomDescriptor(room: RoomAvailabilitySummary) {
  if (room.code === 'C201') {
    return 'Lab máy tính';
  }

  return `${room.capacity} chỗ`;
}

function getRoomStatusColor(theme: ReturnType<typeof useAppTheme>, status: RoomAvailabilitySummary['status']) {
  if (status === 'free') {
    return theme.colors.success;
  }

  if (status === 'occupied') {
    return theme.colors.warning;
  }

  return theme.colors.info;
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
  headerCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 18,
    overflow: 'visible',
  },
  headerCardRaised: {
    zIndex: 30,
    elevation: 30,
  },
  title: {
    fontSize: 28,
  },
  filterBlock: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  dropdownWrap: {
    flex: 1,
    position: 'relative',
  },
  selector: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorTextWrap: {
    gap: 2,
  },
  selectorHint: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  selectorLabel: {
    fontSize: 14,
  },
  dropdownPanel: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    zIndex: 40,
    elevation: 40,
    borderWidth: 1,
    borderRadius: 16,
    padding: 8,
  },
  dropdownScroll: {
    maxHeight: 220,
  },
  dropdownOption: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginBottom: 8,
  },
  dropdownOptionLabel: {
    fontSize: 14,
  },
  roomsSection: {
    gap: 12,
  },
  roomList: {
    gap: 12,
  },
  roomCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
  roomCode: {
    fontSize: 18,
  },
  roomInfo: {
    fontSize: 15,
    lineHeight: 20,
  },
  roomStatus: {
    fontSize: 14,
    lineHeight: 20,
  },
});

