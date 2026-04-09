import { apiClient } from './client';

import type { SemesterScheduleRecord } from '@/types/app-data';


export const scheduleApi = {
  getAllSemestersWithSchedules: async (): Promise<SemesterScheduleRecord[]> => {
    return apiClient.get('/schedules') as Promise<SemesterScheduleRecord[]>;
  },

  getCurrentSchedule: async (): Promise<SemesterScheduleRecord> => {
    return apiClient.get('/schedules/current') as Promise<SemesterScheduleRecord>;
  },

  getScheduleBySemesterId: async (semesterId: string): Promise<SemesterScheduleRecord> => {
    return apiClient.get(`/schedules/semesters/${semesterId}`) as Promise<SemesterScheduleRecord>;
  },
};
