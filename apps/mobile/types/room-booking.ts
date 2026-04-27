export type RoomSlotStatus = 'free' | 'occupied' | 'available_later';

export interface BuildingAvailability {
  id: string;
  code: string;
  name: string;
  searchText: string;
  availableRooms: number;
  totalRooms: number;
  subtitle: string;
}

export interface RoomAvailabilitySummary {
  id: string;
  buildingId: string;
  code: string;
  name?: string | null;
  buildingName?: string;
  floor: number;
  capacity: number;
  status: RoomSlotStatus;
  statusLabel: string;
  nextAvailableTime?: string;
  equipment: string[];
}

export interface RoomScheduleSlot {
  id: string;
  slotNumber?: number;
  startTime: string;
  endTime: string;
  status: RoomSlotStatus;
  label: string;
  courseCode?: string;
  statusLabel?: string;
  source?: 'semester' | 'booking' | null;
  title?: string | null;
  subtitle?: string | null;
  bookingId?: string | null;
  classSectionId?: string | null;
  bookable?: boolean;
}

export interface RoomScheduleDay {
  dayKey: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
  dateKey?: string;
  label: string;
  slots: RoomScheduleSlot[];
}

export interface RoomSchedule {
  roomCode: string;
  roomName: string | null;
  buildingCode: string;
  buildingName: string;
  capacity: number;
  weekStart?: string;
  days: RoomScheduleDay[];
}

export interface RoomBookingDraft {
  buildingId: string;
  roomId: string;
  dayKey: RoomScheduleDay['dayKey'];
  slotId: string;
  purpose: string;
}
