import {
  getStudentSemesterGradesById,
  STUDENT_GRADES_SUMMARY,
  STUDENT_SEMESTER_GRADES,
} from '@/constants/student-academic-data';
import type { GPASummary, SemesterGradesRecord } from '@/types/app-data';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const gradesApi = {
  getAllSemesterGrades: async (): Promise<SemesterGradesRecord[]> => {
    return clone(STUDENT_SEMESTER_GRADES);
  },

  getGradesSummary: async (): Promise<GPASummary> => {
    return clone(STUDENT_GRADES_SUMMARY);
  },

  getCurrentSemesterGrades: async (): Promise<SemesterGradesRecord> => {
    return clone(STUDENT_SEMESTER_GRADES.find((item) => item.isCurrent) ?? STUDENT_SEMESTER_GRADES[0]);
  },

  getSemesterGradesById: async (semesterId: string): Promise<SemesterGradesRecord> => {
    const semester = getStudentSemesterGradesById(semesterId);
    if (!semester) {
      throw new Error(`Grades semester not found: ${semesterId}`);
    }
    return clone(semester);
  },
};
