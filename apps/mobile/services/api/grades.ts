import { apiClient } from './client';

import type { GPASummary, SemesterGradesRecord } from '@/types/app-data';


export const gradesApi = {
  getAllSemesterGrades: async (): Promise<SemesterGradesRecord[]> => {
    return apiClient.get('/grades') as Promise<SemesterGradesRecord[]>;
  },

  getGradesSummary: async (): Promise<GPASummary> => {
    return apiClient.get('/grades/summary') as Promise<GPASummary>;
  },

  getCurrentSemesterGrades: async (): Promise<SemesterGradesRecord> => {
    return apiClient.get('/grades/current') as Promise<SemesterGradesRecord>;
  },

  getSemesterGradesById: async (semesterId: string): Promise<SemesterGradesRecord> => {
    return apiClient.get(`/grades/semesters/${semesterId}`) as Promise<SemesterGradesRecord>;
  },
};
