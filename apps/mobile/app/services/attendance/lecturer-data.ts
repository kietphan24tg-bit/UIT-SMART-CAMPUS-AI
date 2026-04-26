import type { AttendanceLecturerClassSection, AttendanceSessionRecordResponse } from '@/services/api/attendance';
import type { ScheduleRecord } from '@/types/app-data';

export type LecturerAttendanceScheduleCard = {
  id: string;
  classCode: string;
  sectionCode: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  course: {
    code: string;
    name: string;
    credits: number;
  };
  attendanceSection: AttendanceLecturerClassSection | null;
};

export type GroupedScheduleCards = Array<{
  dayOfWeek: number;
  items: LecturerAttendanceScheduleCard[];
}>;

export type MockStudentRosterItem = {
  id: string;
  studentId: string;
  fullName: string;
  status: 'present' | 'absent' | 'pending';
  checkinTime?: string;
};

const MOCK_FIRST_NAMES = [
  'An',
  'Bình',
  'Châu',
  'Duy',
  'Giang',
  'Hải',
  'Khánh',
  'Linh',
  'Minh',
  'Ngọc',
  'Phúc',
  'Quân',
  'Trang',
  'Vy',
] as const;

const MOCK_LAST_NAMES = [
  'Nguyễn',
  'Trần',
  'Lê',
  'Phạm',
  'Hoàng',
  'Võ',
  'Đặng',
  'Huỳnh',
  'Phan',
] as const;

export function resolveScheduleCardToClassSection(
  schedule: Pick<
    LecturerAttendanceScheduleCard,
    'classCode' | 'sectionCode' | 'dayOfWeek' | 'startTime' | 'endTime' | 'course'
  >,
  classSections: AttendanceLecturerClassSection[],
) {
  const byClassCode = classSections.find((item) => item.classCode === schedule.classCode);
  if (byClassCode) {
    return byClassCode;
  }

  const bySectionCode = classSections.find(
    (item) => item.sectionCode === schedule.sectionCode && item.course.code === schedule.course.code,
  );
  if (bySectionCode) {
    return bySectionCode;
  }

  return (
    classSections.find(
      (item) =>
        item.course.code === schedule.course.code &&
        item.meetings.some(
          (meeting) =>
            meeting.dayOfWeek === schedule.dayOfWeek &&
            meeting.startTime === schedule.startTime &&
            meeting.endTime === schedule.endTime,
        ),
    ) ?? null
  );
}

export function mapScheduleToAttendanceCards(
  schedule: ScheduleRecord[],
  classSections: AttendanceLecturerClassSection[],
) {
  return [...schedule]
    .sort((left, right) => {
      if (left.dayOfWeek !== right.dayOfWeek) {
        return left.dayOfWeek - right.dayOfWeek;
      }

      return left.startTime.localeCompare(right.startTime);
    })
    .map<LecturerAttendanceScheduleCard>((item) => ({
      id: item.id,
      classCode: item.classCode,
      sectionCode: item.sectionCode,
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime,
      room: item.room,
      course: item.course,
      attendanceSection: resolveScheduleCardToClassSection(item, classSections),
    }));
}

export function groupAttendanceCardsByDay(cards: LecturerAttendanceScheduleCard[]): GroupedScheduleCards {
  const grouped = new Map<number, LecturerAttendanceScheduleCard[]>();

  cards.forEach((item) => {
    const existing = grouped.get(item.dayOfWeek) ?? [];
    existing.push(item);
    grouped.set(item.dayOfWeek, existing);
  });

  return Array.from(grouped.entries())
    .sort(([leftDay], [rightDay]) => leftDay - rightDay)
    .map(([dayOfWeek, items]) => ({
      dayOfWeek,
      items,
    }));
}

function getMockStudentName(index: number) {
  const lastName = MOCK_LAST_NAMES[index % MOCK_LAST_NAMES.length];
  const firstName = MOCK_FIRST_NAMES[index % MOCK_FIRST_NAMES.length];
  return `${lastName} ${firstName}`;
}

export function buildMockStudentRoster({
  expectedCount,
  records,
}: {
  expectedCount: number;
  records?: AttendanceSessionRecordResponse['items'];
}) {
  const presentStudents =
    records?.map<MockStudentRosterItem>((record) => ({
      id: record.id,
      studentId: record.student.studentId ?? record.student.email,
      fullName: [record.student.lastName, record.student.firstName].filter(Boolean).join(' ').trim(),
      status: 'present',
      checkinTime: record.checkinTime,
    })) ?? [];

  const safeExpectedCount = Math.max(expectedCount, presentStudents.length, 12);
  const roster = [...presentStudents];
  const presentStudentIds = new Set(presentStudents.map((item) => item.studentId));

  for (let index = roster.length; index < safeExpectedCount; index += 1) {
    const studentId = `2252${String(index + 1).padStart(4, '0')}`;
    if (presentStudentIds.has(studentId)) {
      continue;
    }

    const mod = index % 5;
    roster.push({
      id: `mock-${studentId}`,
      studentId,
      fullName: getMockStudentName(index),
      status: mod === 0 ? 'absent' : mod === 1 ? 'pending' : 'absent',
    });
  }

  return roster.sort((left, right) => left.studentId.localeCompare(right.studentId));
}
