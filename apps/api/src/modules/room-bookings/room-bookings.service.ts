import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
  dateKey: string;
  label: string;
  slots: RoomScheduleSlot[];
};

const BANGKOK_TIME_ZONE = 'Asia/Bangkok';
const ACTIVE_ROOM_STATUS: RoomStatus = 'active';
const OCCUPYING_BOOKING_STATUSES: RoomBookingStatus[] = ['approved', 'booked', 'maintenance'];
const CONFLICT_BOOKING_STATUSES: RoomBookingStatus[] = ['pending', 'approved', 'booked', 'maintenance'];
const CREATED_BOOKING_STATUS: RoomBookingStatus = 'pending';
const EMPTY_ROOM_SCHEDULE_TEXT = 'Trống';
const ROOM_AVAILABLE_STATUS: RoomAvailabilityStatus = 'Trống hiện tại';
const ROOM_OCCUPIED_STATUS: RoomAvailabilityStatus = 'Đang được sử dụng';
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

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDateByDayOfWeek(monday: Date, dayOfWeek: number) {
  return addUtcDays(monday, dayOfWeek - 2);
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
        status: {
          in: CONFLICT_BOOKING_STATUSES,
        },
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
      dateKey: toDateKey(getDateByDayOfWeek(monday, day.dayOfWeek)),
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

  async getBuildings() {
    const buildings = await this.prisma.building.findMany({
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    const roomSummaries = await Promise.all(
      buildings.map(async (building) => {
        const rooms = await this.getBuildingRooms(building.code);
        const availableRooms = rooms.filter((room) => room.status === ROOM_AVAILABLE_STATUS).length;
        return {
          id: building.code,
          name: building.name,
          availableRooms,
          totalRooms: rooms.length,
          subtitle: `${availableRooms} phòng trống`,
        };
      }),
    );

    return roomSummaries;
  }

  async getMyBookings(userId: string, status?: RoomBookingStatus) {
    const bookings = await this.prisma.roomBooking.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
      },
      include: {
        room: {
          select: {
            roomCode: true,
            name: true,
            floor: {
              select: {
                building: {
                  select: {
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        timeSlot: {
          select: {
            id: true,
            slotNumber: true,
            label: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: [{ bookingDate: 'desc' }, { createdAt: 'desc' }],
    });

    return bookings.map((booking) => this.mapBooking(booking));
  }

  async getAdminBookings(status?: RoomBookingStatus) {
    const bookings = await this.prisma.roomBooking.findMany({
      where: status ? { status } : undefined,
      include: {
        room: {
          select: {
            roomCode: true,
            name: true,
            floor: {
              select: {
                building: {
                  select: {
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        timeSlot: {
          select: {
            id: true,
            slotNumber: true,
            label: true,
            startTime: true,
            endTime: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ bookingDate: 'desc' }, { createdAt: 'desc' }],
    });

    return bookings.map((booking) => ({
      ...this.mapBooking(booking),
      requester: {
        id: booking.user.id,
        email: booking.user.email,
        fullName: [booking.user.lastName, booking.user.firstName].filter(Boolean).join(' ').trim(),
      },
    }));
  }

  async approveBooking(bookingId: string, approverId: string) {
    const booking = await this.prisma.roomBooking.findUnique({
      where: { id: bookingId },
      include: {
        room: {
          select: {
            roomCode: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== 'pending') {
      throw new BadRequestException('Only pending bookings can be approved');
    }

    if (!booking.timeSlotId) {
      throw new BadRequestException('Booking time slot is required');
    }

    const hasConflict = await this.prisma.roomBooking.findFirst({
      where: {
        id: { not: booking.id },
        roomId: booking.roomId,
        bookingDate: booking.bookingDate,
        timeSlotId: booking.timeSlotId,
        status: {
          in: OCCUPYING_BOOKING_STATUSES,
        },
      },
      select: { id: true },
    });

    if (hasConflict) {
      throw new ConflictException('This room slot has been occupied');
    }

    const updated = await this.prisma.roomBooking.update({
      where: { id: booking.id },
      data: {
        status: 'approved',
        approvedById: approverId,
        approvedAt: new Date(),
      },
      include: {
        room: {
          select: {
            roomCode: true,
            name: true,
            floor: {
              select: {
                building: {
                  select: {
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        timeSlot: {
          select: {
            id: true,
            slotNumber: true,
            label: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    return this.mapBooking(updated);
  }

  async rejectBooking(bookingId: string, approverId: string) {
    const booking = await this.prisma.roomBooking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== 'pending') {
      throw new BadRequestException('Only pending bookings can be rejected');
    }

    const updated = await this.prisma.roomBooking.update({
      where: { id: booking.id },
      data: {
        status: 'rejected',
        approvedById: approverId,
        approvedAt: new Date(),
      },
      include: {
        room: {
          select: {
            roomCode: true,
            name: true,
            floor: {
              select: {
                building: {
                  select: {
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        timeSlot: {
          select: {
            id: true,
            slotNumber: true,
            label: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    return this.mapBooking(updated);
  }

  async cancelBooking(bookingId: string, userId: string, isAdmin: boolean) {
    const booking = await this.prisma.roomBooking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (!isAdmin && booking.userId !== userId) {
      throw new ForbiddenException('You do not have permission to cancel this booking');
    }

    if (booking.status === 'cancelled' || booking.status === 'rejected') {
      return this.getBookingById(booking.id);
    }

    const updated = await this.prisma.roomBooking.update({
      where: { id: booking.id },
      data: {
        status: 'cancelled',
      },
      include: {
        room: {
          select: {
            roomCode: true,
            name: true,
            floor: {
              select: {
                building: {
                  select: {
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        timeSlot: {
          select: {
            id: true,
            slotNumber: true,
            label: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    return this.mapBooking(updated);
  }

  private async getBookingById(bookingId: string) {
    const booking = await this.prisma.roomBooking.findUnique({
      where: { id: bookingId },
      include: {
        room: {
          select: {
            roomCode: true,
            name: true,
            floor: {
              select: {
                building: {
                  select: {
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        timeSlot: {
          select: {
            id: true,
            slotNumber: true,
            label: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.mapBooking(booking);
  }

  private mapBooking(
    booking: {
      id: string;
      bookingDate: Date;
      timeSlotId: string | null;
      startTime: string | null;
      endTime: string | null;
      title: string | null;
      purpose: string;
      attendeeCount: number | null;
      contactName: string | null;
      contactPhone: string | null;
      departmentName: string | null;
      notes: string | null;
      status: RoomBookingStatus;
      createdAt: Date;
      approvedAt: Date | null;
      room: {
        roomCode: string;
        name: string | null;
        floor: {
          building: {
            code: string;
            name: string;
          };
        };
      };
      timeSlot?: {
        id: string;
        slotNumber: number;
        label: string;
        startTime: string;
        endTime: string;
      } | null;
    },
  ) {
    return {
      id: booking.id,
      roomCode: booking.room.roomCode,
      roomName: booking.room.name,
      buildingCode: booking.room.floor.building.code,
      buildingName: booking.room.floor.building.name,
      bookingDate: toDateKey(booking.bookingDate),
      timeSlotId: booking.timeSlotId ?? '',
      startTime: booking.startTime,
      endTime: booking.endTime,
      timeSlot: booking.timeSlot
        ? {
            id: booking.timeSlot.id,
            slotNumber: booking.timeSlot.slotNumber,
            label: booking.timeSlot.label,
            startTime: booking.timeSlot.startTime,
            endTime: booking.timeSlot.endTime,
          }
        : null,
      title: booking.title,
      purpose: booking.purpose,
      attendeeCount: booking.attendeeCount,
      contactName: booking.contactName,
      contactPhone: booking.contactPhone,
      departmentName: booking.departmentName,
      notes: booking.notes,
      status: booking.status,
      approvedAt: booking.approvedAt,
      createdAt: booking.createdAt,
    };
  }

  private resolveRoomStatus(
    roomBookings: Array<{ id: string }> | undefined,
  ): RoomAvailabilityStatus {
    return roomBookings && roomBookings.length > 0 ? ROOM_OCCUPIED_STATUS : ROOM_AVAILABLE_STATUS;
  }
}
