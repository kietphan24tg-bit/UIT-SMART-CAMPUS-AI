import {
  BUILDING_AVAILABILITY,
  getRoomSchedule as getStaticRoomSchedule,
  ROOM_SUMMARIES,
} from '@/constants/room-booking-data';
import type {
  BuildingAvailability,
  RoomAvailabilitySummary,
  RoomScheduleDay,
  RoomSlotStatus,
} from '@/types/room-booking';

import { apiClient } from './client';

type RoomBookingAvailabilityApiItem = {
  roomCode: string;
  capacity: number;
  status: 'Trống hiện tại' | 'Đang được sử dụng';
};

type ListBuildingRoomsParams = {
  floorNumber?: number;
  minCapacity?: number;
};

type RoomScheduleApiSlot = {
  timeSlotId: string;
  slotNumber: number;
  label: string;
  startTime: string;
  endTime: string;
  bookingTitle: string | null;
  displayText: string;
};

type RoomScheduleApiDay = {
  dayOfWeek: number;
  label: string;
  slots: RoomScheduleApiSlot[];
};

type RoomScheduleApiResponse = {
  roomCode: string;
  capacity: number;
  name: string | null;
  days: RoomScheduleApiDay[];
};

export type CreateRoomBookingRequest = {
  roomCode: string;
  bookingDate: string;
  timeSlotId: string;
  purpose: string;
  contactName: string;
  title?: string;
  attendeeCount?: number;
  contactPhone?: string;
  departmentName?: string;
};

export type RoomBookingResponse = {
  id: string;
  roomCode: string;
  bookingDate: string;
  timeSlotId: string;
  title: string | null;
  purpose: string;
  attendeeCount: number | null;
  contactName: string;
  contactPhone: string | null;
  departmentName: string | null;
  status: string;
  createdAt: string;
};

const DAY_KEY_BY_API_DAY: Record<number, RoomScheduleDay['dayKey']> = {
  2: 'mon',
  3: 'tue',
  4: 'wed',
  5: 'thu',
  6: 'fri',
  7: 'sat',
};

const API_DAY_NUMBER_BY_DAY_KEY: Record<RoomScheduleDay['dayKey'], number> = {
  mon: 2,
  tue: 3,
  wed: 4,
  thu: 5,
  fri: 6,
  sat: 7,
};

function shouldUseMockRoomBookings() {
  return process.env.EXPO_PUBLIC_USE_MOCK_ROOM_BOOKINGS === '1';
}

function getStaticRoomsForBuilding(buildingId: string) {
  return ROOM_SUMMARIES.filter((item) => item.buildingId === buildingId.toUpperCase());
}

function getStaticRoomByCode(roomCode: string) {
  return ROOM_SUMMARIES.find((item) => item.code === roomCode.toUpperCase()) ?? null;
}

function applyRoomFilters(rooms: RoomAvailabilitySummary[], filters: ListBuildingRoomsParams = {}) {
  return rooms.filter((room) => {
    const matchesFloor = !filters.floorNumber || room.floor === filters.floorNumber;
    const matchesCapacity = !filters.minCapacity || room.capacity >= filters.minCapacity;
    return matchesFloor && matchesCapacity;
  });
}

function mapApiStatus(status: RoomBookingAvailabilityApiItem['status']): {
  status: RoomSlotStatus;
  statusLabel: string;
} {
  if (status === 'Đang được sử dụng') {
    return {
      status: 'occupied',
      statusLabel: status,
    };
  }

  return {
    status: 'free',
    statusLabel: status,
  };
}

function parseFloorFromRoomCode(buildingId: string, roomCode: string) {
  const normalizedBuildingId = buildingId.toUpperCase();
  const normalizedRoomCode = roomCode.toUpperCase().trim();

  const dottedMatch = normalizedRoomCode.match(new RegExp(`^${normalizedBuildingId}(\\d{1,2})\\.`));
  if (dottedMatch?.[1]) {
    return Number.parseInt(dottedMatch[1], 10);
  }

  const compactMatch = normalizedRoomCode.match(
    new RegExp(`^${normalizedBuildingId}(\\d)(\\d{2})$`),
  );
  if (compactMatch?.[1]) {
    return Number.parseInt(compactMatch[1], 10);
  }

  return 0;
}

function mapApiRoomToSummary(
  buildingId: string,
  room: RoomBookingAvailabilityApiItem,
): RoomAvailabilitySummary {
  const statusState = mapApiStatus(room.status);

  return {
    id: room.roomCode,
    buildingId: buildingId.toUpperCase(),
    code: room.roomCode,
    floor: parseFloorFromRoomCode(buildingId, room.roomCode),
    capacity: room.capacity,
    status: statusState.status,
    statusLabel: statusState.statusLabel,
    equipment: [],
  };
}

function mapApiScheduleSlotStatus(slot: RoomScheduleApiSlot): RoomSlotStatus {
  if (!slot.bookingTitle && slot.displayText !== 'Trống') {
    return 'available_later';
  }

  return slot.bookingTitle ? 'occupied' : 'free';
}

function mapApiScheduleDay(day: RoomScheduleApiDay): RoomScheduleDay | null {
  const dayKey = DAY_KEY_BY_API_DAY[day.dayOfWeek];
  if (!dayKey) {
    return null;
  }

  return {
    dayKey,
    label: `Th${day.dayOfWeek}`,
    slots: day.slots.map((slot) => ({
      id: slot.timeSlotId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: mapApiScheduleSlotStatus(slot),
      label: slot.label,
      courseCode:
        slot.bookingTitle ?? (slot.displayText !== 'Trá»‘ng' ? slot.displayText : undefined),
    })),
  };
}

function buildSubtitle(availableRooms: number) {
  return `${availableRooms} phòng trống`;
}

function buildMockRoomScheduleApiResponse(roomCode: string): RoomScheduleApiResponse {
  const normalizedRoomCode = roomCode.toUpperCase();
  const room = getStaticRoomByCode(normalizedRoomCode);
  const days = getStaticRoomSchedule(normalizedRoomCode);

  return {
    roomCode: normalizedRoomCode,
    capacity: room?.capacity ?? 0,
    name: null,
    days: days.map((day) => {
      const dayOfWeek = API_DAY_NUMBER_BY_DAY_KEY[day.dayKey];

      return {
        dayOfWeek,
        label: `Thứ ${dayOfWeek}`,
        slots: day.slots.map((slot, index) => ({
          timeSlotId: slot.id,
          slotNumber: index + 1,
          label: `Tiết ${index + 1}`,
          startTime: slot.startTime,
          endTime: slot.endTime,
          bookingTitle: slot.status === 'occupied' ? (slot.courseCode ?? slot.label) : null,
          displayText: slot.label,
        })),
      };
    }),
  };
}

async function getBuildingRoomsFromApi(buildingId: string, filters: ListBuildingRoomsParams = {}) {
  const items = (await apiClient.get(
    `/room-bookings/buildings/${encodeURIComponent(buildingId.toUpperCase())}/rooms`,
    {
      params: {
        ...(filters.floorNumber ? { floorNumber: filters.floorNumber } : {}),
        ...(filters.minCapacity ? { minCapacity: filters.minCapacity } : {}),
      },
    },
  )) as RoomBookingAvailabilityApiItem[];

  return items.map((item) => mapApiRoomToSummary(buildingId, item));
}

function mapScheduleResponseToDays(response: RoomScheduleApiResponse) {
  return response.days
    .map((day) => mapApiScheduleDay(day))
    .filter((day): day is RoomScheduleDay => Boolean(day));
}

export const roomBookingsApi = {
  listBuildings: async (): Promise<BuildingAvailability[]> => {
    if (shouldUseMockRoomBookings()) {
      return BUILDING_AVAILABILITY;
    }

    const items = await Promise.all(
      BUILDING_AVAILABILITY.map(async (building) => {
        try {
          const rooms = await getBuildingRoomsFromApi(building.id);
          const availableRooms = rooms.filter((room) => room.status === 'free').length;

          return {
            ...building,
            availableRooms,
            totalRooms: rooms.length,
            subtitle: buildSubtitle(availableRooms),
          };
        } catch {
          return building;
        }
      }),
    );

    return items;
  },

  listBuildingRooms: async (
    buildingId: string,
    filters: ListBuildingRoomsParams = {},
  ): Promise<RoomAvailabilitySummary[]> => {
    const mockRooms = applyRoomFilters(getStaticRoomsForBuilding(buildingId), filters);

    if (shouldUseMockRoomBookings()) {
      return mockRooms;
    }

    try {
      return await getBuildingRoomsFromApi(buildingId, filters);
    } catch {
      return mockRooms;
    }
  },

  listAllBuildingRooms: async (): Promise<Record<string, RoomAvailabilitySummary[]>> => {
    const mockCatalog = Object.fromEntries(
      BUILDING_AVAILABILITY.map((building) => [
        building.id,
        getStaticRoomsForBuilding(building.id),
      ]),
    ) as Record<string, RoomAvailabilitySummary[]>;

    if (shouldUseMockRoomBookings()) {
      return mockCatalog;
    }

    try {
      const entries = await Promise.all(
        BUILDING_AVAILABILITY.map(
          async (building) => [building.id, await getBuildingRoomsFromApi(building.id)] as const,
        ),
      );

      return Object.fromEntries(entries);
    } catch {
      return mockCatalog;
    }
  },

  getRoomSchedule: async (roomCode: string): Promise<RoomScheduleDay[]> => {
    const normalizedRoomCode = roomCode.toUpperCase();
    const mockResponse = buildMockRoomScheduleApiResponse(normalizedRoomCode);

    if (shouldUseMockRoomBookings()) {
      return mapScheduleResponseToDays(mockResponse);
    }

    try {
      const response = (await apiClient.get(
        `/room-bookings/rooms/${encodeURIComponent(normalizedRoomCode)}/schedule`,
      )) as RoomScheduleApiResponse;

      return mapScheduleResponseToDays(response);
    } catch {
      return mapScheduleResponseToDays(mockResponse);
    }
  },

  createRoomBooking: async (data: CreateRoomBookingRequest): Promise<RoomBookingResponse> => {
    return apiClient.post('/room-bookings', data) as Promise<RoomBookingResponse>;
  },
};
