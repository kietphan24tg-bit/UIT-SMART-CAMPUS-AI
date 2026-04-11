import {
  getStudentSemesterScheduleById,
  STUDENT_SEMESTER_SCHEDULES,
} from '@/constants/student-academic-data';
import type { SemesterScheduleRecord } from '@/types/app-data';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const scheduleApi = {
  getAllSemestersWithSchedules: async (): Promise<SemesterScheduleRecord[]> => {
    return clone(STUDENT_SEMESTER_SCHEDULES);
  },

  getCurrentSchedule: async (): Promise<SemesterScheduleRecord> => {
    return clone(
      STUDENT_SEMESTER_SCHEDULES.find((item) => item.isCurrent) ?? STUDENT_SEMESTER_SCHEDULES[0],
    );
  },

  getScheduleBySemesterId: async (semesterId: string): Promise<SemesterScheduleRecord> => {
    const semester = getStudentSemesterScheduleById(semesterId);
    if (!semester) {
      throw new Error(`Schedule semester not found: ${semesterId}`);
    }
    return clone(semester);
  },
};
