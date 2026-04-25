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
  floor: number;
  capacity: number;
  status: RoomSlotStatus;
  statusLabel: string;
  nextAvailableTime?: string;
  equipment: string[];
}

export interface RoomScheduleSlot {
  id: string;
  startTime: string;
  endTime: string;
  status: RoomSlotStatus;
  label: string;
  courseCode?: string;
}

export interface RoomScheduleDay {
  dayKey: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
  dateKey?: string;
  label: string;
  slots: RoomScheduleSlot[];
}

export interface RoomBookingDraft {
  buildingId: string;
  roomId: string;
  dayKey: RoomScheduleDay['dayKey'];
  slotId: string;
  purpose: string;
}
