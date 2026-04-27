import type {
  AttendanceClassSectionStudent,
  AttendanceLecturerClassSection,
  AttendanceSessionRecordResponse,
} from '@/services/api/attendance';
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

export type StudentRosterItem = {
  id: string;
  studentId: string;
  fullName: string;
  status: 'present' | 'absent' | 'pending';
  checkinTime?: string;
};

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

export function buildStudentRoster({
  students,
  records,
  hasActiveSession,
}: {
  students: AttendanceClassSectionStudent[];
  records?: AttendanceSessionRecordResponse['items'];
  hasActiveSession: boolean;
}) {
  const recordsByStudentId = new Map(
    (records ?? []).map((record) => [record.student.id, record]),
  );

  return students.map<StudentRosterItem>((student) => {
    const matchedRecord = recordsByStudentId.get(student.id);

    return {
      id: student.id,
      studentId: student.studentId ?? student.email,
      fullName: [student.lastName, student.firstName].filter(Boolean).join(' ').trim(),
      status: matchedRecord ? 'present' : hasActiveSession ? 'absent' : 'pending',
      checkinTime: matchedRecord?.checkinTime,
    };
  });
}
