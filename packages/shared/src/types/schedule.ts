export type ScheduleSessionType = 'daytime' | 'evening';

export interface ScheduleCourse {
  code: string;
  name: string;
  credits: number;
}

export interface ScheduleSession {
  id: string;
  classCode: string;
  sectionCode: string;
  note?: string | null;
  instructor: string | null;
  room: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startPeriod?: number | null;
  endPeriod?: number | null;
  sessionType: ScheduleSessionType;
  course: ScheduleCourse;
}

export interface ScheduleSemester {
  id: string;
  name: string;
  academicYear: string;
  term: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface ScheduleSemesterWithSessions extends ScheduleSemester {
  sessions: ScheduleSession[];
}
