import axios from 'axios';

import { apiClient } from './client';

export type AttendanceCheckinResponse = {
  sessionId: string;
  studentId: string;
  checkinTime: string;
};

export const attendanceApi = {
  checkin: async (token: string): Promise<AttendanceCheckinResponse> => {
    return apiClient.post('/attendance/checkin', { token }) as Promise<AttendanceCheckinResponse>;
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
