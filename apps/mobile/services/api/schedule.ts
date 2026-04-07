import { apiClient } from './client';

import type { ScheduleRecord, SemesterRecord } from '@/types/app-data';


export const scheduleApi = {
  getSchedule: async (semesterId?: string): Promise<ScheduleRecord[]> => {
    return apiClient.get('/schedules', {
      params: semesterId ? { semesterId } : undefined,
    }) as Promise<ScheduleRecord[]>;
  },

  getSemesters: async (): Promise<SemesterRecord[]> => {
    return apiClient.get('/schedules/semesters') as Promise<SemesterRecord[]>;
  },
};
