import type {
  BuildingAvailability,
  RoomAvailabilitySummary,
  RoomBookingDraft,
  RoomScheduleDay,
  RoomScheduleSlot,
} from '@/types/room-booking';

type RoomCatalogSeed = readonly [
  buildingId: string,
  roomCode: string,
  floor: number,
  capacity: number,
];

const STATIC_ROOM_CATALOG: RoomCatalogSeed[] = [
  ['A', 'A112', 1, 15],
  ['A', 'A114', 1, 15],
  ['A', 'A116', 1, 30],
  ['A', 'A215', 2, 50],
  ['A', 'A301', 3, 30],
  ['A', 'A305', 3, 30],
  ['A', 'A307', 3, 30],
  ['A', 'A309', 3, 30],
  ['A', 'A315', 3, 50],
  ['A', 'A323', 3, 30],
  ['A', 'A325', 3, 48],
  ['B', 'B1.02', 1, 60],
  ['B', 'B1.04', 1, 60],
  ['B', 'B1.06', 1, 60],
  ['B', 'B1.08', 1, 60],
  ['B', 'B1.10', 1, 70],
  ['B', 'B1.12', 1, 70],
  ['B', 'B1.14', 1, 160],
  ['B', 'B1.16', 1, 90],
  ['B', 'B1.18', 1, 90],
  ['B', 'B1.20', 1, 100],
  ['B', 'B1.22', 1, 100],
  ['B', 'B2.02', 2, 40],
  ['B', 'B2.06', 2, 40],
  ['B', 'B2.08', 2, 40],
  ['B', 'B2.10', 2, 40],
  ['B', 'B2.12', 2, 40],
  ['B', 'B2.14', 2, 120],
  ['B', 'B2.16', 2, 50],
  ['B', 'B2.18', 2, 50],
  ['B', 'B2.20', 2, 60],
  ['B', 'B2.22', 2, 60],
  ['B', 'B3.02', 3, 40],
  ['B', 'B3.04', 3, 40],
  ['B', 'B3.06', 3, 40],
  ['B', 'B3.08', 3, 40],
  ['B', 'B3.10', 3, 80],
  ['B', 'B3.12', 3, 80],
  ['B', 'B3.14', 3, 140],
  ['B', 'B3.16', 3, 90],
  ['B', 'B3.18', 3, 90],
  ['B', 'B3.20', 3, 100],
  ['B', 'B3.22', 3, 100],
  ['B', 'B4.02', 4, 40],
  ['B', 'B4.04', 4, 40],
  ['B', 'B4.06', 4, 40],
  ['B', 'B4.08', 4, 40],
  ['B', 'B4.10', 4, 72],
  ['B', 'B4.12', 4, 72],
  ['B', 'B4.14', 4, 160],
  ['B', 'B4.16', 4, 90],
  ['B', 'B4.18', 4, 90],
  ['B', 'B4.20', 4, 100],
  ['B', 'B4.22', 4, 100],
  ['B', 'B5.02', 5, 64],
  ['B', 'B5.04', 5, 50],
  ['B', 'B5.06', 5, 50],
  ['B', 'B5.08', 5, 60],
  ['B', 'B5.10', 5, 90],
  ['B', 'B5.12', 5, 90],
  ['B', 'B5.14', 5, 180],
  ['B', 'B6.02', 6, 80],
  ['B', 'B6.04', 6, 80],
  ['B', 'B6.06', 6, 160],
  ['B', 'B6.08', 6, 90],
  ['B', 'B6.10', 6, 90],
  ['B', 'B6.12', 6, 180],
  ['B', 'B7.02', 7, 160],
  ['B', 'B7.04', 7, 90],
  ['B', 'B7.06', 7, 90],
  ['B', 'B7.08', 7, 220],
  ['B', 'B9.02', 9, 120],
  ['C', 'C101', 1, 50],
  ['C', 'C102', 1, 80],
  ['C', 'C104', 1, 170],
  ['C', 'C109', 1, 50],
  ['C', 'C110', 1, 48],
  ['C', 'C111', 1, 50],
  ['C', 'C201', 2, 50],
  ['C', 'C202', 2, 72],
  ['C', 'C206', 2, 50],
  ['C', 'C208', 2, 50],
  ['C', 'C210', 2, 50],
  ['C', 'C212', 2, 50],
  ['C', 'C213', 2, 120],
  ['C', 'C214', 2, 100],
  ['C', 'C216', 2, 50],
  ['C', 'C218', 2, 50],
  ['C', 'C301', 3, 50],
  ['C', 'C302', 3, 72],
  ['C', 'C305', 3, 50],
  ['C', 'C306', 3, 50],
  ['C', 'C307', 3, 50],
  ['C', 'C308', 3, 50],
  ['C', 'C309', 3, 80],
  ['C', 'C310', 3, 50],
  ['C', 'C311', 3, 80],
  ['C', 'C312', 3, 50],
  ['C', 'C313', 3, 50],
  ['C', 'C314', 3, 80],
  ['C', 'C315', 3, 50],
  ['C', 'C316', 3, 50],
  ['C', 'C318', 3, 50],
  ['E', 'E02.3', 2, 30],
  ['E', 'E02.4', 2, 48],
  ['E', 'E03.2', 3, 48],
  ['E', 'E03.3', 3, 30],
  ['E', 'E03.4', 3, 48],
  ['E', 'E04.1', 4, 66],
  ['E', 'E04.2', 4, 48],
  ['E', 'E04.3', 4, 30],
  ['E', 'E04.4', 4, 48],
  ['E', 'E11.2', 11, 32],
  ['E', 'E11.4', 11, 32],
  ['E', 'E11.6', 11, 32],
  ['E', 'E11.8', 11, 30],
];

const ROOM_SUMMARY_OVERRIDES: Record<string, Partial<RoomAvailabilitySummary>> = {
  A112: {
    equipment: ['Máy chiếu', 'Bảng viết'],
  },
  C101: {
    statusLabel: 'Đang trống',
    equipment: ['Máy chiếu', 'Bảng viết'],
  },
  C102: {
    status: 'occupied',
    statusLabel: 'Bận đến 11:30',
    equipment: ['Máy chiếu', 'Âm thanh'],
  },
  C201: {
    status: 'available_later',
    statusLabel: 'Trống 14:00',
    nextAvailableTime: '14:00',
    equipment: ['Lab máy tính', 'Hybrid'],
  },
  C202: {
    statusLabel: 'Trống hiện tại',
    equipment: ['Bảng viết'],
  },
  A301: {
    statusLabel: 'Trống hiện tại',
    equipment: ['Máy chiếu'],
  },
  B204: {
    buildingId: 'B',
    code: 'B204',
    floor: 2,
    capacity: 35,
    status: 'occupied',
    statusLabel: 'Đang học',
    equipment: ['Máy chiếu'],
  },
  E105: {
    buildingId: 'E',
    code: 'E105',
    floor: 1,
    capacity: 25,
    status: 'available_later',
    statusLabel: 'Trống lúc 15h',
    nextAvailableTime: '15:00',
    equipment: ['Bảng viết', 'Loa'],
  },
};

function countRooms(buildingId: string) {
  return STATIC_ROOM_CATALOG.filter(([currentBuildingId]) => currentBuildingId === buildingId)
    .length;
}

export const BUILDING_AVAILABILITY: BuildingAvailability[] = [
  {
    id: 'A',
    code: 'A Tower',
    name: 'Tòa A',
    searchText: 'A Tower toa A nha A',
    availableRooms: countRooms('A'),
    totalRooms: countRooms('A'),
    subtitle: `${countRooms('A')} phòng trống`,
  },
  {
    id: 'B',
    code: 'B Tower',
    name: 'Tòa B',
    searchText: 'B Tower toa B nha B',
    availableRooms: countRooms('B'),
    totalRooms: countRooms('B'),
    subtitle: `${countRooms('B')} phòng trống`,
  },
  {
    id: 'C',
    code: 'C Tower',
    name: 'Tòa C',
    searchText: 'C Tower toa C nha C',
    availableRooms: countRooms('C'),
    totalRooms: countRooms('C'),
    subtitle: `${countRooms('C')} phòng trống`,
  },
  {
    id: 'E',
    code: 'E Tower',
    name: 'Tòa E',
    searchText: 'E Tower toa E nha E',
    availableRooms: countRooms('E'),
    totalRooms: countRooms('E'),
    subtitle: `${countRooms('E')} phòng trống`,
  },
];

export const ROOM_SUMMARIES: RoomAvailabilitySummary[] = [
  ...STATIC_ROOM_CATALOG.map(([buildingId, code, floor, capacity]) => ({
    id: code,
    buildingId,
    code,
    floor,
    capacity,
    status: 'free' as const,
    statusLabel: 'Trống hiện tại',
    equipment: [] as string[],
  })),
  {
    id: 'B204',
    buildingId: 'B',
    code: 'B204',
    floor: 2,
    capacity: 35,
    status: 'occupied',
    statusLabel: 'Đang học',
    equipment: ['Máy chiếu'],
  },
  {
    id: 'E105',
    buildingId: 'E',
    code: 'E105',
    floor: 1,
    capacity: 25,
    status: 'available_later',
    statusLabel: 'Trống lúc 15h',
    nextAvailableTime: '15:00',
    equipment: ['Bảng viết', 'Loa'],
  },
].map(
  (room) =>
    ({
      ...room,
      ...(ROOM_SUMMARY_OVERRIDES[room.code] ?? {}),
    }) as RoomAvailabilitySummary,
);

function slot(
  id: string,
  startTime: string,
  endTime: string,
  status: RoomScheduleSlot['status'],
  label: string,
  courseCode?: string,
): RoomScheduleSlot {
  return {
    id,
    slotNumber: resolveSlotNumber(startTime),
    startTime,
    endTime,
    status,
    label,
    courseCode,
  };
}

function resolveSlotNumber(startTime: string) {
  const slotNumberByStartTime: Record<string, number> = {
    '07:30': 1,
    '08:15': 2,
    '09:00': 3,
    '10:00': 4,
    '10:45': 5,
    '11:00': 11,
    '13:00': 6,
    '13:45': 7,
    '14:30': 8,
    '15:30': 9,
    '16:15': 10,
    '17:00': 12,
  };

  return slotNumberByStartTime[startTime] ?? 0;
}

function buildFreeDay(prefix: string) {
  return [
    slot(`${prefix}-0730`, '07:30', '08:15', 'free', 'Trống'),
    slot(`${prefix}-0815`, '08:15', '09:00', 'free', 'Trống'),
    slot(`${prefix}-0900`, '09:00', '09:45', 'free', 'Trống'),
    slot(`${prefix}-1000`, '10:00', '10:45', 'free', 'Trống'),
    slot(`${prefix}-1045`, '10:45', '11:30', 'free', 'Trống'),
    slot(`${prefix}-1100`, '11:00', '13:00', 'free', 'Trống'),
    slot(`${prefix}-1300`, '13:00', '13:45', 'free', 'Trống'),
    slot(`${prefix}-1345`, '13:45', '14:30', 'free', 'Trống'),
    slot(`${prefix}-1430`, '14:30', '15:15', 'free', 'Trống'),
    slot(`${prefix}-1530`, '15:30', '16:15', 'free', 'Trống'),
    slot(`${prefix}-1615`, '16:15', '17:00', 'free', 'Trống'),
    slot(`${prefix}-1700`, '17:00', '21:00', 'free', 'Trống'),
  ];
}

export const ROOM_SCHEDULES: Record<string, RoomScheduleDay[]> = {
  A112: [
    { dayKey: 'mon', label: 'Th2', slots: buildFreeDay('mon') },
    { dayKey: 'tue', label: 'Th3', slots: buildFreeDay('tue') },
    { dayKey: 'wed', label: 'Th4', slots: buildFreeDay('wed') },
    { dayKey: 'thu', label: 'Th5', slots: buildFreeDay('thu') },
    { dayKey: 'fri', label: 'Th6', slots: buildFreeDay('fri') },
    { dayKey: 'sat', label: 'Th7', slots: buildFreeDay('sat') },
  ],
  C101: [
    {
      dayKey: 'mon',
      label: 'Th2',
      slots: [
        slot('mon-0730', '07:30', '08:15', 'free', 'Trống'),
        slot('mon-0815', '08:15', '09:00', 'occupied', 'CE124.Q21', 'CE124.Q21'),
        slot('mon-0900', '09:00', '09:45', 'occupied', 'CE124.Q21', 'CE124.Q21'),
        slot('mon-1000', '10:00', '10:45', 'free', 'Trống'),
        slot('mon-1300', '13:00', '14:30', 'free', 'Trống'),
      ],
    },
    {
      dayKey: 'tue',
      label: 'Th3',
      slots: [
        slot('tue-0730', '07:30', '09:00', 'occupied', 'SE346.Q22', 'SE346.Q22'),
        slot('tue-1000', '10:00', '11:30', 'available_later', 'Trống lúc 10:00'),
        slot('tue-1300', '13:00', '14:30', 'free', 'Trống'),
      ],
    },
    {
      dayKey: 'wed',
      label: 'Th4',
      slots: [
        slot('wed-0730', '07:30', '08:15', 'free', 'Trống'),
        slot('wed-0815', '08:15', '09:45', 'free', 'Trống'),
      ],
    },
    {
      dayKey: 'thu',
      label: 'Th5',
      slots: [
        slot('thu-0730', '07:30', '09:45', 'occupied', 'IT003.P12', 'IT003.P12'),
        slot('thu-1000', '10:00', '11:30', 'free', 'Trống'),
      ],
    },
    {
      dayKey: 'fri',
      label: 'Th6',
      slots: [
        slot('fri-0730', '07:30', '08:15', 'free', 'Trống'),
        slot('fri-1300', '13:00', '15:15', 'free', 'Trống'),
      ],
    },
    {
      dayKey: 'sat',
      label: 'Th7',
      slots: [slot('sat-0730', '07:30', '09:00', 'available_later', 'Trống lúc 09:00')],
    },
  ],
  C102: [
    {
      dayKey: 'mon',
      label: 'Th2',
      slots: [slot('mon-0730', '07:30', '11:30', 'occupied', 'CS221.P12', 'CS221.P12')],
    },
    { dayKey: 'tue', label: 'Th3', slots: [slot('tue-1300', '13:00', '15:15', 'free', 'Trống')] },
    {
      dayKey: 'wed',
      label: 'Th4',
      slots: [slot('wed-0730', '07:30', '09:45', 'available_later', 'Trống lúc 09:45')],
    },
    {
      dayKey: 'thu',
      label: 'Th5',
      slots: [slot('thu-0730', '07:30', '10:00', 'occupied', 'MA004.P15', 'MA004.P15')],
    },
    { dayKey: 'fri', label: 'Th6', slots: [slot('fri-1000', '10:00', '11:30', 'free', 'Trống')] },
    { dayKey: 'sat', label: 'Th7', slots: [slot('sat-1300', '13:00', '15:15', 'free', 'Trống')] },
  ],
  C201: [
    {
      dayKey: 'mon',
      label: 'Th2',
      slots: [
        slot('mon-0730', '07:30', '13:45', 'occupied', 'IS401.Q31', 'IS401.Q31'),
        slot('mon-1400', '14:00', '15:15', 'free', 'Trống'),
      ],
    },
    { dayKey: 'tue', label: 'Th3', slots: [slot('tue-0730', '07:30', '09:00', 'free', 'Trống')] },
    { dayKey: 'wed', label: 'Th4', slots: [slot('wed-1000', '10:00', '11:30', 'free', 'Trống')] },
    {
      dayKey: 'thu',
      label: 'Th5',
      slots: [slot('thu-1300', '13:00', '15:15', 'occupied', 'NT213.P11', 'NT213.P11')],
    },
    { dayKey: 'fri', label: 'Th6', slots: [slot('fri-0730', '07:30', '09:00', 'free', 'Trống')] },
    {
      dayKey: 'sat',
      label: 'Th7',
      slots: [slot('sat-1000', '10:00', '11:30', 'available_later', 'Trống lúc 11:30')],
    },
  ],
  C202: [
    { dayKey: 'mon', label: 'Th2', slots: [slot('mon-1300', '13:00', '14:30', 'free', 'Trống')] },
    { dayKey: 'tue', label: 'Th3', slots: [slot('tue-0730', '07:30', '09:00', 'free', 'Trống')] },
    {
      dayKey: 'wed',
      label: 'Th4',
      slots: [slot('wed-0730', '07:30', '08:15', 'occupied', 'SS004.P18', 'SS004.P18')],
    },
    { dayKey: 'thu', label: 'Th5', slots: [slot('thu-1000', '10:00', '11:30', 'free', 'Trống')] },
    { dayKey: 'fri', label: 'Th6', slots: [slot('fri-1300', '13:00', '14:30', 'free', 'Trống')] },
    { dayKey: 'sat', label: 'Th7', slots: [slot('sat-0730', '07:30', '09:00', 'free', 'Trống')] },
  ],
  A301: [
    {
      dayKey: 'mon',
      label: 'Th2',
      slots: [
        slot('mon-0730', '07:30', '08:15', 'free', 'Trống'),
        slot('mon-0815', '08:15', '09:45', 'occupied', 'SE347.Q11', 'SE347.Q11'),
        slot('mon-1000', '10:00', '11:30', 'free', 'Trống'),
        slot('mon-1300', '13:00', '14:30', 'free', 'Trống'),
      ],
    },
    {
      dayKey: 'tue',
      label: 'Th3',
      slots: [
        slot('tue-0730', '07:30', '09:00', 'occupied', 'ENG02.P08', 'ENG02.P08'),
        slot('tue-1000', '10:00', '11:30', 'available_later', 'Trống lúc 11:30'),
        slot('tue-1300', '13:00', '15:15', 'free', 'Trống'),
      ],
    },
    {
      dayKey: 'wed',
      label: 'Th4',
      slots: [
        slot('wed-0730', '07:30', '09:45', 'free', 'Trống'),
        slot('wed-1000', '10:00', '11:30', 'free', 'Trống'),
      ],
    },
    {
      dayKey: 'thu',
      label: 'Th5',
      slots: [
        slot('thu-0730', '07:30', '09:00', 'occupied', 'SS006.P03', 'SS006.P03'),
        slot('thu-1000', '10:00', '11:30', 'free', 'Trống'),
      ],
    },
    {
      dayKey: 'fri',
      label: 'Th6',
      slots: [
        slot('fri-0730', '07:30', '09:00', 'free', 'Trống'),
        slot('fri-1300', '13:00', '14:30', 'available_later', 'Trống lúc 14:30'),
      ],
    },
    { dayKey: 'sat', label: 'Th7', slots: [slot('sat-0730', '07:30', '09:00', 'free', 'Trống')] },
  ],
  B204: [
    {
      dayKey: 'mon',
      label: 'Th2',
      slots: [
        slot('mon-0730', '07:30', '09:45', 'occupied', 'CS221.P12', 'CS221.P12'),
        slot('mon-1000', '10:00', '11:30', 'available_later', 'Trống lúc 11:30'),
      ],
    },
    {
      dayKey: 'tue',
      label: 'Th3',
      slots: [
        slot('tue-0730', '07:30', '08:15', 'free', 'Trống'),
        slot('tue-0815', '08:15', '09:45', 'occupied', 'IT008.Q09', 'IT008.Q09'),
        slot('tue-1000', '10:00', '11:30', 'free', 'Trống'),
      ],
    },
    {
      dayKey: 'wed',
      label: 'Th4',
      slots: [slot('wed-1300', '13:00', '15:15', 'occupied', 'NT208.Q13', 'NT208.Q13')],
    },
    { dayKey: 'thu', label: 'Th5', slots: [slot('thu-0730', '07:30', '09:00', 'free', 'Trống')] },
    { dayKey: 'fri', label: 'Th6', slots: [slot('fri-1000', '10:00', '11:30', 'free', 'Trống')] },
    { dayKey: 'sat', label: 'Th7', slots: [slot('sat-1300', '13:00', '15:15', 'free', 'Trống')] },
  ],
  E105: [
    {
      dayKey: 'mon',
      label: 'Th2',
      slots: [
        slot('mon-0730', '07:30', '09:00', 'occupied', 'SE104.P21', 'SE104.P21'),
        slot('mon-1000', '10:00', '11:30', 'free', 'Trống'),
      ],
    },
    { dayKey: 'tue', label: 'Th3', slots: [slot('tue-0730', '07:30', '09:45', 'free', 'Trống')] },
    {
      dayKey: 'wed',
      label: 'Th4',
      slots: [slot('wed-1300', '13:00', '15:15', 'available_later', 'Trống lúc 15:15')],
    },
    {
      dayKey: 'thu',
      label: 'Th5',
      slots: [
        slot('thu-0730', '07:30', '08:15', 'free', 'Trống'),
        slot('thu-0815', '08:15', '09:45', 'occupied', 'LAW200.Q16', 'LAW200.Q16'),
      ],
    },
    { dayKey: 'fri', label: 'Th6', slots: [slot('fri-1000', '10:00', '11:30', 'free', 'Trống')] },
    { dayKey: 'sat', label: 'Th7', slots: [slot('sat-0730', '07:30', '09:00', 'free', 'Trống')] },
  ],
};

export const ROOM_BOOKING_PURPOSE_OPTIONS = [
  'Học nhóm',
  'Thuyết trình',
  'Workshop nhỏ',
  'Lab thực hành',
] as const;

let runtimeBuildingAvailability: BuildingAvailability[] | null = null;
const runtimeRoomSummariesByBuilding = new Map<string, RoomAvailabilitySummary[]>();

export function setRuntimeBuildingAvailability(buildings: BuildingAvailability[]) {
  runtimeBuildingAvailability = buildings;
}

export function setRuntimeRoomsForBuilding(buildingId: string, rooms: RoomAvailabilitySummary[]) {
  runtimeRoomSummariesByBuilding.set(buildingId.toUpperCase(), rooms);
}

export function setRuntimeRoomCatalog(catalog: Record<string, RoomAvailabilitySummary[]>) {
  Object.entries(catalog).forEach(([buildingId, rooms]) => {
    runtimeRoomSummariesByBuilding.set(buildingId.toUpperCase(), rooms);
  });
}

export function getBuildings() {
  return runtimeBuildingAvailability ?? BUILDING_AVAILABILITY;
}

export function getBuilding(buildingId: string) {
  return getBuildings().find((item) => item.id === buildingId.toUpperCase()) ?? null;
}

export function getRoomsForBuilding(buildingId: string) {
  return (
    runtimeRoomSummariesByBuilding.get(buildingId.toUpperCase()) ??
    ROOM_SUMMARIES.filter((item) => item.buildingId === buildingId.toUpperCase())
  );
}

export function getRoom(buildingId: string, roomId: string) {
  return (
    getRoomsForBuilding(buildingId).find(
      (item) => item.buildingId === buildingId.toUpperCase() && item.id === roomId.toUpperCase(),
    ) ?? null
  );
}

export function getRoomSchedule(roomId: string) {
  return ROOM_SCHEDULES[roomId.toUpperCase()] ?? [];
}

export function createRoomBookingDraft(params: {
  buildingId: string;
  roomId: string;
  dayKey: RoomBookingDraft['dayKey'];
  slotId: string;
  purpose: string;
}): RoomBookingDraft {
  return {
    buildingId: params.buildingId.toUpperCase(),
    roomId: params.roomId.toUpperCase(),
    dayKey: params.dayKey,
    slotId: params.slotId,
    purpose: params.purpose.trim(),
  };
}
