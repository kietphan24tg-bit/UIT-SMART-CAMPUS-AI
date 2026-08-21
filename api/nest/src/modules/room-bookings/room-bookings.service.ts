import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import type { Prisma, RoomBookingStatus, RoomStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type {
  ClassMeetingOverrideDto,
  CreateRoomScheduleOverrideDto,
  MoveClassMeetingDto,
  RejectRoomBookingSlotDto,
  UpdateRoomScheduleOverrideDto,
} from './dto/admin-room-booking.dto';
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
  status: 'free' | 'occupied' | 'available_later';
  source: 'semester' | 'booking' | 'override' | null;
  title: string | null;
  subtitle: string | null;
  bookingId: string | null;
  classSectionId: string | null;
  overrideId?: string | null;
  classMeetingId?: string | null;
  editable?: boolean;
  bookable: boolean;
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
const INACTIVE_BOOKING_STATUSES: RoomBookingStatus[] = ['rejected', 'cancelled'];
const CREATED_BOOKING_STATUS: RoomBookingStatus = 'pending';
const EMPTY_ROOM_SCHEDULE_TEXT = 'Trống';
const ROOM_AVAILABLE_STATUS: RoomAvailabilityStatus = 'Trống hiện tại';
const ROOM_OCCUPIED_STATUS: RoomAvailabilityStatus = 'Đang được sử dụng';
const APPROVAL_REJECT_NOTE = 'Slot đã được duyệt cho yêu cầu khác';
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

function normalizeRoomText(value?: string | null) {
  return String(value || '').trim().toUpperCase();
}

function isDateWithinRange(date: Date, startDate: Date, endDate: Date) {
  return date.getTime() >= startDate.getTime() && date.getTime() <= endDate.getTime();
}

@Injectable()
export class RoomBookingsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

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
      room.roomCode,
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
          room.roomCode,
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

    const [timeSlots, roomBookingSlots, classMeetings] = await Promise.all([
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
          bookingId: true,
          bookingDate: true,
          timeSlotId: true,
          booking: {
            select: {
              title: true,
              purpose: true,
              contactName: true,
            },
          },
        },
      }),
      this.prisma.classMeeting.findMany({
        where: {
          room: {
            equals: normalizedRoomCode,
            mode: 'insensitive',
          },
          classSection: {
            semester: {
              startDate: { lte: saturday },
              endDate: { gte: monday },
            },
          },
        },
        select: {
          id: true,
          dayOfWeek: true,
          startPeriod: true,
          endPeriod: true,
          startTime: true,
          endTime: true,
          classSection: {
            select: {
              id: true,
              classCode: true,
              course: {
                select: {
                  code: true,
                  name: true,
                },
              },
              semester: {
                select: {
                  startDate: true,
                  endDate: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const classMeetingIds = classMeetings.map((meeting) => meeting.id);
    const roomScheduleOverrides = await this.prisma.roomScheduleOverride.findMany({
      where: {
        overrideDate: {
          gte: monday,
          lte: saturday,
        },
        OR: [
          { roomId: room.id },
          ...(classMeetingIds.length > 0
            ? [{ sourceClassMeetingId: { in: classMeetingIds } }]
            : []),
        ],
      },
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
    });

    const bookingByDayAndSlot = new Map<
      string,
      { bookingId: string; title: string | null; subtitle: string | null }
    >();
    for (const slot of roomBookingSlots) {
      const dayOfWeek = getRoomBookingDayOfWeek(slot.bookingDate);
      if (dayOfWeek < 2 || dayOfWeek > 7) {
        continue;
      }

      const key = `${dayOfWeek}:${slot.timeSlotId}`;
      if (!bookingByDayAndSlot.has(key)) {
        bookingByDayAndSlot.set(key, {
          bookingId: slot.bookingId,
          title: slot.booking.title ?? slot.booking.contactName ?? 'Đã đặt',
          subtitle: slot.booking.purpose ?? null,
        });
      }
    }

    const cancelledOrMovedClassMeetingByDate = new Set<string>();
    const overrideByDayAndSlot = new Map<
      string,
      {
        overrideId: string;
        title: string;
        subtitle: string | null;
        type: string;
        sourceClassMeetingId: string | null;
      }
    >();

    for (const override of roomScheduleOverrides) {
      const overrideDateKey = toDateKey(override.overrideDate);
      if (
        override.sourceClassMeetingId &&
        (override.type === 'cancel_class' || override.type === 'move_class')
      ) {
        cancelledOrMovedClassMeetingByDate.add(
          `${overrideDateKey}:${override.sourceClassMeetingId}`,
        );
      }

      if (override.roomId !== room.id || override.type === 'cancel_class') {
        continue;
      }

      const dayOfWeek = getRoomBookingDayOfWeek(override.overrideDate);
      if (dayOfWeek < 2 || dayOfWeek > 7) {
        continue;
      }

      const key = `${dayOfWeek}:${override.timeSlotId}`;
      overrideByDayAndSlot.set(key, {
        overrideId: override.id,
        title: override.title,
        subtitle: override.note,
        type: override.type,
        sourceClassMeetingId: override.sourceClassMeetingId,
      });
    }

    const classMeetingByDayAndSlot = new Map<
      string,
      { classMeetingId: string; classSectionId: string; title: string; subtitle: string | null }
    >();
    for (const meeting of classMeetings) {
      if (meeting.dayOfWeek < 2 || meeting.dayOfWeek > 7) {
        continue;
      }

      const meetingDate = getDateByDayOfWeek(monday, meeting.dayOfWeek);
      if (
        !isDateWithinRange(
          meetingDate,
          meeting.classSection.semester.startDate,
          meeting.classSection.semester.endDate,
        )
      ) {
        continue;
      }

      if (cancelledOrMovedClassMeetingByDate.has(`${toDateKey(meetingDate)}:${meeting.id}`)) {
        continue;
      }

      const matchingTimeSlots = timeSlots.filter((timeSlot) => {
        if (meeting.startPeriod != null && meeting.endPeriod != null) {
          return (
            timeSlot.slotNumber >= meeting.startPeriod &&
            timeSlot.slotNumber <= meeting.endPeriod
          );
        }

        return timeSlot.startTime >= meeting.startTime && timeSlot.endTime <= meeting.endTime;
      });

      for (const timeSlot of matchingTimeSlots) {
        const key = `${meeting.dayOfWeek}:${timeSlot.id}`;
        if (!classMeetingByDayAndSlot.has(key)) {
          classMeetingByDayAndSlot.set(key, {
            classMeetingId: meeting.id,
            classSectionId: meeting.classSection.id,
            title: meeting.classSection.classCode || meeting.classSection.course.code,
            subtitle: meeting.classSection.course.name || meeting.classSection.course.code,
          });
        }
      }
    }

    const days: RoomScheduleDay[] = FIXED_ROOM_SCHEDULE_DAYS.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      dateKey: toDateKey(getDateByDayOfWeek(monday, day.dayOfWeek)),
      label: day.label,
      slots: timeSlots.map((timeSlot) => {
        const key = `${day.dayOfWeek}:${timeSlot.id}`;
        const override = overrideByDayAndSlot.get(key);
        if (override) {
          return {
            timeSlotId: timeSlot.id,
            slotNumber: timeSlot.slotNumber,
            label: timeSlot.label,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            status: 'occupied' as const,
            source: 'override' as const,
            title: override.title,
            subtitle: override.subtitle,
            bookingId: null,
            classSectionId: null,
            overrideId: override.overrideId,
            classMeetingId: override.sourceClassMeetingId,
            editable: true,
            bookable: false,
          };
        }

        const classMeeting = classMeetingByDayAndSlot.get(key);
        if (classMeeting) {
          return {
            timeSlotId: timeSlot.id,
            slotNumber: timeSlot.slotNumber,
            label: timeSlot.label,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            status: 'occupied' as const,
            source: 'semester' as const,
            title: classMeeting.title,
            subtitle: classMeeting.subtitle,
            bookingId: null,
            classSectionId: classMeeting.classSectionId,
            overrideId: null,
            classMeetingId: classMeeting.classMeetingId,
            editable: true,
            bookable: false,
          };
        }

        const booking = bookingByDayAndSlot.get(key);
        if (booking) {
          return {
            timeSlotId: timeSlot.id,
            slotNumber: timeSlot.slotNumber,
            label: timeSlot.label,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            status: 'occupied' as const,
            source: 'booking' as const,
            title: booking.title,
            subtitle: booking.subtitle,
            bookingId: booking.bookingId,
            classSectionId: null,
            overrideId: null,
            classMeetingId: null,
            editable: true,
            bookable: false,
          };
        }

        return {
          timeSlotId: timeSlot.id,
          slotNumber: timeSlot.slotNumber,
          label: timeSlot.label,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          status: 'free' as const,
          source: null,
          title: null,
          subtitle: null,
          bookingId: null,
          classSectionId: null,
          overrideId: null,
          classMeetingId: null,
          editable: true,
          bookable: true,
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

  async getAdminRequestRooms(status: RoomBookingStatus = 'pending') {
    const bookings = await this.prisma.roomBooking.findMany({
      where: { status },
      select: {
        id: true,
        bookingDate: true,
        room: {
          select: {
            roomCode: true,
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
        bookingSlots: {
          select: {
            timeSlotId: true,
          },
        },
      },
    });

    const grouped = new Map<
      string,
      {
        roomCode: string;
        buildingCode: string;
        buildingName: string;
        requestIds: Set<string>;
        slotKeys: Set<string>;
      }
    >();

    for (const booking of bookings) {
      const roomCode = booking.room.roomCode;
      const existing =
        grouped.get(roomCode) ??
        {
          roomCode,
          buildingCode: booking.room.floor.building.code,
          buildingName: booking.room.floor.building.name,
          requestIds: new Set<string>(),
          slotKeys: new Set<string>(),
        };

      existing.requestIds.add(booking.id);
      for (const slot of booking.bookingSlots) {
        existing.slotKeys.add(`${toDateKey(booking.bookingDate)}:${slot.timeSlotId}`);
      }
      grouped.set(roomCode, existing);
    }

    return Array.from(grouped.values())
      .map((entry) => ({
        roomCode: entry.roomCode,
        buildingCode: entry.buildingCode,
        buildingName: entry.buildingName,
        pendingRequestCount: entry.requestIds.size,
        pendingSlotCount: entry.slotKeys.size,
      }))
      .sort((left, right) => ROOM_CODE_COLLATOR.compare(left.roomCode, right.roomCode));
  }

  async getAdminRoomRequestSlots(roomCode: string, status: RoomBookingStatus = 'pending') {
    const room = await this.prisma.room.findFirst({
      where: {
        roomCode: normalizeRoomText(roomCode),
      },
      select: {
        id: true,
        roomCode: true,
      },
    });

    if (!room) {
      throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y phÃ²ng');
    }

    const slots = await this.prisma.roomBookingSlot.findMany({
      where: {
        roomId: room.id,
        booking: { status },
      },
      include: {
        timeSlot: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        },
        booking: {
          select: {
            id: true,
          },
        },
      },
      orderBy: [{ bookingDate: 'asc' }, { timeSlot: { slotNumber: 'asc' } }],
    });

    const grouped = new Map<
      string,
      {
        bookingDate: string;
        startTime: string;
        endTime: string;
        timeSlotIds: string[];
        requestIds: Set<string>;
      }
    >();

    for (const slot of slots) {
      const bookingDate = toDateKey(slot.bookingDate);
      const key = `${bookingDate}:${slot.timeSlotId}`;
      const existing =
        grouped.get(key) ??
        {
          bookingDate,
          startTime: slot.timeSlot.startTime,
          endTime: slot.timeSlot.endTime,
          timeSlotIds: [slot.timeSlotId],
          requestIds: new Set<string>(),
        };
      existing.requestIds.add(slot.booking.id);
      grouped.set(key, existing);
    }

    return {
      roomCode: room.roomCode,
      slots: Array.from(grouped.values()).map((entry) => ({
        bookingDate: entry.bookingDate,
        startTime: entry.startTime,
        endTime: entry.endTime,
        timeSlotIds: entry.timeSlotIds,
        requestCount: entry.requestIds.size,
      })),
    };
  }

  async getAdminSlotRequests(roomCode: string, dateKey: string, timeSlotId: string) {
    const bookingDate = parseBookingDate(dateKey);
    const room = await this.prisma.room.findFirst({
      where: { roomCode: normalizeRoomText(roomCode) },
      select: {
        id: true,
        roomCode: true,
      },
    });

    if (!room) {
      throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y phÃ²ng');
    }

    const timeSlot = await this.prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
    });

    if (!timeSlot) {
      throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y khung giá»');
    }

    const bookings = await this.prisma.roomBooking.findMany({
      where: {
        roomId: room.id,
        bookingDate,
        status: 'pending',
        bookingSlots: {
          some: {
            timeSlotId,
          },
        },
      },
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
      orderBy: { createdAt: 'asc' },
    });

    return {
      roomCode: room.roomCode,
      bookingDate: dateKey,
      timeSlot,
      requests: bookings.map((booking) => ({
        ...this.mapBooking(booking),
        requester: {
          id: booking.user.id,
          email: booking.user.email,
          fullName: buildFullName(booking.user.firstName, booking.user.lastName),
        },
      })),
    };
  }

  async rejectSlotRequests(dto: RejectRoomBookingSlotDto, approverId: string) {
    const room = await this.prisma.room.findFirst({
      where: { roomCode: normalizeRoomText(dto.roomCode) },
      select: { id: true },
    });

    if (!room) {
      throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y phÃ²ng');
    }

    const bookingDate = parseBookingDate(dto.bookingDate);
    await this.prisma.roomBooking.updateMany({
      where: {
        roomId: room.id,
        bookingDate,
        status: 'pending',
        bookingSlots: {
          some: {
            timeSlotId: {
              in: dto.timeSlotIds,
            },
          },
        },
      },
      data: {
        status: 'rejected',
        approvedById: approverId,
        approvedAt: new Date(),
        notes: dto.reason?.trim() || null,
      },
    });

    return this.getAdminRoomRequestSlots(dto.roomCode, 'pending');
  }

  async createScheduleOverride(dto: CreateRoomScheduleOverrideDto, adminId: string) {
    const [room, timeSlot] = await Promise.all([
      this.prisma.room.findFirst({
        where: { roomCode: normalizeRoomText(dto.roomCode), status: ACTIVE_ROOM_STATUS },
        select: { id: true, roomCode: true },
      }),
      this.prisma.timeSlot.findUnique({
        where: { id: dto.timeSlotId },
        select: { id: true, startTime: true, endTime: true },
      }),
    ]);

    if (!room) {
      throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y phÃ²ng');
    }
    if (!timeSlot) {
      throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y khung giá»');
    }

    const override = await this.prisma.roomScheduleOverride.create({
      data: {
        roomId: room.id,
        overrideDate: parseBookingDate(dto.overrideDate),
        timeSlotId: timeSlot.id,
        type: dto.type,
        title: dto.title.trim(),
        note: dto.note?.trim() || null,
        createdById: adminId,
      },
    });

    if (dto.type === 'maintenance') {
      await this.notifyAffectedClassMeetingsForRoomOverride({
        roomCode: room.roomCode,
        overrideDate: override.overrideDate,
        timeSlotId: override.timeSlotId,
        overrideType: override.type,
        roomLabel: room.roomCode,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        note: override.note,
      });
    }

    return this.mapScheduleOverride(override);
  }

  async updateScheduleOverride(overrideId: string, dto: UpdateRoomScheduleOverrideDto) {
    const existing = await this.prisma.roomScheduleOverride.findUnique({
      where: { id: overrideId },
      select: {
        id: true,
        roomId: true,
        overrideDate: true,
        timeSlotId: true,
        type: true,
        sourceClassMeetingId: true,
        room: { select: { roomCode: true } },
        timeSlot: { select: { startTime: true, endTime: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y lá»‹ch admin');
    }

    const updated = await this.prisma.roomScheduleOverride.update({
      where: { id: overrideId },
      data: {
        ...(dto.title != null ? { title: dto.title.trim() } : {}),
        ...(dto.note != null ? { note: dto.note.trim() || null } : {}),
      },
    });

    await this.notifyScheduleOverrideUpdate(existing, updated.note);

    return this.mapScheduleOverride(updated);
  }

  async deleteScheduleOverride(overrideId: string) {
    const existing = await this.prisma.roomScheduleOverride.findUnique({
      where: { id: overrideId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y lá»‹ch admin');
    }

    await this.prisma.roomScheduleOverride.delete({ where: { id: overrideId } });
    return { id: overrideId, deleted: true };
  }

  async cancelClassMeetingOccurrence(
    classMeetingId: string,
    dto: ClassMeetingOverrideDto,
    adminId: string,
  ) {
    const meeting = await this.getClassMeetingForOverride(classMeetingId);
    const overrideDate = parseBookingDate(dto.overrideDate);
    const dayOfWeek = getRoomBookingDayOfWeek(overrideDate);
    if (dayOfWeek !== meeting.dayOfWeek) {
      throw new BadRequestException('NgÃ y há»§y khÃ´ng khá»›p thá»© cá»§a lá»‹ch há»c');
    }

    const timeSlot = await this.resolveClassMeetingFirstTimeSlot(meeting);
    const room = await this.getRoomByCodeOrThrow(meeting.room);
    const override = await this.prisma.roomScheduleOverride.create({
      data: {
        roomId: room.id,
        overrideDate,
        timeSlotId: timeSlot.id,
        type: 'cancel_class',
        title: meeting.classSection.classCode,
        note: dto.note?.trim() || null,
        sourceClassMeetingId: meeting.id,
        createdById: adminId,
      },
    });

    await this.notifyClassScheduleOverride(meeting, {
      overrideDate,
      timeSlotId: timeSlot.id,
      overrideType: 'cancel_class',
      room: meeting.room,
      note: override.note,
    });

    return this.mapScheduleOverride(override);
  }

  async moveClassMeetingOccurrence(
    classMeetingId: string,
    dto: MoveClassMeetingDto,
    adminId: string,
  ) {
    const meeting = await this.getClassMeetingForOverride(classMeetingId);
    const overrideDate = parseBookingDate(dto.overrideDate);
    const dayOfWeek = getRoomBookingDayOfWeek(overrideDate);
    if (dayOfWeek !== meeting.dayOfWeek) {
      throw new BadRequestException('NgÃ y Ä‘iá»u chá»‰nh khÃ´ng khá»›p thá»© cá»§a lá»‹ch há»c');
    }

    const [room, timeSlot] = await Promise.all([
      this.getRoomByCodeOrThrow(dto.roomCode),
      this.prisma.timeSlot.findUnique({
        where: { id: dto.timeSlotId },
        select: { id: true },
      }),
    ]);

    if (!timeSlot) {
      throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y khung giá»');
    }

    const override = await this.prisma.roomScheduleOverride.create({
      data: {
        roomId: room.id,
        overrideDate,
        timeSlotId: timeSlot.id,
        type: 'move_class',
        title: meeting.classSection.classCode,
        note: dto.note?.trim() || null,
        sourceClassMeetingId: meeting.id,
        createdById: adminId,
      },
    });

    await this.notifyClassScheduleOverride(meeting, {
      overrideDate,
      timeSlotId: timeSlot.id,
      overrideType: 'move_class',
      room: room.roomCode,
      note: override.note,
    });

    return this.mapScheduleOverride(override);
  }

  private async approveBookingLegacy(bookingId: string, approverId: string) {
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

  async approveBooking(bookingId: string, approverId: string) {
    const booking = await this.prisma.roomBooking.findUnique({
      where: { id: bookingId },
      include: roomBookingInclude,
    });

    if (!booking) {
      throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y yÃªu cáº§u Ä‘áº·t phÃ²ng');
    }

    if (booking.status !== 'pending') {
      throw new BadRequestException('Chá»‰ cÃ³ thá»ƒ duyá»‡t yÃªu cáº§u Ä‘ang chá»');
    }

    const selectedTimeSlotIds = booking.bookingSlots.map((slot) => slot.timeSlotId);
    if (selectedTimeSlotIds.length === 0) {
      throw new BadRequestException('YÃªu cáº§u Ä‘áº·t phÃ²ng chÆ°a cÃ³ khung giá» há»£p lá»‡');
    }

    const roomCode = booking.room.roomCode;
    const bookingDate = booking.bookingDate;
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const latestBooking = await tx.roomBooking.findUnique({
        where: { id: booking.id },
        include: roomBookingInclude,
      });

      if (!latestBooking) {
        throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y yÃªu cáº§u Ä‘áº·t phÃ²ng');
      }

      if (latestBooking.status !== 'pending') {
        throw new BadRequestException('YÃªu cáº§u nÃ y khÃ´ng cÃ²n á»Ÿ tráº¡ng thÃ¡i chá» duyá»‡t');
      }

      const latestTimeSlotIds = latestBooking.bookingSlots.map((slot) => slot.timeSlotId);
      const conflictingSlot = await this.findConflictingSlot(
        latestBooking.roomId,
        roomCode,
        bookingDate,
        latestTimeSlotIds,
        tx,
        latestBooking.id,
      );

      if (conflictingSlot) {
        throw new ConflictException(
          this.buildApproveConflictMessage(conflictingSlot.timeSlot?.label),
        );
      }

      await tx.roomBooking.update({
        where: { id: latestBooking.id },
        data: {
          status: 'approved',
          approvedById: approverId,
          approvedAt: now,
          timeSlotId: latestBooking.bookingSlots[0]?.timeSlotId ?? null,
        },
      });

      const overlappingPendingBookings = await tx.roomBooking.findMany({
        where: {
          id: { not: latestBooking.id },
          roomId: latestBooking.roomId,
          bookingDate,
          status: 'pending',
          bookingSlots: {
            some: {
              timeSlotId: {
                in: latestTimeSlotIds,
              },
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (overlappingPendingBookings.length > 0) {
        await tx.roomBooking.updateMany({
          where: {
            id: {
              in: overlappingPendingBookings.map((item) => item.id),
            },
          },
          data: {
            status: 'rejected',
            approvedById: approverId,
            approvedAt: now,
            notes: APPROVAL_REJECT_NOTE,
          },
        });
      }
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

  async deleteOwnBooking(bookingId: string, userId: string) {
    const booking = await this.prisma.roomBooking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y yÃªu cáº§u Ä‘áº·t phÃ²ng');
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException('Báº¡n khÃ´ng cÃ³ quyá»n xÃ³a yÃªu cáº§u nÃ y');
    }

    await this.prisma.$transaction([
      this.prisma.roomBookingSlot.deleteMany({
        where: { bookingId: booking.id },
      }),
      this.prisma.roomBooking.delete({
        where: { id: booking.id },
      }),
    ]);

    return {
      id: booking.id,
      deleted: true,
    };
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

  private async notifyClassScheduleOverride(
    meeting: {
      id: string;
      room: string | null;
      startTime: string;
      endTime: string;
      classSection: {
        id: string;
        classCode: string;
        course: { code: string; name: string };
      };
    },
    override: {
      overrideDate: Date;
      timeSlotId: string;
      overrideType: string;
      room: string | null;
      note: string | null;
    },
  ) {
    if (!this.notificationsService) {
      return;
    }

    const isMove = override.overrideType === 'move_class';
    const dateKey = toDateKey(override.overrideDate);
    const roomLabel = override.room ?? meeting.room ?? '--';
    await this.notificationsService.createNotificationsForClassSection({
      classSectionId: meeting.classSection.id,
      title: isMove
        ? `Lịch học ${meeting.classSection.course.code} đổi phòng`
        : `Lịch học ${meeting.classSection.course.code} được cập nhật`,
      body: isMove
        ? `${meeting.classSection.classCode} chuyển sang phòng ${roomLabel} ngày ${dateKey}.`
        : `${meeting.classSection.classCode} có thay đổi lịch ngày ${dateKey}.`,
      type: 'schedule_update',
      data: {
        classSectionId: meeting.classSection.id,
        courseCode: meeting.classSection.course.code,
        courseName: meeting.classSection.course.name,
        classCode: meeting.classSection.classCode,
        room: roomLabel,
        date: dateKey,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        timeSlotId: override.timeSlotId,
        overrideType: override.overrideType,
        classMeetingId: meeting.id,
        note: override.note,
      },
    });
  }

  private async notifyAffectedClassMeetingsForRoomOverride(input: {
    roomCode: string;
    overrideDate: Date;
    timeSlotId: string;
    overrideType: string;
    roomLabel: string;
    startTime: string;
    endTime: string;
    note: string | null;
  }) {
    if (!this.notificationsService) {
      return;
    }

    const affectedMeetings = await this.findAffectedClassMeetingsForRoomOverride(
      input.roomCode,
      input.overrideDate,
      input.timeSlotId,
    );

    await Promise.all(
      affectedMeetings.map((meeting) =>
        this.notifyClassScheduleOverride(meeting, {
          overrideDate: input.overrideDate,
          timeSlotId: input.timeSlotId,
          overrideType: input.overrideType,
          room: input.roomLabel,
          note: input.note,
        }),
      ),
    );
  }

  private async notifyScheduleOverrideUpdate(
    existing: {
      roomId: string;
      overrideDate: Date;
      timeSlotId: string;
      type: string;
      sourceClassMeetingId: string | null;
      room: { roomCode: string };
      timeSlot: { startTime: string; endTime: string };
    },
    note: string | null,
  ) {
    if (!this.notificationsService) {
      return;
    }

    if (existing.sourceClassMeetingId) {
      const meeting = await this.getClassMeetingForOverride(existing.sourceClassMeetingId);
      await this.notifyClassScheduleOverride(meeting, {
        overrideDate: existing.overrideDate,
        timeSlotId: existing.timeSlotId,
        overrideType: existing.type,
        room: existing.room.roomCode,
        note,
      });
      return;
    }

    if (existing.type === 'maintenance') {
      await this.notifyAffectedClassMeetingsForRoomOverride({
        roomCode: existing.room.roomCode,
        overrideDate: existing.overrideDate,
        timeSlotId: existing.timeSlotId,
        overrideType: existing.type,
        roomLabel: existing.room.roomCode,
        startTime: existing.timeSlot.startTime,
        endTime: existing.timeSlot.endTime,
        note,
      });
    }
  }

  private async findAffectedClassMeetingsForRoomOverride(
    roomCode: string,
    overrideDate: Date,
    timeSlotId: string,
  ) {
    const timeSlot = await this.prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      select: {
        slotNumber: true,
        startTime: true,
        endTime: true,
      },
    });

    if (!timeSlot) {
      return [];
    }

    return this.prisma.classMeeting.findMany({
      where: {
        room: {
          equals: normalizeRoomText(roomCode),
          mode: 'insensitive',
        },
        dayOfWeek: getRoomBookingDayOfWeek(overrideDate),
        classSection: {
          semester: {
            startDate: { lte: overrideDate },
            endDate: { gte: overrideDate },
          },
        },
        OR: [
          {
            startPeriod: { not: null, lte: timeSlot.slotNumber },
            endPeriod: { not: null, gte: timeSlot.slotNumber },
          },
          {
            startPeriod: null,
            endPeriod: null,
            startTime: { lte: timeSlot.startTime },
            endTime: { gte: timeSlot.endTime },
          },
        ],
      },
      select: {
        id: true,
        room: true,
        startTime: true,
        endTime: true,
        classSection: {
          select: {
            id: true,
            classCode: true,
            course: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  private async getRoomByCodeOrThrow(roomCode?: string | null) {
    const normalizedRoomCode = normalizeRoomText(roomCode);
    if (!normalizedRoomCode) {
      throw new BadRequestException('Lá»‹ch há»c chÆ°a cÃ³ phÃ²ng há»£p lá»‡');
    }

    const room = await this.prisma.room.findFirst({
      where: {
        roomCode: normalizedRoomCode,
        status: ACTIVE_ROOM_STATUS,
      },
      select: {
        id: true,
        roomCode: true,
      },
    });

    if (!room) {
      throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y phÃ²ng');
    }

    return room;
  }

  private async getClassMeetingForOverride(classMeetingId: string) {
    const meeting = await this.prisma.classMeeting.findUnique({
      where: { id: classMeetingId },
      select: {
        id: true,
        dayOfWeek: true,
        room: true,
        startPeriod: true,
        endPeriod: true,
        startTime: true,
        endTime: true,
        classSection: {
          select: {
            id: true,
            classCode: true,
            course: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!meeting) {
      throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y lá»‹ch há»c');
    }

    return meeting;
  }

  private async resolveClassMeetingFirstTimeSlot(meeting: {
    startPeriod: number | null;
    startTime: string;
    endTime: string;
  }) {
    const timeSlot = await this.prisma.timeSlot.findFirst({
      where:
        meeting.startPeriod != null
          ? { slotNumber: meeting.startPeriod }
          : {
              startTime: {
                gte: meeting.startTime,
              },
              endTime: {
                lte: meeting.endTime,
              },
            },
      orderBy: { slotNumber: 'asc' },
      select: { id: true },
    });

    if (!timeSlot) {
      throw new NotFoundException('KhÃ´ng tÃ¬m tháº¥y khung giá» cá»§a lá»‹ch há»c');
    }

    return timeSlot;
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
          timeSlotId: null,
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

  private buildApproveConflictMessage(timeSlotLabel?: string | null) {
    return timeSlotLabel
      ? `Khung giá» ${timeSlotLabel} Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng.`
      : 'Má»™t hoáº·c nhiá»u khung giá» Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng.';
  }

  private mapScheduleOverride(override: {
    id: string;
    roomId: string;
    overrideDate: Date;
    timeSlotId: string;
    type: string;
    title: string;
    note: string | null;
    sourceClassMeetingId: string | null;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: override.id,
      roomId: override.roomId,
      overrideDate: toDateKey(override.overrideDate),
      timeSlotId: override.timeSlotId,
      type: override.type,
      title: override.title,
      note: override.note,
      sourceClassMeetingId: override.sourceClassMeetingId,
      createdById: override.createdById,
      createdAt: override.createdAt.toISOString(),
      updatedAt: override.updatedAt.toISOString(),
    };
  }

  private async findConflictingSlot(
    roomId: string,
    roomCode: string,
    bookingDate: Date,
    timeSlotIds: string[],
    prismaClient: Pick<
      PrismaService,
      'roomBookingSlot' | 'classMeeting' | 'timeSlot' | 'roomScheduleOverride'
    > = this.prisma,
    excludedBookingId?: string,
  ) {
    const selectedTimeSlots = await prismaClient.timeSlot.findMany({
      where: {
        id: {
          in: timeSlotIds,
        },
      },
      select: {
        id: true,
        slotNumber: true,
        startTime: true,
        endTime: true,
      },
    });

    const overrideConflict = await prismaClient.roomScheduleOverride.findFirst({
      where: {
        roomId,
        overrideDate: bookingDate,
        timeSlotId: {
          in: timeSlotIds,
        },
        type: {
          in: ['manual', 'maintenance', 'move_class'],
        },
      },
      select: {
        title: true,
      },
    });

    if (overrideConflict) {
      return {
        timeSlot: {
          label: overrideConflict.title,
        },
      };
    }

    const fixedScheduleConflict = await prismaClient.classMeeting.findFirst({
      where: {
        room: {
          equals: normalizeRoomText(roomCode),
          mode: 'insensitive',
        },
        dayOfWeek: getRoomBookingDayOfWeek(bookingDate),
        classSection: {
          semester: {
            startDate: { lte: bookingDate },
            endDate: { gte: bookingDate },
          },
        },
        OR: selectedTimeSlots.map((timeSlot) => ({
          OR: [
            {
              startPeriod: { not: null, lte: timeSlot.slotNumber },
              endPeriod: { not: null, gte: timeSlot.slotNumber },
            },
            {
              startPeriod: null,
              endPeriod: null,
              startTime: { lte: timeSlot.startTime },
              endTime: { gte: timeSlot.endTime },
            },
          ],
        })),
      },
      select: {
        id: true,
        classSection: {
          select: {
            classCode: true,
          },
        },
      },
    });

    if (fixedScheduleConflict) {
      const classOverride = await prismaClient.roomScheduleOverride.findFirst({
        where: {
          sourceClassMeetingId: fixedScheduleConflict.id,
          overrideDate: bookingDate,
          type: {
            in: ['cancel_class', 'move_class'],
          },
        },
        select: {
          id: true,
        },
      });

      if (classOverride) {
        return null;
      }

      return {
        timeSlot: {
          label: fixedScheduleConflict.classSection.classCode || 'Lá»‹ch cá»‘ Ä‘á»‹nh',
        },
      };
    }

    return prismaClient.roomBookingSlot.findFirst({
      where: {
        roomId,
        bookingDate,
        timeSlotId: {
          in: timeSlotIds,
        },
        booking: {
          ...(excludedBookingId ? { id: { not: excludedBookingId } } : {}),
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
  }

  private async findConflictingSlotLegacy(
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
