import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, RoomBookingStatus, RoomStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import type { CreateRoomBookingDto } from './dto/create-room-booking.dto';

type CurrentBangkokDateTime = {
  dateKey: string;
  timeKey: string;
};

type RoomAvailabilityStatus = 'Trống hiện tại' | 'Đang được sử dụng';

type RoomListFilters = {
  floorNumber?: number;
  minCapacity?: number;
};

type RoomScheduleSlot = {
  timeSlotId: string;
  slotNumber: number;
  label: string;
  startTime: string;
  endTime: string;
  bookingTitle: string | null;
  displayText: string;
};

type RoomScheduleDay = {
  dayOfWeek: number;
  label: string;
  slots: RoomScheduleSlot[];
};

const BANGKOK_TIME_ZONE = 'Asia/Bangkok';
const ACTIVE_ROOM_STATUS: RoomStatus = 'active';
const OCCUPYING_BOOKING_STATUSES: RoomBookingStatus[] = ['booked', 'maintenance'];
const CREATED_BOOKING_STATUS: RoomBookingStatus = 'pending';
const EMPTY_ROOM_SCHEDULE_TEXT = 'Trống';
const ROOM_CODE_COLLATOR = new Intl.Collator('en', {
  numeric: true,
  sensitivity: 'base',
});
const FIXED_ROOM_SCHEDULE_DAYS = [
  { dayOfWeek: 2, label: 'Thứ 2' },
  { dayOfWeek: 3, label: 'Thứ 3' },
  { dayOfWeek: 4, label: 'Thứ 4' },
  { dayOfWeek: 5, label: 'Thứ 5' },
  { dayOfWeek: 6, label: 'Thứ 6' },
  { dayOfWeek: 7, label: 'Thứ 7' },
] as const;

function getBangkokDateTimeParts(now = new Date()): CurrentBangkokDateTime {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BANGKOK_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(now)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  ) as Record<'year' | 'month' | 'day' | 'hour' | 'minute', string>;

  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    timeKey: `${parts.hour}:${parts.minute}`,
  };
}

function isCurrentTimeInSlot(timeKey: string, startTime: string, endTime: string) {
  return startTime <= timeKey && timeKey < endTime;
}

function createUtcDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function parseBookingDate(dateKey: string) {
  const normalizedDateKey = String(dateKey || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDateKey)) {
    throw new BadRequestException('bookingDate phai co dinh dang YYYY-MM-DD');
  }

  const parsedDate = createUtcDate(normalizedDateKey);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new BadRequestException('bookingDate khong hop le');
  }

  return parsedDate;
}

function addUtcDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function getCurrentBangkokWeekRange(now = new Date()) {
  const { dateKey } = getBangkokDateTimeParts(now);
  const currentDate = createUtcDate(dateKey);
  const utcDay = currentDate.getUTCDay();
  const isoDay = utcDay === 0 ? 7 : utcDay;
  const monday = addUtcDays(currentDate, 1 - isoDay);
  const saturday = addUtcDays(monday, 5);

  return {
    monday,
    saturday,
  };
}

function getRoomBookingDayOfWeek(bookingDate: Date) {
  const utcDay = bookingDate.getUTCDay();
  return utcDay === 0 ? 8 : utcDay + 1;
}

@Injectable()
export class RoomBookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoomBooking(userId: string, dto: CreateRoomBookingDto) {
    const roomCode = String(dto.roomCode || '').trim().toUpperCase();
    const bookingDate = parseBookingDate(dto.bookingDate);

    const [room, timeSlot] = await Promise.all([
      this.prisma.room.findFirst({
        where: {
          roomCode,
          status: ACTIVE_ROOM_STATUS,
        },
        select: {
          id: true,
          roomCode: true,
        },
      }),
      this.prisma.timeSlot.findUnique({
        where: { id: dto.timeSlotId },
        select: {
          id: true,
          startTime: true,
          endTime: true,
        },
      }),
    ]);

    if (!room) {
      throw new NotFoundException('Khong tim thay phong');
    }

    if (!timeSlot) {
      throw new NotFoundException('Khong tim thay tiet hoc');
    }

    const duplicateBooking = await this.prisma.roomBooking.findFirst({
      where: {
        roomId: room.id,
        bookingDate,
        timeSlotId: timeSlot.id,
      },
      select: {
        id: true,
      },
    });

    if (duplicateBooking) {
      throw new ConflictException('Khung gio nay da co yeu cau dat phong');
    }

    const booking = await this.prisma.roomBooking.create({
      data: {
        roomId: room.id,
        userId,
        bookingDate,
        timeSlotId: timeSlot.id,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        title: dto.title?.trim() || null,
        purpose: dto.purpose.trim(),
        attendeeCount: dto.attendeeCount ?? null,
        contactName: dto.contactName.trim(),
        contactPhone: dto.contactPhone?.trim() || null,
        departmentName: dto.departmentName?.trim() || null,
        status: CREATED_BOOKING_STATUS,
      },
      select: {
        id: true,
        bookingDate: true,
        timeSlotId: true,
        title: true,
        purpose: true,
        attendeeCount: true,
        contactName: true,
        contactPhone: true,
        departmentName: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      id: booking.id,
      roomCode: room.roomCode,
      bookingDate: booking.bookingDate.toISOString().slice(0, 10),
      timeSlotId: booking.timeSlotId ?? '',
      title: booking.title,
      purpose: booking.purpose,
      attendeeCount: booking.attendeeCount,
      contactName: booking.contactName,
      contactPhone: booking.contactPhone,
      departmentName: booking.departmentName,
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
    };
  }

  async getBuildingRooms(buildingCode: string, filters: RoomListFilters = {}) {
    const normalizedBuildingCode = String(buildingCode || '').trim().toUpperCase();
    if (!normalizedBuildingCode) {
      return [];
    }

    const { dateKey, timeKey } = getBangkokDateTimeParts();
    const today = new Date(`${dateKey}T00:00:00.000Z`);

    const timeSlots = await this.prisma.timeSlot.findMany({
      orderBy: { slotNumber: 'asc' },
    });

    const currentTimeSlot = timeSlots.find((slot) =>
      isCurrentTimeInSlot(timeKey, slot.startTime, slot.endTime),
    );

    const where: Prisma.RoomWhereInput = {
      status: ACTIVE_ROOM_STATUS,
      floor: {
        building: {
          code: normalizedBuildingCode,
        },
        ...(filters.floorNumber ? { floorNumber: filters.floorNumber } : {}),
      },
      ...(filters.minCapacity ? { capacity: { gte: filters.minCapacity } } : {}),
    };

    const rooms = await this.prisma.room.findMany({
      where,
      select: {
        roomCode: true,
        capacity: true,
        roomBookings: currentTimeSlot
          ? {
              where: {
                bookingDate: today,
                status: { in: OCCUPYING_BOOKING_STATUSES },
                timeSlotId: currentTimeSlot.id,
              },
              select: {
                id: true,
              },
            }
          : false,
      },
    });

    return rooms
      .map((room) => ({
        roomCode: room.roomCode,
        capacity: room.capacity,
        status: this.resolveRoomStatus(room.roomBookings),
      }))
      .sort((left, right) => ROOM_CODE_COLLATOR.compare(left.roomCode, right.roomCode));
  }

  async getRoomSchedule(roomCode: string) {
    const normalizedRoomCode = String(roomCode || '').trim().toUpperCase();
    if (!normalizedRoomCode) {
      throw new NotFoundException('Room not found');
    }
    const { monday, saturday } = getCurrentBangkokWeekRange();

    const room = await this.prisma.room.findFirst({
      where: {
        roomCode: normalizedRoomCode,
        status: ACTIVE_ROOM_STATUS,
      },
      select: {
        id: true,
        roomCode: true,
        name: true,
        capacity: true,
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const [timeSlots, roomBookings] = await Promise.all([
      this.prisma.timeSlot.findMany({
        orderBy: { slotNumber: 'asc' },
      }),
      this.prisma.roomBooking.findMany({
        where: {
          roomId: room.id,
          bookingDate: {
            gte: monday,
            lte: saturday,
          },
          status: { in: OCCUPYING_BOOKING_STATUSES },
          timeSlotId: { not: null },
        },
        select: {
          bookingDate: true,
          timeSlotId: true,
          title: true,
        },
        orderBy: { bookingDate: 'desc' },
      }),
    ]);

    const bookingByDayAndSlot = new Map<string, { title: string | null }>();
    for (const booking of roomBookings) {
      const dayOfWeek = getRoomBookingDayOfWeek(booking.bookingDate);
      if (dayOfWeek < 2 || dayOfWeek > 7 || !booking.timeSlotId) {
        continue;
      }

      const key = `${dayOfWeek}:${booking.timeSlotId}`;
      if (!bookingByDayAndSlot.has(key)) {
        bookingByDayAndSlot.set(key, { title: booking.title });
      }
    }

    const days: RoomScheduleDay[] = FIXED_ROOM_SCHEDULE_DAYS.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      label: day.label,
      slots: timeSlots.map((timeSlot) => {
        const booking = bookingByDayAndSlot.get(`${day.dayOfWeek}:${timeSlot.id}`);
        const bookingTitle = booking?.title ?? null;

        return {
          timeSlotId: timeSlot.id,
          slotNumber: timeSlot.slotNumber,
          label: timeSlot.label,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          bookingTitle,
          displayText: bookingTitle || EMPTY_ROOM_SCHEDULE_TEXT,
        };
      }),
    }));

    return {
      roomCode: room.roomCode,
      capacity: room.capacity,
      name: room.name,
      days,
    };
  }

  private resolveRoomStatus(
    roomBookings: Array<{ id: string }> | undefined,
  ): RoomAvailabilityStatus {
    return roomBookings && roomBookings.length > 0 ? 'Đang được sử dụng' : 'Trống hiện tại';
  }
}
