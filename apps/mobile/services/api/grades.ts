import type { GPASummary, SemesterGradesRecord } from '@/types/app-data';

import { apiClient } from './client';

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
};

