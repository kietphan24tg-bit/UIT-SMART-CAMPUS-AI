/* eslint-disable no-console */
/**
 * Lịch phòng theo lưỡi time_slot (T2–T7, tuần hiện tại theo giờ Bangkok).
 * Ô còn trống: "Trống". Ô có RoomBooking: tiêu đề / mục đích.
 *
 *   corepack pnpm --filter api run db:export:mobile-room-mock
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import { config as loadEnv } from 'dotenv';
import type { Prisma } from '@prisma/client';
import { PrismaClient, type RoomBookingStatus } from '@prisma/client';

loadEnv({ path: path.join(__dirname, '../.env') });
loadEnv({ path: path.join(__dirname, '../../../.env') });

const prisma = new PrismaClient();

const OUT_FILE = path.join(
  __dirname,
  '../../mobile/constants/room-booking-schedule.generated.ts',
);

const BANGKOK_TIME_ZONE = 'Asia/Bangkok';

const FIXED_DAYS = [
  { dayOfWeek: 2, label: 'Th2', name: 'mon' as const },
  { dayOfWeek: 3, label: 'Th3', name: 'tue' as const },
  { dayOfWeek: 4, label: 'Th4', name: 'wed' as const },
  { dayOfWeek: 5, label: 'Th5', name: 'thu' as const },
  { dayOfWeek: 6, label: 'Th6', name: 'fri' as const },
  { dayOfWeek: 7, label: 'Th7', name: 'sat' as const },
];

type DayKey = (typeof FIXED_DAYS)[number]['name'];

function getBangkokDateKey(now = new Date()): string {
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
  ) as Record<'year' | 'month' | 'day', string>;
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function createUtcDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getCurrentBangkokWeekMonday(now = new Date()) {
  const dateKey = getBangkokDateKey(now);
  const currentDate = createUtcDate(dateKey);
  const utcDay = currentDate.getUTCDay();
  const isoDay = utcDay === 0 ? 7 : utcDay;
  return addUtcDays(currentDate, 1 - isoDay);
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDateByDayOfWeek(monday: Date, dayOfWeek: number) {
  return addUtcDays(monday, dayOfWeek - 2);
}

function timeRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
) {
  return startA < endB && startB < endA;
}

type MobileSlot = {
  id: string;
  startTime: string;
  endTime: string;
  status: 'free' | 'occupied' | 'available_later';
  label: string;
  courseCode?: string;
};

type BookingRow = {
  id: string;
  roomId: string;
  bookingDate: Date;
  timeSlotId: string | null;
  startTime: string | null;
  endTime: string | null;
  title: string | null;
  purpose: string;
  status: RoomBookingStatus;
  room: { roomCode: string };
};

function bookingLabel(b: { title: string | null; purpose: string }) {
  return (b.title && b.title.trim()) || b.purpose.trim() || 'Đặt phòng';
}

function toTsString(value: string) {
  return JSON.stringify(value);
}

type EmitDay = {
  dayKey: DayKey;
  dateKey: string;
  label: string;
  slots: Array<{
    id: string;
    startTime: string;
    endTime: string;
    status: 'free' | 'occupied' | 'available_later';
    label: string;
    courseCode?: string;
  }>;
};

function emitRoomSchedules(data: Record<string, EmitDay[]>) {
  const roomCodes = Object.keys(data).sort((left, right) => left.localeCompare(right));
  const lines: string[] = [
    "import type { RoomScheduleDay } from '@/types/room-booking';",
    '',
    '/**',
    ' * Tự sinh từ DB bởi `apps/api/scripts/export-mobile-room-schedule-mock.ts` — không sửa tay.',
    ' */',
    'export const ROOM_SCHEDULES_FROM_DB: Record<string, RoomScheduleDay[]> = {',
  ];

  for (const code of roomCodes) {
    const days = data[code];
    if (!code || !days?.length) {
      continue;
    }
    lines.push(`  ${toTsString(code)}: [`);
    for (const day of days) {
      lines.push('    {');
      lines.push(`      dayKey: ${toTsString(day.dayKey)},`);
      if (day.dateKey) {
        lines.push(`      dateKey: ${toTsString(day.dateKey)},`);
      }
      lines.push(`      label: ${toTsString(day.label)},`);
      lines.push('      slots: [');
      for (const s of day.slots) {
        const slot = s;
        const parts = [
          '        {',
          `          id: ${toTsString(slot.id)},`,
          `          startTime: ${toTsString(slot.startTime)},`,
          `          endTime: ${toTsString(slot.endTime)},`,
          `          status: ${toTsString(slot.status)},`,
          `          label: ${toTsString(slot.label)},`,
        ];
        if (slot.courseCode) {
          parts.push(`          courseCode: ${toTsString(slot.courseCode)},`);
        }
        parts.push('        },');
        lines.push(...parts);
      }
      lines.push('      ],');
      lines.push('    },');
    }
    lines.push('  ],');
  }
  lines.push('};', '');
  return lines.join('\n');
}

function buildDaySlots(
  timeSlots: Array<{ id: string; startTime: string; endTime: string; label: string }>,
  list: BookingRow[],
): MobileSlot[] {
  const n = timeSlots.length;
  const status: Array<'free' | 'occupied'> = Array(n).fill('free');
  const text: (string | null)[] = Array(n).fill(null);
  const course: (string | undefined)[] = Array(n).fill(undefined);
  const takenTimeSlot = new Set<string>();
  const usedSlot = new Set<number>();

  for (const b of list) {
    if (b.timeSlotId) {
      const index = timeSlots.findIndex((ts) => ts.id === b.timeSlotId);
      if (index < 0) {
        continue;
      }
      if (takenTimeSlot.has(b.timeSlotId)) {
        continue;
      }
      takenTimeSlot.add(b.timeSlotId);
      status[index] = 'occupied';
      const t = b.title && b.title.trim() ? b.title.trim() : bookingLabel(b);
      text[index] = t;
      if (b.title && b.title.trim()) {
        course[index] = b.title.trim();
      }
      usedSlot.add(index);
    }
  }

  for (const b of list) {
    if (b.timeSlotId) {
      continue;
    }
    const s = b.startTime;
    const e = b.endTime;
    if (!s || !e) {
      continue;
    }
    const t = b.title && b.title.trim() ? b.title.trim() : bookingLabel(b);
    const cc = b.title && b.title.trim() ? b.title.trim() : undefined;
    for (let i = 0; i < n; i += 1) {
      if (usedSlot.has(i)) {
        continue;
      }
      const ts = timeSlots[i];
      if (!ts) {
        continue;
      }
      if (!timeRangesOverlap(s, e, ts.startTime, ts.endTime)) {
        continue;
      }
      status[i] = 'occupied';
      text[i] = t;
      if (cc) {
        course[i] = cc;
      }
      usedSlot.add(i);
    }
  }

  return timeSlots.map((ts, index) => {
    const isOcc = status[index] === 'occupied';
    const label = isOcc && text[index] != null ? text[index]! : 'Trống';
    return {
      id: ts.id,
      startTime: ts.startTime,
      endTime: ts.endTime,
      status: isOcc ? 'occupied' : 'free',
      label,
      ...(course[index] ? { courseCode: course[index] } : {}),
    } satisfies MobileSlot;
  });
}

async function main() {
  const monday = getCurrentBangkokWeekMonday();
  const [timeSlots, rooms, rawBookings] = await Promise.all([
    prisma.timeSlot.findMany({
      orderBy: { slotNumber: 'asc' },
      select: { id: true, startTime: true, endTime: true, label: true },
    }),
    prisma.room.findMany({
      where: { status: 'active' },
      select: { id: true, roomCode: true },
      orderBy: { roomCode: 'asc' },
    }),
    prisma.roomBooking.findMany({
      where: { room: { status: 'active' } },
      select: {
        id: true,
        roomId: true,
        bookingDate: true,
        timeSlotId: true,
        startTime: true,
        endTime: true,
        title: true,
        purpose: true,
        status: true,
        room: { select: { roomCode: true } },
      } satisfies Prisma.RoomBookingSelect,
    }),
  ]);

  if (!timeSlots.length) {
    throw new Error('Chưa có bảng time_slots — không thể tạo lưỡi lịch.');
  }

  const bookings = (rawBookings as unknown as BookingRow[]).filter(
    (row) => row.status !== 'cancelled' && row.status !== 'rejected',
  );

  const byRoomDate = new Map<string, BookingRow[]>();
  for (const b of bookings) {
    const dk = b.bookingDate.toISOString().slice(0, 10);
    const key = `${b.roomId}|${dk}`;
    if (!byRoomDate.has(key)) {
      byRoomDate.set(key, []);
    }
    byRoomDate.get(key)!.push(b);
  }

  const result: Record<string, EmitDay[]> = {};
  for (const room of rooms) {
    const code = room.roomCode.toUpperCase();
    const days: EmitDay[] = [];

    for (const d of FIXED_DAYS) {
      const date = getDateByDayOfWeek(monday, d.dayOfWeek);
      const dateKey = toDateKey(date);
      const list = byRoomDate.get(`${room.id}|${dateKey}`) ?? [];
      const slots = buildDaySlots(timeSlots, list);
      if (!slots.length) {
        continue;
      }
      days.push({
        dayKey: d.name,
        dateKey,
        label: d.label,
        slots: slots.map((s) => ({
          id: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          status: s.status,
          label: s.label,
          ...(s.courseCode ? { courseCode: s.courseCode } : {}),
        })),
      });
    }
    if (days.length) {
      result[code] = days;
    }
  }

  const out = emitRoomSchedules(result);
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, out, 'utf8');
  console.log(
    'Wrote',
    path.relative(path.join(__dirname, '../..'), OUT_FILE),
    'rooms:',
    Object.keys(result).length,
    'time slots:',
    timeSlots.length,
    'bookings (all statuses except cancelled/rejected):',
    bookings.length,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
