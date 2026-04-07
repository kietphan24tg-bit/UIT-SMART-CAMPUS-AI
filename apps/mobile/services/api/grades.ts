import { apiClient } from './client';

import type { GPASummary, GradeRecord } from '@/types/app-data';


export const gradesApi = {
  getGrades: async (semesterId?: string): Promise<GradeRecord[]> => {
    return apiClient.get('/grades', {
      params: semesterId ? { semesterId } : undefined,
    }) as Promise<GradeRecord[]>;
  },

  getGpa: async (semesterId?: string): Promise<GPASummary> => {
    return apiClient.get('/grades/gpa', {
      params: semesterId ? { semesterId } : undefined,
    }) as Promise<GPASummary>;
  },
};
