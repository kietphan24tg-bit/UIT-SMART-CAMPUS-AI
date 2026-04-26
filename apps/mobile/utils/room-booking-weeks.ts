import type { RoomScheduleDay } from '@/types/room-booking';

export const ROOM_BOOKING_MAX_WEEKS_AHEAD = 8;

const BANGKOK_TZ = 'Asia/Bangkok';

const ORDERED_DAY_KEYS: RoomScheduleDay['dayKey'][] = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
];

export function getBangkokDateKey(now = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BANGKOK_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(now)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  ) as Record<'year' | 'month' | 'day', string>;

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function getCurrentBangkokWeekMonday(now = new Date()): Date {
  const dateKey = getBangkokDateKey(now);
  const currentDate = new Date(`${dateKey}T00:00:00.000Z`);
  const utcDay = currentDate.getUTCDay();
  const isoDay = utcDay === 0 ? 7 : utcDay;
  return addUtcDays(currentDate, 1 - isoDay);
}

export function getFirstBookableWeekMonday(now = new Date()): Date {
  return addUtcDays(getCurrentBangkokWeekMonday(now), 7);
}

export function getLastAllowedWeekMonday(now = new Date()): Date {
  return addUtcDays(
    getFirstBookableWeekMonday(now),
    (ROOM_BOOKING_MAX_WEEKS_AHEAD - 1) * 7,
  );
}

export function listAllowedWeekMondayKeys(now = new Date()): string[] {
  const first = getFirstBookableWeekMonday(now);
  const keys: string[] = [];
  for (let i = 0; i < ROOM_BOOKING_MAX_WEEKS_AHEAD; i += 1) {
    keys.push(addUtcDays(first, i * 7).toISOString().slice(0, 10));
  }
  return keys;
}

/** Monday 00:00 UTC of the week containing dateKey (YYYY-MM-DD). */
export function getMondayKeyForDateKey(dateKey: string): string {
  const parsed = new Date(`${dateKey}T00:00:00.000Z`);
  const utcDay = parsed.getUTCDay();
  const isoDay = utcDay === 0 ? 7 : utcDay;
  return addUtcDays(parsed, 1 - isoDay).toISOString().slice(0, 10);
}

export function formatWeekRangeLabel(weekMondayKey: string): string {
  const monday = new Date(`${weekMondayKey}T00:00:00.000Z`);
  const saturday = addUtcDays(monday, 5);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'numeric' };
  const a = monday.toLocaleDateString('vi-VN', opts);
  const b = saturday.toLocaleDateString('vi-VN', opts);
  return `${a} – ${b}`;
}

export function formatBookableDateOptionLabel(
  dateKey: string,
  dayTitle: string,
): string {
  const parsed = new Date(`${dateKey}T00:00:00.000Z`);
  const datePart = parsed.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
  return `${dayTitle} · ${datePart}`;
}

const DAY_KEY_TO_TITLE: Record<RoomScheduleDay['dayKey'], string> = {
  mon: 'Thứ 2',
  tue: 'Thứ 3',
  wed: 'Thứ 4',
  thu: 'Thứ 5',
  fri: 'Thứ 6',
  sat: 'Thứ 7',
};

export type BookableDateOption = {
  dateKey: string;
  dayKey: RoomScheduleDay['dayKey'];
  label: string;
};

export function listAllBookableDateOptions(now = new Date()): BookableDateOption[] {
  const weekMondays = listAllowedWeekMondayKeys(now);
  const options: BookableDateOption[] = [];

  for (const mondayKey of weekMondays) {
    const monday = new Date(`${mondayKey}T00:00:00.000Z`);
    ORDERED_DAY_KEYS.forEach((dayKey, index) => {
      const dateKey = addUtcDays(monday, index).toISOString().slice(0, 10);
      options.push({
        dateKey,
        dayKey,
        label: formatBookableDateOptionLabel(dateKey, DAY_KEY_TO_TITLE[dayKey]),
      });
    });
  }

  return options;
}

export function shiftMockScheduleToWeek(
  days: RoomScheduleDay[],
  weekMondayKey: string,
): RoomScheduleDay[] {
  const monday = new Date(`${weekMondayKey}T00:00:00.000Z`);
  const byKey = new Map(days.map((d) => [d.dayKey, d]));

  return ORDERED_DAY_KEYS.map((dayKey, index) => {
    const base = byKey.get(dayKey);
    if (!base) {
      return {
        dayKey,
        dateKey: addUtcDays(monday, index).toISOString().slice(0, 10),
        label: DAY_KEY_TO_TITLE[dayKey],
        slots: [],
      };
    }

    return {
      ...base,
      dateKey: addUtcDays(monday, index).toISOString().slice(0, 10),
    };
  });
}
