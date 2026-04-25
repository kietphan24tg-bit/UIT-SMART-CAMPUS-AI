import axios from 'axios';

import { apiClient } from './client';

export type AttendanceCheckinResponse = {
  sessionId: string;
  studentId: string;
  checkinTime: string;
};

export type AttendanceLecturerClassSection = {
  id: string;
  classCode: string;
  sectionCode: string;
  note: string | null;
  capacity: number;
  enrolledCount: number;
  registrationOpen: boolean;
  course: {
    code: string;
    name: string;
    credits: number;
  };
  semester: {
    id: string;
    name: string;
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

export type AttendanceSessionStartResponse = {
  sessionId: string;
  displayKey: string;
  displayUrl: string;
  startedAt: string;
  expiresAt: string;
  status: 'active' | 'closed' | 'expired';
};

export type AttendanceSessionRecordResponse = {
  items: Array<{
    id: string;
    checkinTime: string;
    student: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      studentId: string | null;
    };
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type AttendanceStudentHistoryResponse = {
  items: Array<{
    id: string;
    checkinTime: string;
    sessionId: string;
    classSection: {
      id: string;
      classCode: string;
      sectionCode: string;
      course: {
        code: string;
        name: string;
        credits: number;
      };
    };
    session: {
      id: string;
      status: 'active' | 'closed' | 'expired';
      startedAt: string;
      expiresAt: string;
    };
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export const attendanceApi = {
  checkin: async (token: string): Promise<AttendanceCheckinResponse> => {
    return apiClient.post('/attendance/checkin', { token }) as Promise<AttendanceCheckinResponse>;
  },

  getLecturerClassSections: async (): Promise<AttendanceLecturerClassSection[]> => {
    return (await apiClient.get('/attendance/lecturer/class-sections')) as AttendanceLecturerClassSection[];
  },

  startSession: async (
    classSectionId: string,
    durationMinutes = 10,
  ): Promise<AttendanceSessionStartResponse> => {
    return (await apiClient.post('/attendance/session/start', {
      classSectionId,
      durationMinutes,
    })) as AttendanceSessionStartResponse;
  },

  stopSession: async (sessionId: string) => {
    return (await apiClient.post(
      `/attendance/session/${encodeURIComponent(sessionId)}/stop`,
    )) as {
      id: string;
      status: 'active' | 'closed' | 'expired';
      startedAt: string;
      expiresAt: string;
      closedAt: string | null;
    };
  },

  getSessionRecords: async (
    sessionId: string,
    page = 1,
    limit = 50,
  ): Promise<AttendanceSessionRecordResponse> => {
    return (await apiClient.get(
      `/attendance/session/${encodeURIComponent(sessionId)}/records`,
      { params: { page, limit } },
    )) as AttendanceSessionRecordResponse;
  },

  getLecturerHistory: async (
    classSectionId: string,
    page = 1,
    limit = 20,
    date?: string,
  ) => {
    return (await apiClient.get('/attendance/history', {
      params: {
        classSectionId,
        page,
        limit,
        ...(date ? { date } : {}),
      },
    })) as {
      items: Array<{
        id: string;
        status: 'active' | 'closed' | 'expired';
        startedAt: string;
        expiresAt: string;
        closedAt: string | null;
        classSection: {
          id: string;
          classCode: string;
          sectionCode: string;
        };
        checkedInCount: number;
      }>;
      meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    };
  },

  getStudentHistory: async (
    page = 1,
    limit = 20,
  ): Promise<AttendanceStudentHistoryResponse> => {
    return (await apiClient.get('/attendance/me/history', {
      params: { page, limit },
    })) as AttendanceStudentHistoryResponse;
  },
};

export function isLikelyNetworkError(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response == null;
}

export async function attendanceCheckinWithNetworkRetry(
  token: string,
): Promise<AttendanceCheckinResponse> {
  try {
    return await attendanceApi.checkin(token);
  } catch (e) {
    if (!isLikelyNetworkError(e)) {
      throw e;
    }
    return await attendanceApi.checkin(token);
  }
}

