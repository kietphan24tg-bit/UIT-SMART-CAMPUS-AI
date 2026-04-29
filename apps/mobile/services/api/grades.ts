import type { GPASummary, SemesterGradesRecord } from '@/types/app-data';

import { apiClient } from './client';

export type GradeWeights = {
  processWeight: number;
  practiceWeight: number;
  midtermWeight: number;
  finalWeight: number;
};

export type LecturerGradeClassSection = {
  id: string;
  classCode: string;
  sectionCode: string;
  note: string | null;
  capacity: number;
  enrolledCount: number;
  gradedCount: number;
  gradingStatus: 'complete' | 'incomplete';
  weights: GradeWeights;
  course: {
    id: string;
    code: string;
    name: string;
    credits: number;
  };
  semester: {
    id: string;
    name: string;
    academicYear: string;
    term: number;
    isCurrent: boolean;
  };
  meetings: Array<{
    id: string;
    dayOfWeek: number;
    room: string | null;
    startTime: string;
    endTime: string;
    startPeriod: number | null;
    endPeriod: number | null;
    sessionType: 'daytime' | 'evening';
    note: string | null;
  }>;
};

export type LecturerGradeSheetStudent = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  studentId: string | null;
  grade: {
    id: string;
    processScore: number | null;
    practiceScore: number | null;
    midtermScore: number | null;
    finalScore: number | null;
    totalScore: number | null;
    letterGrade: string | null;
    gradePoint: number | null;
    earnedCredits: number | null;
  } | null;
};

export type LecturerGradeSheet = {
  classSection: {
    id: string;
    classCode: string;
    sectionCode: string;
    capacity: number;
    course: {
      id: string;
      code: string;
      name: string;
      credits: number;
    };
    semester: {
      id: string;
      name: string;
      academicYear: string;
      term: number;
      isCurrent: boolean;
    };
  };
  weights: GradeWeights;
  students: LecturerGradeSheetStudent[];
};

export type GradeSheetRowPayload = {
  studentId: string;
  processScore: number | null;
  practiceScore: number | null;
  midtermScore: number | null;
  finalScore: number | null;
};

export const gradesApi = {
  getAllSemesterGrades: async (): Promise<SemesterGradesRecord[]> => {
    return (await apiClient.get('/grades')) as SemesterGradesRecord[];
  },

  getGradesSummary: async (): Promise<GPASummary> => {
    return (await apiClient.get('/grades/summary')) as GPASummary;
  },

  getCurrentSemesterGrades: async (): Promise<SemesterGradesRecord> => {
    return (await apiClient.get('/grades/current')) as SemesterGradesRecord;
  },

  getSemesterGradesById: async (semesterId: string): Promise<SemesterGradesRecord> => {
    return (await apiClient.get(
      `/grades/semesters/${encodeURIComponent(semesterId)}`,
    )) as SemesterGradesRecord;
  },

  getLecturerClassSections: async (): Promise<LecturerGradeClassSection[]> => {
    return (await apiClient.get('/grades/lecturer/class-sections')) as LecturerGradeClassSection[];
  },

  getClassSectionGradeSheet: async (classSectionId: string): Promise<LecturerGradeSheet> => {
    return (await apiClient.get(
      `/grades/class-sections/${encodeURIComponent(classSectionId)}/sheet`,
    )) as LecturerGradeSheet;
  },

  updateClassSectionGradeWeights: async (
    classSectionId: string,
    weights: GradeWeights,
  ): Promise<LecturerGradeSheet> => {
    return (await apiClient.put(
      `/grades/class-sections/${encodeURIComponent(classSectionId)}/weights`,
      weights,
    )) as LecturerGradeSheet;
  },

  upsertClassSectionGradeSheet: async (
    classSectionId: string,
    rows: GradeSheetRowPayload[],
  ): Promise<LecturerGradeSheet> => {
    return (await apiClient.put(
      `/grades/class-sections/${encodeURIComponent(classSectionId)}/sheet`,
      { rows },
    )) as LecturerGradeSheet;
  },
};

