export interface ScheduleItem {
  id: string;
  courseCode: string;
  courseName: string;
  instructor: string;
  room: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  semester: string;
}

export interface Semester {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}
