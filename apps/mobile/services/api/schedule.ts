import type { SemesterScheduleRecord } from '@/types/app-data';
import {
  getLecturerSemesterScheduleById,
  getStudentSemesterScheduleById,
  LECTURER_SEMESTER_SCHEDULES,
  STUDENT_SEMESTER_SCHEDULES,
} from '@/constants';
import { getPreviewRoleOverride } from '@/utils/role-override';
import { USER_ROLES } from '@smart-campus/shared';

import { apiClient } from './client';

function getPreviewScheduleSets() {
  const previewRole = getPreviewRoleOverride(null);

  if (previewRole === USER_ROLES.LECTURER) {
    return {
      semesters: LECTURER_SEMESTER_SCHEDULES,
      byId: getLecturerSemesterScheduleById,
    };
  }

  return {
    semesters: STUDENT_SEMESTER_SCHEDULES,
    byId: getStudentSemesterScheduleById,
  };
}

export const scheduleApi = {
  getAllSemestersWithSchedules: async (): Promise<SemesterScheduleRecord[]> => {
    try {
      return (await apiClient.get('/schedules')) as SemesterScheduleRecord[];
    } catch {
      return getPreviewScheduleSets().semesters;
    }
  },

  getCurrentSchedule: async (): Promise<SemesterScheduleRecord> => {
    try {
      return (await apiClient.get('/schedules/current')) as SemesterScheduleRecord;
    } catch {
      const { semesters } = getPreviewScheduleSets();
      return semesters.find((semester) => semester.isCurrent) ?? semesters[0];
    }
  },

  getScheduleBySemesterId: async (semesterId: string): Promise<SemesterScheduleRecord> => {
    try {
      return (await apiClient.get(
        `/schedules/semesters/${encodeURIComponent(semesterId)}`,
      )) as SemesterScheduleRecord;
    } catch {
      const { semesters, byId } = getPreviewScheduleSets();
      return byId(semesterId) ?? semesters.find((semester) => semester.isCurrent) ?? semesters[0];
    }
  },
};
