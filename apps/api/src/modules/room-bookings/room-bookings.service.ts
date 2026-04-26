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
const CONFLICT_BOOKING_STATUSES: RoomBookingStatus[] = [
  'pending',
  'approved',
  'booked',
  'maintenance',
];
const INACTIVE_BOOKING_STATUSES: RoomBookingStatus[] = ['rejected', 'cancelled'];
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
const ROOM_BOOKING_MAX_WEEKS_AHEAD = 8;

const roomBookingInclude = {
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
  bookingSlots: {
    include: {
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
    orderBy: {
      slotOrder: 'asc' as const,
    },
  },
} satisfies Prisma.RoomBookingInclude;

type RoomBookingWithRelations = Prisma.RoomBookingGetPayload<{
  include: typeof roomBookingInclude;
}>;

type SelectedTimeSlot = {
  id: string;
  slotNumber: number;
  label: string;
  startTime: string;
  endTime: string;
};

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
    throw new BadRequestException('bookingDate phải có định dạng YYYY-MM-DD');
  }

  const parsedDate = createUtcDate(normalizedDateKey);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new BadRequestException('bookingDate không hợp lệ');
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

function getMondayOfDateUtc(date: Date) {
  const utcDay = date.getUTCDay();
  const isoDay = utcDay === 0 ? 7 : utcDay;
  return addUtcDays(date, 1 - isoDay);
}

function getFirstBookableWeekMonday(now = new Date()) {
  const { monday: currentMonday } = getCurrentBangkokWeekRange(now);
  return addUtcDays(currentMonday, 7);
}

function getLastAllowedWeekMonday(now = new Date()) {
  return addUtcDays(
    getFirstBookableWeekMonday(now),
    (ROOM_BOOKING_MAX_WEEKS_AHEAD - 1) * 7,
  );
}

function assertBookingDateAllowedForRoomBooking(bookingDate: Date, now = new Date()) {
  const dayOfWeek = getRoomBookingDayOfWeek(bookingDate);
  if (dayOfWeek < 2 || dayOfWeek > 7) {
    throw new BadRequestException('bookingDate chỉ được từ Thứ 2 đến Thứ 7');
  }

  const weekMonday = getMondayOfDateUtc(bookingDate);
  const firstAllowed = getFirstBookableWeekMonday(now);
  const lastAllowed = getLastAllowedWeekMonday(now);

  if (weekMonday.getTime() < firstAllowed.getTime()) {
    throw new BadRequestException(
      'Đặt phòng phải cách ít nhất một tuần (từ tuần kế tiếp trở đi)',
    );
  }

  if (weekMonday.getTime() > lastAllowed.getTime()) {
    throw new BadRequestException(
      `Đặt phòng tối đa ${ROOM_BOOKING_MAX_WEEKS_AHEAD} tuần kể từ tuần được phép đầu tiên`,
    );
  }
}

function resolveScheduleWeekMonday(weekStart: string | undefined, now = new Date()) {
  const firstAllowed = getFirstBookableWeekMonday(now);
  const lastAllowed = getLastAllowedWeekMonday(now);

  const normalized = String(weekStart || '').trim();
  if (!normalized) {
    return firstAllowed;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new BadRequestException('weekStart phải có định dạng YYYY-MM-DD');
  }

  const parsed = createUtcDate(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException('weekStart không hợp lệ');
  }

  const monday = getMondayOfDateUtc(parsed);
  if (toDateKey(monday) !== normalized) {
    throw new BadRequestException('weekStart phải là thứ Hai của tuần');
  }

  if (monday.getTime() < firstAllowed.getTime() || monday.getTime() > lastAllowed.getTime()) {
    throw new BadRequestException('weekStart nằm ngoài khoảng đặt phòng cho phép');
  }

  return monday;
}

function buildFullName(firstName?: string | null, lastName?: string | null) {
  return [lastName, firstName].filter(Boolean).join(' ').trim();
}

@Injectable()
export class RoomBookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoomBooking(userId: string, dto: CreateRoomBookingDto) {
    const roomCode = String(dto.roomCode || '').trim().toUpperCase();
    const bookingDate = parseBookingDate(dto.bookingDate);
    assertBookingDateAllowedForRoomBooking(bookingDate);

    const [room, selectedTimeSlots] = await Promise.all([
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
      this.getSelectedTimeSlots(dto.timeSlotIds),
    ]);

    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }

    const selectedTimeSlotIds = selectedTimeSlots.map((timeSlot) => timeSlot.id);
    const conflictingSlot = await this.findConflictingSlot(
      room.id,
      bookingDate,
      selectedTimeSlotIds,
    );

    if (conflictingSlot) {
      throw new ConflictException(
        this.buildCreateConflictMessage(conflictingSlot.timeSlot?.label),
      );
    }

    let booking: { id: string } | null = null;
    try {
      booking = await this.createPendingBooking(
        room.id,
        userId,
        bookingDate,
        selectedTimeSlots,
        dto,
      );
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        const releasedInactiveSlots = await this.releaseInactiveSlotConstraints(
          room.id,
          bookingDate,
          selectedTimeSlotIds,
        );

        if (releasedInactiveSlots) {
          try {
            booking = await this.createPendingBooking(
              room.id,
              userId,
              bookingDate,
              selectedTimeSlots,
              dto,
            );
          } catch (retryError) {
            if (!this.isUniqueConstraintError(retryError)) {
              throw retryError;
            }
          }
        }

        if (booking) {
          return this.getBookingById(booking.id);
        }

        const raceConflictingSlot = await this.findConflictingSlot(
          room.id,
          bookingDate,
          selectedTimeSlotIds,
        );
        throw new ConflictException(
          this.buildCreateConflictMessage(raceConflictingSlot?.timeSlot?.label),
        );
      }
      throw error;
    }

    if (!booking) {
      throw new ConflictException('Không thể tạo yêu cầu đặt phòng.');
    }

    return this.getBookingById(booking.id);
  }

  async getBuildingRooms(buildingCode: string, filters: RoomListFilters = {}) {
    const normalizedBuildingCode = String(buildingCode || '').trim().toUpperCase();
    if (!normalizedBuildingCode) {
      return [];
    }

    const { dateKey, timeKey } = getBangkokDateTimeParts();
    const today = createUtcDate(dateKey);

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
        roomBookingSlots: currentTimeSlot
          ? {
              where: {
                bookingDate: today,
                timeSlotId: currentTimeSlot.id,
                booking: {
                  status: { in: OCCUPYING_BOOKING_STATUSES },
                },
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
        status: this.resolveRoomStatus(room.roomBookingSlots),
      }))
      .sort((left, right) => ROOM_CODE_COLLATOR.compare(left.roomCode, right.roomCode));
  }

  async getRoomSchedule(roomCode: string, weekStart?: string) {
    const normalizedRoomCode = String(roomCode || '').trim().toUpperCase();
    if (!normalizedRoomCode) {
      throw new NotFoundException('Không tìm thấy phòng');
    }

    const monday = resolveScheduleWeekMonday(weekStart);
    const saturday = addUtcDays(monday, 5);
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
    });

    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }

    const [timeSlots, roomBookingSlots] = await Promise.all([
      this.prisma.timeSlot.findMany({
        orderBy: { slotNumber: 'asc' },
      }),
      this.prisma.roomBookingSlot.findMany({
        where: {
          roomId: room.id,
          bookingDate: {
            gte: monday,
            lte: saturday,
          },
          booking: {
            status: { in: OCCUPYING_BOOKING_STATUSES },
          },
        },
        select: {
          bookingDate: true,
          timeSlotId: true,
          booking: {
            select: {
              title: true,
            },
          },
        },
      }),
    ]);

    const bookingByDayAndSlot = new Map<string, { title: string | null }>();
    for (const slot of roomBookingSlots) {
      const dayOfWeek = getRoomBookingDayOfWeek(slot.bookingDate);
      if (dayOfWeek < 2 || dayOfWeek > 7) {
        continue;
      }

      const key = `${dayOfWeek}:${slot.timeSlotId}`;
      if (!bookingByDayAndSlot.has(key)) {
        bookingByDayAndSlot.set(key, { title: slot.booking.title });
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
      buildingCode: room.floor.building.code,
      buildingName: room.floor.building.name,
      weekStart: toDateKey(monday),
      days,
    };
  }

  async getBuildings() {
    const buildings = await this.prisma.building.findMany({
      orderBy: { code: 'asc' },
      select: {
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
      include: roomBookingInclude,
      orderBy: [{ bookingDate: 'desc' }, { createdAt: 'desc' }],
    });

    return bookings.map((booking) => this.mapBooking(booking));
  }

  async getAdminBookings(status?: RoomBookingStatus) {
    const bookings = await this.prisma.roomBooking.findMany({
      where: status ? { status } : undefined,
      include: {
        ...roomBookingInclude,
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
        fullName: buildFullName(booking.user.firstName, booking.user.lastName),
      },
    }));
  }

  async approveBooking(bookingId: string, approverId: string) {
    const booking = await this.prisma.roomBooking.findUnique({
      where: { id: bookingId },
      include: roomBookingInclude,
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy yêu cầu đặt phòng');
    }

    if (booking.status !== 'pending') {
      throw new BadRequestException('Chỉ có thể duyệt yêu cầu đang chờ');
    }

    const selectedTimeSlotIds = booking.bookingSlots.map((slot) => slot.timeSlotId);
    if (selectedTimeSlotIds.length === 0) {
      throw new BadRequestException('Yêu cầu đặt phòng chưa có khung giờ hợp lệ');
    }

    const hasConflict = await this.prisma.roomBookingSlot.findFirst({
      where: {
        bookingId: { not: booking.id },
        roomId: booking.roomId,
        bookingDate: booking.bookingDate,
        timeSlotId: { in: selectedTimeSlotIds },
        booking: {
          status: {
            in: OCCUPYING_BOOKING_STATUSES,
          },
        },
      },
      select: {
        timeSlot: {
          select: {
            label: true,
          },
        },
      },
    });

    if (hasConflict) {
      throw new ConflictException(
        hasConflict.timeSlot?.label
          ? `Khung giờ ${hasConflict.timeSlot.label} đã được sử dụng.`
          : 'Một hoặc nhiều khung giờ đã được sử dụng.',
      );
    }

    await this.prisma.roomBooking.update({
      where: { id: booking.id },
      data: {
        status: 'approved',
        approvedById: approverId,
        approvedAt: new Date(),
      },
    });

    return this.getBookingById(booking.id);
  }

  async rejectBooking(bookingId: string, approverId: string) {
    const booking = await this.prisma.roomBooking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy yêu cầu đặt phòng');
    }

    if (booking.status !== 'pending') {
      throw new BadRequestException('Chỉ có thể từ chối yêu cầu đang chờ');
    }

    await this.prisma.roomBooking.update({
      where: { id: booking.id },
      data: {
        status: 'rejected',
        approvedById: approverId,
        approvedAt: new Date(),
      },
    });

    return this.getBookingById(booking.id);
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
      throw new NotFoundException('Không tìm thấy yêu cầu đặt phòng');
    }

    if (!isAdmin && booking.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền hủy yêu cầu này');
    }

    if (booking.status === 'cancelled' || booking.status === 'rejected') {
      return this.getBookingById(booking.id);
    }

    await this.prisma.roomBooking.update({
      where: { id: booking.id },
      data: {
        status: 'cancelled',
      },
    });

    return this.getBookingById(booking.id);
  }

  private async getBookingById(bookingId: string) {
    const booking = await this.prisma.roomBooking.findUnique({
      where: { id: bookingId },
      include: roomBookingInclude,
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy yêu cầu đặt phòng');
    }

    return this.mapBooking(booking);
  }

  private async getSelectedTimeSlots(timeSlotIds: string[]) {
    const requestedTimeSlotIds = timeSlotIds
      .map((timeSlotId) => String(timeSlotId || '').trim())
      .filter(Boolean);

    if (requestedTimeSlotIds.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một khung giờ');
    }

    if (new Set(requestedTimeSlotIds).size !== requestedTimeSlotIds.length) {
      throw new BadRequestException('Danh sách khung giờ không được trùng nhau');
    }

    const timeSlots = await this.prisma.timeSlot.findMany({
      where: {
        id: {
          in: requestedTimeSlotIds,
        },
      },
      orderBy: {
        slotNumber: 'asc',
      },
      select: {
        id: true,
        slotNumber: true,
        label: true,
        startTime: true,
        endTime: true,
      },
    });

    if (timeSlots.length !== requestedTimeSlotIds.length) {
      throw new NotFoundException('Không tìm thấy một hoặc nhiều tiết học');
    }

    const orderedTimeSlotIds = timeSlots.map((timeSlot) => timeSlot.id);
    const isCorrectOrder = requestedTimeSlotIds.every(
      (timeSlotId, index) => timeSlotId === orderedTimeSlotIds[index],
    );

    if (!isCorrectOrder) {
      throw new BadRequestException('Các khung giờ phải được gửi theo đúng thứ tự liên tiếp');
    }

    for (let index = 1; index < timeSlots.length; index += 1) {
      const currentTimeSlot = timeSlots[index]!;
      const previousTimeSlot = timeSlots[index - 1]!;
      if (currentTimeSlot.slotNumber !== previousTimeSlot.slotNumber + 1) {
        throw new BadRequestException('Chỉ được chọn các khung giờ liền kề trong cùng một yêu cầu');
      }
    }

    return timeSlots as SelectedTimeSlot[];
  }

  private async createPendingBooking(
    roomId: string,
    userId: string,
    bookingDate: Date,
    selectedTimeSlots: SelectedTimeSlot[],
    dto: CreateRoomBookingDto,
  ) {
    const firstTimeSlot = selectedTimeSlots[0]!;
    const lastTimeSlot = selectedTimeSlots[selectedTimeSlots.length - 1]!;

    return this.prisma.$transaction(async (tx) => {
      const createdBooking = await tx.roomBooking.create({
        data: {
          roomId,
          userId,
          bookingDate,
          timeSlotId: firstTimeSlot.id,
          startTime: firstTimeSlot.startTime,
          endTime: lastTimeSlot.endTime,
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
        },
      });

      for (const [index, timeSlot] of selectedTimeSlots.entries()) {
        await tx.roomBookingSlot.create({
          data: {
            bookingId: createdBooking.id,
            roomId,
            bookingDate,
            timeSlotId: timeSlot.id,
            slotOrder: index + 1,
          },
        });
      }

      return createdBooking;
    });
  }

  private mapBooking(booking: RoomBookingWithRelations) {
    const timeSlots = booking.bookingSlots
      .map((slot) => slot.timeSlot)
      .sort((left, right) => left.slotNumber - right.slotNumber);

    return {
      id: booking.id,
      roomCode: booking.room.roomCode,
      roomName: booking.room.name,
      buildingCode: booking.room.floor.building.code,
      buildingName: booking.room.floor.building.name,
      bookingDate: toDateKey(booking.bookingDate),
      timeSlotIds: timeSlots.map((timeSlot) => timeSlot.id),
      timeSlots,
      slotCount: timeSlots.length,
      startTime: booking.startTime,
      endTime: booking.endTime,
      title: booking.title,
      purpose: booking.purpose,
      attendeeCount: booking.attendeeCount,
      contactName: booking.contactName,
      contactPhone: booking.contactPhone,
      departmentName: booking.departmentName,
      notes: booking.notes,
      status: booking.status,
      approvedAt: booking.approvedAt?.toISOString() ?? null,
      createdAt: booking.createdAt.toISOString(),
    };
  }

  private resolveRoomStatus(
    roomBookingSlots: Array<{ id: string }> | undefined,
  ): RoomAvailabilityStatus {
    return roomBookingSlots && roomBookingSlots.length > 0
      ? ROOM_OCCUPIED_STATUS
      : ROOM_AVAILABLE_STATUS;
  }

  private buildCreateConflictMessage(timeSlotLabel?: string | null) {
    return timeSlotLabel
      ? `Khung giờ ${timeSlotLabel} đã có yêu cầu đặt phòng.`
      : 'Một hoặc nhiều khung giờ đã có yêu cầu đặt phòng.';
  }

  private async findConflictingSlot(
    roomId: string,
    bookingDate: Date,
    timeSlotIds: string[],
  ) {
    return this.prisma.roomBookingSlot.findFirst({
      where: {
        roomId,
        bookingDate,
        timeSlotId: {
          in: timeSlotIds,
        },
        booking: {
          status: {
            in: CONFLICT_BOOKING_STATUSES,
          },
        },
      },
      select: {
        timeSlot: {
          select: {
            label: true,
          },
        },
      },
    });
  }

  private async releaseInactiveSlotConstraints(
    roomId: string,
    bookingDate: Date,
    timeSlotIds: string[],
  ) {
    const inactiveBookings = await this.prisma.roomBooking.findMany({
      where: {
        roomId,
        bookingDate,
        status: {
          in: INACTIVE_BOOKING_STATUSES,
        },
        OR: [
          {
            timeSlotId: {
              in: timeSlotIds,
            },
          },
          {
            bookingSlots: {
              some: {
                timeSlotId: {
                  in: timeSlotIds,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (inactiveBookings.length === 0) {
      return false;
    }

    const inactiveBookingIds = inactiveBookings.map((booking) => booking.id);

    await this.prisma.$transaction([
      this.prisma.roomBookingSlot.deleteMany({
        where: {
          bookingId: {
            in: inactiveBookingIds,
          },
          timeSlotId: {
            in: timeSlotIds,
          },
        },
      }),
      this.prisma.roomBooking.updateMany({
        where: {
          id: {
            in: inactiveBookingIds,
          },
          timeSlotId: {
            in: timeSlotIds,
          },
        },
        data: {
          timeSlotId: null,
        },
      }),
    ]);

    return true;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return Boolean(
      error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: unknown }).code === 'P2002',
    );
  }
}
