import type { AttendanceErrorCode } from '@/utils/attendance-error-ui';

export type AttendanceCheckinAnalyticsPayload =
  | { outcome: 'success'; phase: 'initial' | 'retry' }
  | { outcome: 'error'; phase: 'initial' | 'retry'; error_code: AttendanceErrorCode };

/**
 * Production-oriented structured logs for success rate and error_code distribution.
 * Wire to your analytics backend here when ready.
 */
export function logAttendanceCheckinAnalytics(payload: AttendanceCheckinAnalyticsPayload) {
  const record = {
    ...payload,
    at: new Date().toISOString(),
    feature: 'attendance_checkin',
  };
  if (__DEV__) {
    return;
  }
  try {
    console.info(`[attendance_analytics] ${JSON.stringify(record)}`);
  } catch {
    // ignore
  }
}
