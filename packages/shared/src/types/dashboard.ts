import type { UserRole } from '../constants/roles';

import type { ParkingStatus } from './parking';

export type TelemetryHealthState = 'online' | 'stale' | 'offline' | 'fire-alert' | 'no-data';

export interface DashboardClassItem {
  id: string;
  instructor: string;
  room: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  course: {
    code: string;
    name: string;
    credits: number;
  };
  semester: {
    id?: string;
    name: string;
  };
}

export interface DashboardGpaSummary {
  gpa: number;
  totalCredits: number;
  totalCourses: number;
}

export interface DashboardMeResponse {
  role: UserRole;
  todayClasses: DashboardClassItem[];
  nextClass: DashboardClassItem | null;
  gpa: DashboardGpaSummary | null;
  unreadCount: number;
  parking: ParkingStatus | null;
  telemetryHealth: TelemetryHealthState;
}

export interface OperationsMetric {
  id: string;
  label: string;
  value: string;
  helper?: string;
  tone?: 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}

export interface OperationsTask {
  id: string;
  title: string;
  description: string;
  route?: string;
  supportState?: 'live' | 'partial' | 'unsupported';
}

export interface OperationsSummaryResponse {
  role: Extract<UserRole, 'admin' | 'super_admin'>;
  metrics: OperationsMetric[];
  quickTasks: OperationsTask[];
  unreadCount: number;
  openFireAlerts: number;
  telemetryHealth: TelemetryHealthState;
}
