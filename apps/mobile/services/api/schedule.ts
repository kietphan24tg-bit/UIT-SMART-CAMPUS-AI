import type { SemesterScheduleRecord } from '@/types/app-data';

import { apiClient } from './client';

export const scheduleApi = {
  getAllSemestersWithSchedules: async (): Promise<SemesterScheduleRecord[]> => {
    return (await apiClient.get('/schedules')) as SemesterScheduleRecord[];
  },

  getCurrentSchedule: async (): Promise<SemesterScheduleRecord> => {
    return (await apiClient.get('/schedules/current')) as SemesterScheduleRecord;
  },

  getScheduleBySemesterId: async (semesterId: string): Promise<SemesterScheduleRecord> => {
    return (await apiClient.get(
      `/schedules/semesters/${encodeURIComponent(semesterId)}`,
    )) as SemesterScheduleRecord;
  },
};

