import type { ParkingStatus, RegisteredVehicle, UserRole } from '@smart-campus/shared';

export type { ParkingStatus, RegisteredVehicle, UserRole } from '@smart-campus/shared';

export interface ScheduleRecord {
  id: string;
  classCode: string;
  sectionCode: string;
  note?: string | null;
  instructor: string | null;
  room: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startPeriod?: number | null;
  endPeriod?: number | null;
  sessionType: 'daytime' | 'evening';
  course: {
    code: string;
    name: string;
    credits: number;
  };
}

export interface SemesterRecord {
  id: string;
  name: string;
  academicYear: string;
  term: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface SemesterScheduleRecord extends SemesterRecord {
  sessions: ScheduleRecord[];
}

export interface GradeRecord {
  id: string;
  midterm: number | null;
  finalExam: number | null;
  assignment: number | null;
  totalScore: number | null;
  letterGrade: string | null;
  gradePoint: number | null;
  isExempt?: boolean;
  earnedCredits?: number;
  course: {
    code: string;
    name: string;
    credits: number;
  };
}

export interface GPASummary {
  gpa: number;
  totalCredits: number;
  totalEarnedCredits?: number;
  totalCourses: number;
  totalSemesters?: number;
}

export interface SemesterGradesRecord {
  id: string;
  name: string;
  academicYear: string;
  term: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  summary: GPASummary;
  grades: GradeRecord[];
}

export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  data?: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationsPayload {
  items: NotificationRecord[];
  meta: PaginatedMeta;
}

export interface TelemetrySnapshotRecord {
  id: string;
  gateId: string;
  deviceIp: string | null;
  slotBitmap: string | null;
  slots: Array<{
    slotNumber: string;
    zone?: string;
    isOccupied?: boolean;
    occupied?: boolean;
  }>;
  temperature: number | null;
  humidity: number | null;
  rainDetected: boolean;
  fireDetected: boolean;
  reportedAt: string;
}

export interface FireAlertRecord {
  id: string;
  gateId: string;
  message: string;
  isResolved: boolean;
  reportedAt: string;
  resolvedAt: string | null;
  telemetrySnapshot: TelemetrySnapshotRecord | null;
}

export interface FireAlertsPayload {
  items: FireAlertRecord[];
  meta: PaginatedMeta;
}

export type TelemetryHealthState = 'online' | 'stale' | 'offline' | 'fire-alert' | 'no-data';

export interface DashboardSnapshot {
  role: string;
  todayClasses: ScheduleRecord[];
  nextClass: ScheduleRecord | null;
  gpa: GPASummary | null;
  unreadCount: number;
  parking: ParkingStatus | null;
  telemetryHealth: TelemetryHealthState;
}

export type AlertFeedKind = 'notification' | 'fire_alert';
export type AlertSeverity = 'normal' | 'warning' | 'critical';
export type AlertCategory = 'general' | 'academic' | 'payment' | 'emergency';

export interface AlertFeedItem {
  id: string;
  kind: AlertFeedKind;
  title: string;
  body: string;
  timestamp: string;
  severity: AlertSeverity;
  category: AlertCategory;
  isRead: boolean;
  gateId?: string;
  deviceIp?: string | null;
  sensorContext?: string;
}

export type SupportState = 'live' | 'partial' | 'unsupported';
export type VerificationSource =
  | 'auth'
  | 'users'
  | 'schedule'
  | 'grades'
  | 'notifications'
  | 'parking'
  | 'iot'
  | 'safety'
  | 'payments'
  | 'stitch'
  | 'manual';

export interface ServiceEntry {
  id: string;
  title: string;
  summary: string;
  category:
    | 'Học vụ'
    | 'Đời sống campus'
    | 'Tiện ích campus'
    | 'Công cụ giảng dạy'
    | 'Công cụ quản trị';
  icon: string;
  supportState: SupportState;
  isInteractive: boolean;
  disabledReason?: string;
  lastVerifiedSource: VerificationSource;
  primaryAction: string;
  route: string;
  description: string;
}

export interface ParkingOverviewState {
  status: ParkingStatus | null;
  vehicles: RegisteredVehicle[];
  telemetryHealth: TelemetryHealthState;
}

export interface OperationsSummaryState {
  parking: ParkingStatus | null;
  telemetry: TelemetrySnapshotRecord | null;
  fireAlerts: FireAlertsPayload;
  unreadCount: number;
  gpa: GPASummary | null;
}

export type StatusTone = 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface MetricItem {
  label: string;
  value: string;
  helper: string;
  tone?: StatusTone;
}

export interface RoleTaskItem {
  id: string;
  title: string;
  description: string;
  meta: string;
  statusLabel: string;
  tone: StatusTone;
  route?: string;
  supportState: SupportState;
  isInteractive: boolean;
  disabledReason?: string;
  lastVerifiedSource: VerificationSource;
}

export interface LecturerDashboardSnapshot {
  metrics: MetricItem[];
  focusTasks: RoleTaskItem[];
  activeClasses: RoleTaskItem[];
}

export interface GatewayZoneStatus {
  id: string;
  label: string;
  health: TelemetryHealthState | 'warning';
  deviceCount: number;
  lastUpdated: string;
  issueSummary: string;
}

export interface RolePermissionSummary {
  id: string;
  label: string;
  accessLevel: 'full' | 'limited' | 'view';
  description: string;
}

export interface OperationsSummary {
  metrics: MetricItem[];
  quickTasks: RoleTaskItem[];
  queueItems: RoleTaskItem[];
  gatewayZones: GatewayZoneStatus[];
  permissionSummary: RolePermissionSummary[];
  systemAlerts: string[];
}

export interface AttendanceSessionSummary {
  id: string;
  courseCode: string;
  courseName: string;
  room: string;
  sessionWindow: string;
  checkedIn: number;
  expected: number;
  status: 'draft' | 'live' | 'closed' | 'needs-review';
}

export interface AttendanceReportSummary {
  id: string;
  title: string;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  lastSessionAt: string;
  actionRequired: boolean;
}

export interface GradeSheetSummary {
  id: string;
  courseCode: string;
  courseName: string;
  classLabel: string;
  studentsPending: number;
  reviewStatus: 'draft' | 'review' | 'published';
  lastUpdated: string;
}

export interface NotificationAudienceOption {
  id: string;
  label: string;
  description: string;
  reach: 'class' | 'faculty' | 'campus' | 'system';
}

export interface CourseRegistrationOption {
  id: string;
  code: string;
  name: string;
  credits: number;
  scheduleLabel: string;
  seatsRemaining: number;
  eligibility: 'eligible' | 'conflict' | 'missing-prerequisite';
}

export interface RoomApprovalItem {
  id: string;
  requesterName: string;
  roomName: string;
  timeRange: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface EventSummary {
  id: string;
  title: string;
  location: string;
  startTime: string;
  status: 'planned' | 'open' | 'closed';
  attendeeCount: number;
}

export interface PaymentStatusRecord {
  transactionId: string;
  status: 'pending' | 'success' | 'failed';
  amount: number;
  provider: string;
  orderId: string;
  updatedAt: string;
  note: string;
}

export type ScheduleTaskKey =
  | 'class-dashboard'
  | 'session-editor'
  | 'attendance-session'
  | 'attendance-report'
  | 'grade-sheet'
  | 'class-notification';

export type OperationsTaskKey =
  | 'approvals'
  | 'users'
  | 'catalog'
  | 'fire-alerts'
  | 'parking-ops'
  | 'notifications';

export type ParkingTaskKey = 'vehicle-registration' | 'payment-status';
export type SettingsTaskKey = 'system-controls';

export interface TaskActionDescriptor {
  label: string;
  route?: string;
  kind?: 'primary' | 'secondary';
  helper?: string;
  externalUrl?: string;
  disabled?: boolean;
  supportState?: SupportState;
  disabledReason?: string;
  lastVerifiedSource?: VerificationSource;
}

export interface TaskInfoRow {
  label: string;
  value: string;
}

export interface TaskRecord {
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  statusLabel?: string;
  tone?: StatusTone;
  route?: string;
  disabled?: boolean;
  disabledReason?: string;
  supportState?: SupportState;
  lastVerifiedSource?: VerificationSource;
}

export interface TaskSectionConfig {
  title: string;
  subtitle?: string;
  body?: string;
  infoRows?: TaskInfoRow[];
  records?: TaskRecord[];
  actions?: TaskActionDescriptor[];
  callout?: {
    title: string;
    body: string;
    tone: StatusTone;
  };
}

export interface TaskScreenConfig {
  eyebrow: string;
  title: string;
  subtitle: string;
  badge: {
    label: string;
    tone: StatusTone;
  };
  metrics?: MetricItem[];
  sections: TaskSectionConfig[];
  primaryAction?: TaskActionDescriptor;
  secondaryActions?: TaskActionDescriptor[];
  layout?: 'default' | 'narrow';
  supportState?: SupportState;
  disabledReason?: string;
  lastVerifiedSource?: VerificationSource;
}

export interface ServiceBlueprint {
  id: string;
  audience: UserRole;
  supportState: SupportState;
  isInteractive: boolean;
  disabledReason?: string;
  lastVerifiedSource: VerificationSource;
  readinessLabel: string;
  readinessTone: StatusTone;
  contractRows: TaskInfoRow[];
  sections: TaskSectionConfig[];
  primaryAction?: TaskActionDescriptor;
  secondaryActions?: TaskActionDescriptor[];
  stateLabels: string[];
}
