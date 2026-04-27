import type {
  BuildingAvailability,
  RoomAvailabilitySummary,
  RoomSchedule,
  RoomScheduleDay,
  RoomSlotStatus,
} from '@/types/room-booking';

import { apiClient } from './client';

type RoomBookingAvailabilityApiItem = {
  roomCode: string;
  capacity: number;
  status: string;
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
  status: RoomSlotStatus;
  source: 'semester' | 'booking' | null;
  title: string | null;
  subtitle: string | null;
  bookingId: string | null;
  classSectionId: string | null;
  bookable: boolean;
};

type RoomScheduleApiDay = {
  dayOfWeek: number;
  dateKey: string;
  label: string;
  slots: RoomScheduleApiSlot[];
};

type RoomScheduleApiResponse = {
  roomCode: string;
  capacity: number;
  name: string | null;
  buildingCode?: string;
  buildingName?: string;
  weekStart?: string;
  days: RoomScheduleApiDay[];
};

type BuildingSummaryApiItem = {
  id: string;
  name: string;
  availableRooms: number;
  totalRooms: number;
  subtitle: string;
};

export type CreateRoomBookingRequest = {
  roomCode: string;
  bookingDate: string;
  timeSlotIds: string[];
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
  roomName: string | null;
  buildingCode: string;
  buildingName: string;
  bookingDate: string;
  timeSlotIds: string[];
  slotCount: number;
  startTime: string | null;
  endTime: string | null;
  timeSlots: Array<{
    id: string;
    slotNumber: number;
    label: string;
    startTime: string;
    endTime: string;
  }>;
  title: string | null;
  purpose: string;
  attendeeCount: number | null;
  contactName: string | null;
  contactPhone: string | null;
  departmentName: string | null;
  notes: string | null;
  status: 'pending' | 'approved' | 'booked' | 'maintenance' | 'rejected' | 'cancelled';
  approvedAt: string | null;
  createdAt: string;
};

function shouldUseMockRoomBookings() {
  return process.env.EXPO_PUBLIC_USE_MOCK_ROOM_BOOKINGS === '1';
}

function assertLiveModeOnly() {
  if (shouldUseMockRoomBookings()) {
    throw new Error('Mock room-bookings mode is disabled for this demo build');
  }
}

const DAY_KEY_BY_API_DAY: Record<number, RoomScheduleDay['dayKey']> = {
  2: 'mon',
  3: 'tue',
  4: 'wed',
  5: 'thu',
  6: 'fri',
  7: 'sat',
};

function normalizeStatusText(input: string) {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function mapApiStatus(status: string): {
  status: RoomSlotStatus;
  statusLabel: string;
} {
  const normalizedStatus = normalizeStatusText(status);
  if (normalizedStatus.includes('dang') || normalizedStatus.includes('occupied')) {
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
    name: null,
    floor: parseFloorFromRoomCode(buildingId, room.roomCode),
    capacity: room.capacity,
    status: statusState.status,
    statusLabel: statusState.statusLabel,
    equipment: [],
  };
}

function mapApiScheduleDay(day: RoomScheduleApiDay): RoomScheduleDay | null {
  const dayKey = DAY_KEY_BY_API_DAY[day.dayOfWeek];
  if (!dayKey) {
    return null;
  }

  return {
    dayKey,
    dateKey: day.dateKey,
    label: `Th${day.dayOfWeek}`,
    slots: day.slots.map((slot) => ({
      id: slot.timeSlotId,
      slotNumber: slot.slotNumber,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status,
      label: slot.label,
      source: slot.source,
      title: slot.title,
      subtitle: slot.subtitle,
      bookingId: slot.bookingId,
      classSectionId: slot.classSectionId,
      bookable: slot.bookable,
    })),
  };
}

function mapScheduleResponse(response: RoomScheduleApiResponse): RoomSchedule {
  return {
    roomCode: response.roomCode,
    roomName: response.name,
    buildingCode: response.buildingCode ?? response.roomCode.charAt(0).toUpperCase(),
    buildingName: response.buildingName ?? `Tòa ${response.roomCode.charAt(0).toUpperCase()}`,
    capacity: response.capacity,
    weekStart: response.weekStart ?? response.days[0]?.dateKey,
    days: response.days
      .map((day) => mapApiScheduleDay(day))
      .filter((day): day is RoomScheduleDay => Boolean(day)),
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

function mapBuildingSummary(item: BuildingSummaryApiItem): BuildingAvailability {
  return {
    id: item.id,
    code: item.id,
    name: item.name,
    searchText: `${item.id} ${item.name}`,
    availableRooms: item.availableRooms,
    totalRooms: item.totalRooms,
    subtitle: item.subtitle,
  };
}

export const roomBookingsApi = {
  listBuildings: async (): Promise<BuildingAvailability[]> => {
    assertLiveModeOnly();

    const items = (await apiClient.get('/room-bookings/buildings')) as BuildingSummaryApiItem[];
    return items.map(mapBuildingSummary);
  },

  listBuildingRooms: async (
    buildingId: string,
    filters: ListBuildingRoomsParams = {},
  ): Promise<RoomAvailabilitySummary[]> => {
    assertLiveModeOnly();

    return getBuildingRoomsFromApi(buildingId, filters);
  },

  listAllBuildingRooms: async (): Promise<Record<string, RoomAvailabilitySummary[]>> => {
    assertLiveModeOnly();

    const buildings = await roomBookingsApi.listBuildings();
    const entries = await Promise.all(
      buildings.map(
        async (building) => [building.id, await getBuildingRoomsFromApi(building.id)] as const,
      ),
    );

    return Object.fromEntries(entries);
  },

  getRoomSchedule: async (roomCode: string, weekStart?: string): Promise<RoomSchedule> => {
    assertLiveModeOnly();

    const response = (await apiClient.get(
      `/room-bookings/rooms/${encodeURIComponent(roomCode.toUpperCase())}/schedule`,
      {
        params: {
          ...(weekStart ? { weekStart } : {}),
        },
      },
    )) as RoomScheduleApiResponse;

    return mapScheduleResponse(response);
  },

  createRoomBooking: async (data: CreateRoomBookingRequest): Promise<RoomBookingResponse> => {
    return apiClient.post('/room-bookings', data) as Promise<RoomBookingResponse>;
  },

  listMyBookings: async (
    status?: RoomBookingResponse['status'],
  ): Promise<RoomBookingResponse[]> => {
    return (await apiClient.get('/room-bookings/me', {
      params: {
        ...(status ? { status } : {}),
      },
    })) as RoomBookingResponse[];
  },

  listPendingBookings: async (): Promise<Array<RoomBookingResponse & {
    requester: {
      id: string;
      email: string;
      fullName: string;
    };
  }>> => {
    return (await apiClient.get('/room-bookings', {
      params: { status: 'pending' },
    })) as Array<RoomBookingResponse & {
      requester: {
        id: string;
        email: string;
        fullName: string;
      };
    }>;
  },

  approveBooking: async (bookingId: string): Promise<RoomBookingResponse> => {
    return (await apiClient.patch(
      `/room-bookings/${encodeURIComponent(bookingId)}/approve`,
    )) as RoomBookingResponse;
  },

  rejectBooking: async (bookingId: string): Promise<RoomBookingResponse> => {
    return (await apiClient.patch(
      `/room-bookings/${encodeURIComponent(bookingId)}/reject`,
    )) as RoomBookingResponse;
  },

  cancelBooking: async (bookingId: string): Promise<RoomBookingResponse> => {
    return (await apiClient.patch(
      `/room-bookings/${encodeURIComponent(bookingId)}/cancel`,
    )) as RoomBookingResponse;
  },
};
