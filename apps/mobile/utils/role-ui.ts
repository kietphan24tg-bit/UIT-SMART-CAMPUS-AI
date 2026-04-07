import { USER_ROLES } from '@smart-campus/shared';

import type {
  AttendanceReportSummary,
  AttendanceSessionSummary,
  CourseRegistrationOption,
  DashboardSnapshot,
  EventSummary,
  FireAlertsPayload,
  GatewayZoneStatus,
  GradeSheetSummary,
  LecturerDashboardSnapshot,
  MetricItem,
  NotificationAudienceOption,
  OperationsSummary,
  ParkingOverviewState,
  PaymentStatusRecord,
  RolePermissionSummary,
  RoleTaskItem,
  RoomApprovalItem,
  ScheduleRecord,
  ScheduleTaskKey,
  OperationsTaskKey,
  ServiceBlueprint,
  SettingsTaskKey,
  TaskRecord,
  TaskScreenConfig,
} from '@/types/app-data';
import { getRoleLabel, isAdminRole, isLecturerRole } from '@/utils/app';

export interface HomeRoleModel {
  metrics: MetricItem[];
  focusTitle: string;
  focusSubtitle: string;
  focusTasks: RoleTaskItem[];
  supportTitle?: string;
  supportSubtitle?: string;
  supportTasks?: RoleTaskItem[];
}

interface OperationsLivePayload {
  parking?: {
    availableSlots: number;
    totalSlots: number;
    activeSessions?: number;
    occupiedSlots?: number;
    lastUpdated?: string | null;
  } | null;
  fireAlerts?: FireAlertsPayload['items'];
  unreadCount?: number;
  telemetry?: {
    deviceIp?: string | null;
    reportedAt?: string;
    fireDetected?: boolean;
  } | null;
}

interface PermissionCopy {
  title: string;
  description: string;
}

const DEFAULT_STATE_LABELS = [
  'loading',
  'skeleton',
  'empty',
  'error',
  'offline',
  'permission denied',
  'success',
];

function createRoleTask(
  id: string,
  title: string,
  description: string,
  meta: string,
  statusLabel: string,
  tone: RoleTaskItem['tone'],
  route: string,
): RoleTaskItem {
  return {
    id,
    title,
    description,
    meta,
    statusLabel,
    tone,
    route,
  };
}

function createTaskRecord(
  id: string,
  title: string,
  subtitle: string,
  meta: string,
  statusLabel: string,
  tone: TaskRecord['tone'],
  route?: string,
): TaskRecord {
  return {
    id,
    title,
    subtitle,
    meta,
    statusLabel,
    tone,
    route,
  };
}

function buildFallbackSchedule(): ScheduleRecord[] {
  return [
    {
      id: 'schedule-se346',
      instructor: 'TS. Vo Minh Tam',
      room: 'E3.1',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '11:00',
      startDate: '2026-04-07',
      endDate: '2026-04-07',
      course: {
        code: 'SE346',
        name: 'Quan ly du an phan mem',
        credits: 3,
      },
      semester: {
        name: 'HK2 2025-2026',
      },
    },
    {
      id: 'schedule-se112',
      instructor: 'ThS. Tran Khanh Vy',
      room: 'E2.4',
      dayOfWeek: 3,
      startTime: '13:00',
      endTime: '15:00',
      startDate: '2026-04-09',
      endDate: '2026-04-09',
      course: {
        code: 'SE112',
        name: 'Kiem thu phan mem',
        credits: 3,
      },
      semester: {
        name: 'HK2 2025-2026',
      },
    },
    {
      id: 'schedule-se220',
      instructor: 'ThS. Nguyen Phuong Anh',
      room: 'C201',
      dayOfWeek: 5,
      startTime: '07:30',
      endTime: '10:30',
      startDate: '2026-04-11',
      endDate: '2026-04-11',
      course: {
        code: 'SE220',
        name: 'Kien truc phan mem',
        credits: 4,
      },
      semester: {
        name: 'HK2 2025-2026',
      },
    },
  ];
}

export function isSuperAdminRole(role?: string | null) {
  return role === USER_ROLES.SUPER_ADMIN;
}

export function getLecturerDashboardSnapshot(
  schedule: ScheduleRecord[] = [],
): LecturerDashboardSnapshot {
  const classes = (schedule.length > 0 ? schedule : buildFallbackSchedule()).slice(0, 3);

  return {
    metrics: [
      {
        label: 'Lop hom nay',
        value: `${classes.length}`,
        helper: 'Buoi giang dang quan ly',
        tone: 'primary',
      },
      {
        label: 'QR can mo',
        value: '2',
        helper: 'Theo lich trong ngay',
        tone: 'warning',
      },
      {
        label: 'Bang diem nhap',
        value: '3',
        helper: 'Can review truoc khi publish',
        tone: 'info',
      },
      {
        label: 'Thong bao nhap',
        value: '1',
        helper: 'Cho gui den lop',
        tone: 'success',
      },
    ],
    focusTasks: [
      createRoleTask(
        'attendance-session',
        'Tao phien diem danh QR',
        'Khoa QR, thoi gian va dieu kien check-in cho lop hoc dang day.',
        '2 lop can mo phien trong hom nay',
        'San sang tao',
        'info',
        '/schedule/attendance-session',
      ),
      createRoleTask(
        'grade-sheet',
        'Nhap diem va review bang diem',
        'Gom so diem thanh phan, trang thai review va lich publish trong mot man.',
        '3 lop con ban nhap',
        'Cho review',
        'warning',
        '/schedule/grade-sheet',
      ),
      createRoleTask(
        'class-notification',
        'Soan thong bao lop',
        'Gui nhac deadline, doi phong hoc hoac cap nhat ve buoi hoc cho sinh vien.',
        '1 thong bao nhap',
        'Can gui',
        'primary',
        '/schedule/class-notification',
      ),
    ],
    activeClasses: classes.map((item, index) =>
      createRoleTask(
        item.id || `class-${index}`,
        `${item.course.code} · ${item.course.name}`,
        `Phong ${item.room} · ${item.instructor}`,
        `${item.startTime} - ${item.endTime}`,
        index === 0 ? 'Buoi tiep theo' : 'Dang theo doi',
        index === 0 ? 'success' : 'info',
        '/schedule/class-dashboard',
      ),
    ),
  };
}

export function getAttendanceSessions(
  schedule: ScheduleRecord[] = [],
): AttendanceSessionSummary[] {
  const classes = (schedule.length > 0 ? schedule : buildFallbackSchedule()).slice(0, 3);

  return classes.map((item, index) => ({
    id: item.id || `attendance-${index}`,
    courseCode: item.course.code,
    courseName: item.course.name,
    room: item.room,
    sessionWindow: `${item.startTime} - ${item.endTime}`,
    checkedIn: 24 - index * 2,
    expected: 28,
    status: index === 0 ? 'live' : index === 1 ? 'draft' : 'needs-review',
  }));
}

export function getAttendanceReports(): AttendanceReportSummary[] {
  return [
    {
      id: 'report-se346',
      title: 'SE346 · Nhom 01',
      presentCount: 25,
      lateCount: 2,
      absentCount: 1,
      lastSessionAt: '07/04 · 09:00',
      actionRequired: false,
    },
    {
      id: 'report-se104',
      title: 'SE104 · Nhom 03',
      presentCount: 21,
      lateCount: 4,
      absentCount: 3,
      lastSessionAt: '07/04 · 13:00',
      actionRequired: true,
    },
  ];
}

export function getGradeSheets(
  schedule: ScheduleRecord[] = [],
): GradeSheetSummary[] {
  const classes = (schedule.length > 0 ? schedule : buildFallbackSchedule()).slice(0, 3);

  return classes.map((item, index) => ({
    id: item.id || `grade-${index}`,
    courseCode: item.course.code,
    courseName: item.course.name,
    classLabel: `Nhom ${index + 1}`,
    studentsPending: index === 0 ? 12 : 6 + index,
    reviewStatus: index === 0 ? 'review' : index === 1 ? 'draft' : 'published',
    lastUpdated: `0${index + 5}/04 · 18:30`,
  }));
}

export function getNotificationAudienceOptions(
  role?: string | null,
): NotificationAudienceOption[] {
  if (isSuperAdminRole(role)) {
    return [
      {
        id: 'system',
        label: 'Toan he thong',
        description: 'Thong bao cho toan bo nguoi dung va nhom quan tri trong he UIT Smart Campus.',
        reach: 'system',
      },
      {
        id: 'campus',
        label: 'Toan truong UIT',
        description: 'Dung cho thong bao van hanh campus, bao tri va su co quy mo rong.',
        reach: 'campus',
      },
    ];
  }

  if (isAdminRole(role)) {
    return [
      {
        id: 'campus',
        label: 'Toan truong UIT',
        description: 'Thong bao he thong va van hanh cap campus.',
        reach: 'campus',
      },
      {
        id: 'faculty',
        label: 'Theo khoa / bo phan',
        description: 'Gioi han nguoi nhan theo khoa hoac nhom hoc vu.',
        reach: 'faculty',
      },
    ];
  }

  return [
    {
      id: 'class',
      label: 'Lop phu trach',
      description: 'Gui cho mot lop hoc phan cu the.',
      reach: 'class',
    },
    {
      id: 'faculty',
      label: 'Nhom hoc vu',
      description: 'Gui cho nhom lop cung hoc phan hoac cung khoa.',
      reach: 'faculty',
    },
  ];
}

export function getRoomApprovalItems(): RoomApprovalItem[] {
  return [
    {
      id: 'room-1',
      requesterName: 'Nguyen Minh Anh',
      roomName: 'E3.2',
      timeRange: '08/04 · 13:00 - 15:00',
      purpose: 'Hop nhom do an cuoi ky',
      status: 'pending',
    },
    {
      id: 'room-2',
      requesterName: 'Le Hoang Khang',
      roomName: 'Lab 204',
      timeRange: '09/04 · 09:00 - 11:00',
      purpose: 'Kiem thu demo IoT',
      status: 'pending',
    },
  ];
}

export function getCourseRegistrationOptions(): CourseRegistrationOption[] {
  return [
    {
      id: 'course-se346',
      code: 'SE346',
      name: 'Quan ly du an phan mem',
      credits: 3,
      scheduleLabel: 'T2 · 09:00 - 11:00 · E3.1',
      seatsRemaining: 12,
      eligibility: 'eligible',
    },
    {
      id: 'course-se112',
      code: 'SE112',
      name: 'Kiem thu phan mem',
      credits: 3,
      scheduleLabel: 'T4 · 13:00 - 15:00 · E2.4',
      seatsRemaining: 0,
      eligibility: 'conflict',
    },
    {
      id: 'course-se220',
      code: 'SE220',
      name: 'Kien truc phan mem',
      credits: 4,
      scheduleLabel: 'T6 · 07:30 - 10:30 · C201',
      seatsRemaining: 4,
      eligibility: 'missing-prerequisite',
    },
  ];
}

export function getEventSummaries(): EventSummary[] {
  return [
    {
      id: 'event-1',
      title: 'UIT Innovation Day',
      location: 'Hoi truong C',
      startTime: '12/04 · 08:00',
      status: 'open',
      attendeeCount: 140,
    },
    {
      id: 'event-2',
      title: 'Workshop Career Prep',
      location: 'E3.5',
      startTime: '15/04 · 13:30',
      status: 'planned',
      attendeeCount: 72,
    },
  ];
}

export function getGatewayZones(role?: string | null): GatewayZoneStatus[] {
  const zones: GatewayZoneStatus[] = [
    {
      id: 'zone-a',
      label: 'Parking zone A',
      health: 'online',
      deviceCount: 6,
      lastUpdated: '07/04 · 11:03',
      issueSummary: 'Hoat dong on dinh, khong co bat thuong.',
    },
    {
      id: 'zone-b',
      label: 'Block E gateway',
      health: 'warning',
      deviceCount: 4,
      lastUpdated: '07/04 · 10:57',
      issueSummary: '1 thiet bi can ra tin hieu mua lai.',
    },
  ];

  if (isSuperAdminRole(role)) {
    zones.push({
      id: 'zone-core',
      label: 'Core integration services',
      health: 'offline',
      deviceCount: 3,
      lastUpdated: '07/04 · 10:41',
      issueSummary: '1 gateway tich hop chua gui heartbeat dung chu ky.',
    });
  }

  return zones;
}

export function getRolePermissionSummary(
  role?: string | null,
): RolePermissionSummary[] {
  if (isSuperAdminRole(role)) {
    return [
      {
        id: 'rbac',
        label: 'Role & permission control',
        accessLevel: 'full',
        description: 'Quan ly vai tro, mapping quyen va luong phe duyet truy cap.',
      },
      {
        id: 'iot',
        label: 'IoT gateway config',
        accessLevel: 'full',
        description: 'Theo doi zone status, retention policy va cau hinh gateway.',
      },
    ];
  }

  if (isAdminRole(role)) {
    return [
      {
        id: 'broadcast',
        label: 'Broadcast notification',
        accessLevel: 'full',
        description: 'Gui thong bao theo pham vi toan truong hoac nhom hoc vu.',
      },
      {
        id: 'catalog',
        label: 'Course / semester catalog',
        accessLevel: 'limited',
        description: 'Quan ly danh muc hoc vu, queue mo mon va du lieu hoc ky.',
      },
    ];
  }

  return [
    {
      id: 'classroom',
      label: 'Teaching tools',
      accessLevel: 'limited',
      description: 'Mo lop, tao QR va gui thong bao den lop phu trach.',
    },
  ];
}

export function getOperationsSummary(
  role?: string | null,
  liveData?: OperationsLivePayload,
): OperationsSummary {
  const fireAlertItems = normalizeFireAlerts(liveData?.fireAlerts);
  const openFireAlerts = `${fireAlertItems.filter((item) => !item.isResolved).length || 2}`;
  const pendingApprovals = `${getRoomApprovalItems().length}`;
  const zoneHealth = getGatewayZones(role);

  const quickTasks = [
    createRoleTask(
      'approvals',
      'Duyet yeu cau phong',
      'Khoa hang doi request va quyet dinh approve / reject trong mot luong ro rang.',
      `${pendingApprovals} yeu cau dang cho`,
      'Uu tien cao',
      'warning',
      '/operations/approvals',
    ),
    createRoleTask(
      'fire-alerts',
      'Lich su canh bao chay',
      'Tap trung log, vi tri va snapshot gateway de dieu phoi nhanh.',
      `${openFireAlerts} canh bao mo`,
      'Can theo doi',
      'danger',
      '/operations/fire-alerts',
    ),
    createRoleTask(
      'notifications',
      'Broadcast notification',
      'Soan, preview va chon audience cho thong bao van hanh campus.',
      `${liveData?.unreadCount ?? 3} draft / pending`,
      'Co the gui',
      'primary',
      '/operations/notifications',
    ),
  ];

  const queueItems = [
    createRoleTask(
      'users',
      'User summary',
      'Danh sach tai khoan can doi chieu quyen, trang thai va ngat quyen tam thoi.',
      '4 tai khoan can xu ly',
      'Dang cho ra soat',
      'info',
      '/operations/users',
    ),
    createRoleTask(
      'catalog',
      'Course / semester catalog',
      'Theo doi hoc ky hien tai, dot mo mon va cac thay doi du lieu hoc vu.',
      '2 thay doi chua publish',
      'Ban nhap',
      'warning',
      '/operations/catalog',
    ),
    createRoleTask(
      'parking-ops',
      'Parking ops detail',
      'Ra session, cho trong va telemetry thuc dia cho khu parking UIT.',
      `${liveData?.parking?.availableSlots ?? 3}/${liveData?.parking?.totalSlots ?? 4} cho trong`,
      'On dinh',
      'success',
      '/operations/parking-ops',
    ),
  ];

  if (isSuperAdminRole(role)) {
    queueItems.unshift(
      createRoleTask(
        'system-controls',
        'System controls',
        'Mo trung tam role management, retention va cau hinh tich hop.',
        '3 policy can review',
        'Truy cap day du',
        'info',
        '/settings/system-controls',
      ),
    );
  }

  return {
    metrics: [
      {
        label: 'PCCC mo',
        value: openFireAlerts,
        helper: 'Canh bao can xac minh',
        tone: 'danger',
      },
      {
        label: 'Yeu cau phong',
        value: pendingApprovals,
        helper: 'Cho phe duyet',
        tone: 'warning',
      },
      {
        label: 'Gateway zones',
        value: `${zoneHealth.length}`,
        helper: 'Theo doi suc khoe',
        tone: 'info',
      },
      {
        label: 'Thong bao draft',
        value: `${liveData?.unreadCount ?? 3}`,
        helper: 'Luong van hanh',
        tone: 'primary',
      },
    ],
    quickTasks,
    queueItems,
    gatewayZones: zoneHealth,
    permissionSummary: getRolePermissionSummary(role),
    systemAlerts: isSuperAdminRole(role)
      ? [
          '1 gateway tich hop chua gui heartbeat du chu ky.',
          'Retention policy cho fire alert can xac nhan voi backend.',
        ]
      : ['Telemetry khu B co dau hieu cham cap nhat, can theo doi them.'],
  };
}

export function getHomeRoleModel(
  role: DashboardSnapshot['role'],
  snapshot: DashboardSnapshot,
): HomeRoleModel {
  if (isLecturerRole(role)) {
    const lecturer = getLecturerDashboardSnapshot(snapshot.todayClasses);

    return {
      metrics: lecturer.metrics,
      focusTitle: 'Tac vu giang day',
      focusSubtitle: 'Nhung viec nen xu ly ngay de lop hoc va thong bao van hanh on dinh.',
      focusTasks: lecturer.focusTasks,
      supportTitle: 'Lop dang theo doi',
      supportSubtitle: 'Danh sach lop va buoi giang dang mo theo lich hien tai.',
      supportTasks: lecturer.activeClasses,
    };
  }

  if (isAdminRole(role)) {
    const operations = getOperationsSummary(role, {
      parking: snapshot.parking
        ? {
            availableSlots: snapshot.parking.availableSlots,
            totalSlots: snapshot.parking.totalSlots,
            activeSessions: snapshot.parking.activeSessions,
            occupiedSlots: snapshot.parking.occupiedSlots,
            lastUpdated: snapshot.parking.lastUpdated,
          }
        : null,
      unreadCount: snapshot.unreadCount,
    });

    return {
      metrics: operations.metrics,
      focusTitle: 'Uu tien van hanh',
      focusSubtitle: 'Tap trung vao queue backend-facing truoc khi xu ly sau trong tung module.',
      focusTasks: operations.quickTasks,
      supportTitle: isSuperAdminRole(role) ? 'System oversight' : 'Hang doi quan tri',
      supportSubtitle: isSuperAdminRole(role)
        ? 'Bien the Super Admin nhan manh zone, policy va system controls.'
        : 'Cac nhom du lieu va queue giup doi quan tri UIT xu ly trong ngay.',
      supportTasks: operations.queueItems,
    };
  }

  return {
    metrics: [
      {
        label: 'Lich hom nay',
        value: `${snapshot.todayClasses.length}`,
        helper: 'Buoi dang theo lich',
        tone: 'primary',
      },
      {
        label: 'Canh bao moi',
        value: `${snapshot.unreadCount}`,
        helper: 'Chua doc',
        tone: 'warning',
      },
      {
        label: 'Cho trong',
        value: snapshot.parking
          ? `${snapshot.parking.availableSlots}/${snapshot.parking.totalSlots}`
          : '--',
        helper: 'Parking A1-A4',
        tone: 'success',
      },
      {
        label: 'GPA',
        value: typeof snapshot.gpa?.gpa === 'number' ? snapshot.gpa.gpa.toFixed(2) : '0.00',
        helper: 'Tich luy hien tai',
        tone: 'info',
      },
    ],
    focusTitle: 'Tac vu hoc vu',
    focusSubtitle: 'Tu dashboard di thang vao cac module hoc vu va campus utilities.',
    focusTasks: [
      createRoleTask(
        'course-registration',
        'Dang ky mon hoc',
        'Xem dot mo mon, so cho con lai va dieu kien tien quyet truoc khi backend CRUD day du.',
        '3 hoc phan dang mo',
        'San sang',
        'info',
        '/services/course-registration',
      ),
      createRoleTask(
        'room-booking',
        'Dat phong hoc / lab',
        'Gui yeu cau su dung phong va theo doi lich su phe duyet trong cung mot family.',
        '1 yeu cau dang cho',
        'Theo doi',
        'warning',
        '/services/room-booking',
      ),
      createRoleTask(
        'events',
        'Su kien & cong dong',
        'Kham pha workshop, CLB va cac hoat dong noi bat cua Truong Dai hoc Cong nghe Thong tin.',
        `${getEventSummaries().length} su kien sap toi`,
        'Dang mo',
        'success',
        '/services/events',
      ),
    ],
    supportTitle: 'Tien ich campus',
    supportSubtitle: 'Cac dich vu roadmap duoc gom ve Services de backend noi dan ma khong vo IA.',
    supportTasks: [
      createRoleTask(
        'library',
        'Thu vien',
        'Tra cuu sach, lich muon tra va goi y tai lieu cho UITer.',
        '2 dau sach noi bat',
        'Roadmap',
        'info',
        '/services/library',
      ),
      createRoleTask(
        'campus-map',
        'Ban do campus',
        'Tim nhanh toa nha, phong hoc va tien ich trong khuon vien UIT.',
        '5 diem chinh',
        'Roadmap',
        'info',
        '/services/campus-map',
      ),
      createRoleTask(
        'chatbot',
        'AI Chatbot',
        'Hoi dap nhanh cac cau hoi pho bien ve UIT, hoc vu va parking.',
        '6 prompt mau',
        'Roadmap',
        'info',
        '/services/chatbot',
      ),
    ],
  };
}

export function getPaymentStatusRecord(
  parking?: ParkingOverviewState | null,
): PaymentStatusRecord | null {
  const vehicle =
    parking?.vehicles.find((item) => item.subscription.status !== 'inactive') ??
    parking?.vehicles[0];

  if (!vehicle) {
    return null;
  }

  switch (vehicle.subscription.status) {
    case 'active':
      return {
        transactionId: `PAY-${vehicle.id.slice(0, 6).toUpperCase()}`,
        status: 'success',
        amount: vehicle.subscription.monthlyFee,
        provider: 'MoMo',
        orderId: `UIT-PARK-${vehicle.id.slice(0, 8).toUpperCase()}`,
        updatedAt: vehicle.subscription.lastPaymentAt ?? vehicle.updatedAt,
        note: 'Goi gui xe dang hieu luc. Lan thanh toan gan nhat da duoc backend ghi nhan.',
      };
    case 'pending':
      return {
        transactionId: `PAY-${vehicle.id.slice(0, 6).toUpperCase()}`,
        status: 'pending',
        amount: vehicle.subscription.monthlyFee,
        provider: 'MoMo',
        orderId: `UIT-PARK-${vehicle.id.slice(0, 8).toUpperCase()}`,
        updatedAt: vehicle.updatedAt,
        note: 'Giao dich dang cho hoan tat. Mobile can hien ro pending state va refresh lai ket qua.',
      };
    default:
      return {
        transactionId: `PAY-${vehicle.id.slice(0, 6).toUpperCase()}`,
        status: 'failed',
        amount: vehicle.subscription.monthlyFee,
        provider: 'MoMo',
        orderId: `UIT-PARK-${vehicle.id.slice(0, 8).toUpperCase()}`,
        updatedAt: vehicle.updatedAt,
        note: 'Can thanh toan lai hoac kiem tra han goi gui xe de tranh gian doan truy cap.',
      };
  }
}

export function getUserSummaryRecords(role?: string | null): TaskRecord[] {
  const baseRecords = [
    createTaskRecord(
      'user-22520001',
      '22520001 · Nguyen Minh Anh',
      'Sinh vien CNTT2022 · access active',
      'Lan dang nhap gan nhat: 07/04 · 10:21',
      'Hoat dong',
      'success',
      '/operations/users',
    ),
    createTaskRecord(
      'user-lecturer-1',
      'GV001 · Tran Khanh Vy',
      'Giang vien · can review phan quyen thong bao lop',
      'Pending role sync',
      'Can xu ly',
      'warning',
      '/operations/users',
    ),
  ];

  if (isSuperAdminRole(role)) {
    baseRecords.push(
      createTaskRecord(
        'user-admin-1',
        'ADM002 · Le Quang Huy',
        'Admin van hanh · quyen gateway scope can doi chieu',
        'RBAC sync trong 24h qua',
        'Review policy',
        'info',
        '/settings/system-controls',
      ),
    );
  }

  return baseRecords;
}

export function getCatalogRecords(): TaskRecord[] {
  return [
    createTaskRecord(
      'semester-current',
      'HK2 2025-2026',
      'Hoc ky hien tai cua UIT',
      'Ngay mo dang ky: 15/04',
      'Dang mo',
      'success',
      '/operations/catalog',
    ),
    createTaskRecord(
      'course-se346',
      'SE346 · Quan ly du an phan mem',
      '3 tin chi · mo cho 02 lop',
      '12 cho con lai',
      'Can review',
      'warning',
      '/operations/catalog',
    ),
  ];
}

export function getFireAlertRecords(
  liveItems?: FireAlertsPayload['items'],
): TaskRecord[] {
  const normalizedItems = normalizeFireAlerts(liveItems);
  const items = normalizedItems.length
    ? normalizedItems.slice(0, 3)
    : [
        {
          id: 'fire-1',
          gateId: 'uit-gate-a',
          message: 'Phat hien lua tai zone A',
          isResolved: false,
          reportedAt: '2026-04-07T03:40:00.000Z',
          resolvedAt: null,
          telemetrySnapshot: {
            id: 'telemetry-1',
            gateId: 'uit-gate-a',
            deviceIp: '192.168.1.12',
            slotBitmap: '1010',
            slots: [],
            temperature: 39,
            humidity: 72,
            rainDetected: false,
            fireDetected: true,
            reportedAt: '2026-04-07T03:39:40.000Z',
          },
        },
      ];

  return items.map((item, index) =>
    createTaskRecord(
      item.id,
      `${item.gateId} · Canh bao ${index + 1}`,
      item.message,
      item.reportedAt,
      item.isResolved ? 'Da xu ly' : 'Dang mo',
      item.isResolved ? 'info' : 'danger',
      '/operations/fire-alerts',
    ),
  );
}

function normalizeFireAlerts(
  input?: FireAlertsPayload['items'] | { items?: FireAlertsPayload['items'] } | null,
) {
  if (Array.isArray(input)) {
    return input;
  }

  if (input && Array.isArray(input.items)) {
    return input.items;
  }

  return [] as FireAlertsPayload['items'];
}

export function getParkingOpsRecords(
  liveData?: OperationsLivePayload['parking'],
): TaskRecord[] {
  const available = liveData?.availableSlots ?? 3;
  const total = liveData?.totalSlots ?? 4;
  const activeSessions = liveData?.activeSessions ?? 2;
  const occupied = liveData?.occupiedSlots ?? total - available;

  return [
    createTaskRecord(
      'parking-live',
      'Snapshot parking UIT',
      `${available}/${total} cho trong · ${activeSessions} session dang mo`,
      liveData?.lastUpdated ?? '07/04 · 11:03',
      'Live snapshot',
      'success',
      '/parking',
    ),
    createTaskRecord(
      'parking-review',
      'Kiem tra occupied map',
      `Zone A dang co ${occupied} cho da chiem`,
      'Can doi chieu voi telemetry neu stale > 30s',
      'Theo doi',
      'warning',
      '/operations/parking-ops',
    ),
  ];
}

export function getPermissionDeniedCopy(role?: string | null): PermissionCopy {
  return {
    title: 'Ban chua co quyen truy cap man nay',
    description: `${getRoleLabel(role)} hien tai khong duoc mo tac vu nay. UI van giu permission denied state ro rang de backend noi quyen sau nay.`,
  };
}

function createBlueprint(
  id: string,
  audience: ServiceBlueprint['audience'],
  readinessLabel: string,
  readinessTone: ServiceBlueprint['readinessTone'],
  contractRows: ServiceBlueprint['contractRows'],
  sections: ServiceBlueprint['sections'],
  primaryAction?: ServiceBlueprint['primaryAction'],
  secondaryActions?: ServiceBlueprint['secondaryActions'],
): ServiceBlueprint {
  return {
    id,
    audience,
    readinessLabel,
    readinessTone,
    contractRows,
    sections,
    primaryAction,
    secondaryActions,
    stateLabels: DEFAULT_STATE_LABELS,
  };
}

export function getServiceBlueprint(
  serviceId: string,
  role: ServiceBlueprint['audience'] = USER_ROLES.STUDENT,
): ServiceBlueprint {
  const isLecturer = isLecturerRole(role);
  const isAdmin = isAdminRole(role);
  const isSuper = isSuperAdminRole(role);

  switch (serviceId) {
    case 'attendance':
      return createBlueprint(
        serviceId,
        role,
        isLecturer ? 'Lecturer-ready' : 'Roadmap',
        isLecturer ? 'success' : 'info',
        [
          { label: 'Read API', value: 'GET /attendance/reports' },
          { label: 'Write API', value: 'POST /attendance/sessions, POST /attendance/checkin' },
          { label: 'Primary user', value: isLecturer ? 'Lecturer' : 'Student' },
        ],
        [
          {
            title: 'Tac vu chinh',
            subtitle: 'Flow diem danh bat dau tu lecturer, student vao bang QR payload.',
            records: getAttendanceSessions().map((item) =>
              createTaskRecord(
                item.id,
                `${item.courseCode} · ${item.courseName}`,
                `${item.room} · ${item.sessionWindow}`,
                `${item.checkedIn}/${item.expected} sinh vien da check-in`,
                item.status === 'live' ? 'Dang mo' : item.status === 'draft' ? 'Ban nhap' : 'Can review',
                item.status === 'live' ? 'success' : item.status === 'draft' ? 'info' : 'warning',
                isLecturer ? '/schedule/attendance-session' : undefined,
              ),
            ),
          },
          {
            title: 'Contract backend can co',
            body: 'Can co session payload, QR token an toan, report summary va luong manual override cho lecturer/admin.',
          },
        ],
        isLecturer
          ? { label: 'Mo attendance session', route: '/schedule/attendance-session', kind: 'primary' }
          : { label: 'Xem dashboard hoc vu', route: '/schedule', kind: 'primary' },
      );
    case 'course-registration':
      return createBlueprint(
        serviceId,
        role,
        'Roadmap but contract-ready',
        'info',
        [
          { label: 'Read API', value: 'GET /course-registration/options' },
          { label: 'Write API', value: 'POST /course-registration, DELETE /course-registration/:id' },
          { label: 'Primary user', value: 'Student' },
        ],
        [
          {
            title: 'Hoc phan dang mo',
            subtitle: 'UI da co state cho seat con lai, conflict va thieu tien quyet.',
            records: getCourseRegistrationOptions().map((item) =>
              createTaskRecord(
                item.id,
                `${item.code} · ${item.name}`,
                `${item.credits} tin chi · ${item.scheduleLabel}`,
                `${item.seatsRemaining} cho con lai`,
                item.eligibility === 'eligible'
                  ? 'Co the dang ky'
                  : item.eligibility === 'conflict'
                    ? 'Trung lich'
                    : 'Thieu dieu kien',
                item.eligibility === 'eligible'
                  ? 'success'
                  : item.eligibility === 'conflict'
                    ? 'warning'
                    : 'danger',
              ),
            ),
          },
          {
            title: 'Dieu kien can backend tra ve',
            infoRows: [
              { label: 'Eligibility', value: 'eligible / conflict / missing-prerequisite' },
              { label: 'Conflict detail', value: 'Trung lich, qua so tin chi, khoa mon' },
            ],
          },
        ],
      );
    case 'room-booking':
      return createBlueprint(
        serviceId,
        role,
        isAdmin ? 'Admin queue-ready' : 'Request-ready',
        isAdmin ? 'success' : 'info',
        [
          { label: 'Read API', value: 'GET /room-booking/availability, GET /room-booking/approvals' },
          { label: 'Write API', value: 'POST /room-booking, PATCH /room-booking/:id/decision' },
          { label: 'Primary user', value: isAdmin ? 'Admin' : 'Student / Lecturer' },
        ],
        [
          {
            title: isAdmin ? 'Approval queue' : 'Request states',
            subtitle: isAdmin
              ? 'UI can approve / reject nhung van nam trong Services family.'
              : 'Sinh vien va giang vien vao day de tao request va theo doi ket qua.',
            records: getRoomApprovalItems().map((item) =>
              createTaskRecord(
                item.id,
                `${item.roomName} · ${item.requesterName}`,
                item.purpose,
                item.timeRange,
                item.status === 'pending' ? 'Dang cho' : item.status === 'approved' ? 'Da duyet' : 'Tu choi',
                item.status === 'pending' ? 'warning' : item.status === 'approved' ? 'success' : 'danger',
                isAdmin ? '/operations/approvals' : undefined,
              ),
            ),
          },
        ],
        isAdmin
          ? { label: 'Mo approval queue', route: '/operations/approvals', kind: 'primary' }
          : undefined,
      );
    case 'events':
      return createBlueprint(
        serviceId,
        role,
        isAdmin ? 'Moderation-ready' : 'Roadmap',
        isAdmin ? 'success' : 'info',
        [
          { label: 'Read API', value: 'GET /events, GET /events/:id' },
          { label: 'Write API', value: 'POST /events, PATCH /events/:id, POST /events/:id/check-in' },
          { label: 'Primary user', value: isAdmin ? 'Admin / Lecturer' : 'Student' },
        ],
        [
          {
            title: 'Su kien sap toi',
            records: getEventSummaries().map((item) =>
              createTaskRecord(
                item.id,
                item.title,
                `${item.location} · ${item.startTime}`,
                `${item.attendeeCount} nguoi quan tam`,
                item.status === 'open' ? 'Dang mo' : item.status === 'planned' ? 'Sap dien ra' : 'Da dong',
                item.status === 'open' ? 'success' : item.status === 'planned' ? 'info' : 'neutral',
              ),
            ),
          },
        ],
      );
    case 'library':
      return createBlueprint(
        serviceId,
        role,
        'Roadmap',
        'info',
        [
          { label: 'Read API', value: 'GET /library/books, GET /library/loans' },
          { label: 'Write API', value: 'POST /library/reservations' },
          { label: 'Primary user', value: 'Student / Lecturer' },
        ],
        [
          {
            title: 'UI direction',
            body: 'Chi tiet module thu vien tap trung vao tim sach, lich muon tra, reserve seat va empty state khi khong co ket qua.',
          },
        ],
      );
    case 'campus-map':
      return createBlueprint(
        serviceId,
        role,
        'Roadmap',
        'info',
        [
          { label: 'Read API', value: 'GET /campus-map/locations, GET /campus-map/routes' },
          { label: 'Write API', value: 'Khong bat buoc trong pass dau' },
          { label: 'Primary user', value: 'Tat ca role' },
        ],
        [
          {
            title: 'UI direction',
            body: 'Map detail can gom danh sach toa nha, search nhanh va dieu huong den phong hoc, van giu mobile-first.',
          },
        ],
      );
    case 'chatbot':
      return createBlueprint(
        serviceId,
        role,
        'Roadmap',
        'info',
        [
          { label: 'Read API', value: 'POST /chatbot/messages' },
          { label: 'Write API', value: 'POST /chatbot/feedback' },
          { label: 'Primary user', value: 'Tat ca role' },
        ],
        [
          {
            title: 'UI direction',
            body: 'Chatbot can co prompt suggestions, hoi dap ve UIT va degrade gracefully khi backend AI chua san sang.',
          },
        ],
      );
    case 'smart-classroom':
      return createBlueprint(
        serviceId,
        role,
        isLecturer || isSuper ? 'Control-ready' : 'Roadmap',
        isLecturer || isSuper ? 'success' : 'info',
        [
          { label: 'Read API', value: 'GET /smart-classroom/status' },
          { label: 'Write API', value: 'POST /smart-classroom/actions' },
          { label: 'Primary user', value: isLecturer ? 'Lecturer' : isSuper ? 'Super Admin' : 'Admin' },
        ],
        [
          {
            title: 'Control blocks',
            body: 'UI gom trang thai thiet bi, scene presets va action log, khong tao dashboard desktop rieng.',
          },
        ],
      );
    case 'admin-tools':
      return createBlueprint(
        serviceId,
        role,
        isAdmin ? 'Operations-ready' : 'Restricted',
        isAdmin ? 'success' : 'warning',
        [
          { label: 'Read API', value: 'GET /admin/summary, GET /safety/fire-alerts, GET /parking/status' },
          { label: 'Write API', value: 'POST /notifications/broadcast, PATCH /room-booking/:id/decision' },
          { label: 'Primary user', value: 'Admin / Super Admin' },
        ],
        [
          {
            title: 'Entry points',
            records: [
              ...getFireAlertRecords(),
              ...getParkingOpsRecords(),
              ...getUserSummaryRecords(role),
            ],
          },
        ],
        isAdmin
          ? { label: 'Mo Operations', route: '/schedule', kind: 'primary' }
          : undefined,
        isSuper
          ? [{ label: 'System controls', route: '/settings/system-controls', kind: 'secondary' }]
          : undefined,
      );
    case 'grades':
      return createBlueprint(
        serviceId,
        role,
        isLecturer || isAdmin ? 'Review-ready' : 'Live',
        isLecturer || isAdmin ? 'success' : 'info',
        [
          { label: 'Read API', value: 'GET /grades, GET /grades/gpa' },
          { label: 'Write API', value: 'POST /grades, PATCH /grades/:id' },
          { label: 'Primary user', value: isLecturer || isAdmin ? 'Lecturer / Admin' : 'Student' },
        ],
        [
          {
            title: 'Grade flow',
            body:
              isLecturer || isAdmin
                ? 'UI se di thang vao grade sheet review, score entry va publish states trong Schedule / Operations.'
                : 'Student xem GPA va bang diem ngay trong detail screen.',
          },
        ],
        isLecturer || isAdmin
          ? { label: 'Mo grade sheet', route: '/schedule/grade-sheet', kind: 'primary' }
          : undefined,
      );
    default:
      return createBlueprint(
        serviceId,
        role,
        'Roadmap',
        'info',
        [
          { label: 'Read API', value: 'To be defined' },
          { label: 'Write API', value: 'To be defined' },
          { label: 'Primary user', value: getRoleLabel(role) },
        ],
        [
          {
            title: 'Shared detail template',
            body: 'Module nay dang dung template detail chung de giu IA gon, sau do backend co the noi contract chi tiet hon.',
          },
        ],
      );
  }
}

export function getScheduleTaskConfig(
  task: ScheduleTaskKey,
  schedule: ScheduleRecord[] = [],
): TaskScreenConfig | null {
  const sessions = getAttendanceSessions(schedule);
  const reports = getAttendanceReports();
  const gradeSheets = getGradeSheets(schedule);
  const classes = (schedule.length > 0 ? schedule : buildFallbackSchedule()).slice(0, 3);

  switch (task) {
    case 'class-dashboard':
      return {
        eyebrow: 'Teaching tools',
        title: 'Class dashboard',
        subtitle: 'Tong hop lop hoc, buoi dang day, attendance va bang diem trong mot luong mobile-first.',
        badge: { label: 'Lecturer-ready', tone: 'success' },
        metrics: getLecturerDashboardSnapshot(schedule).metrics,
        sections: [
          {
            title: 'Lop dang theo doi',
            records: classes.map((item, index) =>
              createTaskRecord(
                item.id,
                `${item.course.code} · ${item.course.name}`,
                `Phong ${item.room} · ${item.startTime} - ${item.endTime}`,
                `Giang vien: ${item.instructor}`,
                index === 0 ? 'Buoi ke tiep' : 'Dang mo',
                index === 0 ? 'success' : 'info',
              ),
            ),
          },
          {
            title: 'Tac vu lien quan',
            records: [
              createTaskRecord(
                'attendance',
                'Attendance session',
                'Mo QR va chon policy diem danh cho lop.',
                'Lien ket den luong tao session',
                'Tiep tuc',
                'primary',
                '/schedule/attendance-session',
              ),
              createTaskRecord(
                'grade',
                'Grade sheet review',
                'Nhap diem thanh phan, review va publish ket qua.',
                '1 luong CRUD lien thong',
                'Tiep tuc',
                'warning',
                '/schedule/grade-sheet',
              ),
            ],
          },
        ],
        primaryAction: { label: 'Mo attendance session', route: '/schedule/attendance-session', kind: 'primary' },
        secondaryActions: [
          { label: 'Soan thong bao lop', route: '/schedule/class-notification', kind: 'secondary' },
        ],
      };
    case 'session-editor':
      return {
        eyebrow: 'Teaching tools',
        title: 'Create / edit session',
        subtitle: 'Luong tao va cap nhat buoi hoc de backend biet ro data can luu cho lecturer.',
        badge: { label: 'CRUD-ready', tone: 'primary' },
        sections: [
          {
            title: 'Thong tin can nhap',
            infoRows: [
              { label: 'Fields', value: 'courseId, sectionId, date, timeRange, room, note' },
              { label: 'Validation', value: 'Trung lich, conflict room, ngoai hoc ky, thay doi dot xuat' },
              { label: 'Mutation', value: 'POST /schedule/sessions, PATCH /schedule/sessions/:id' },
            ],
          },
          {
            title: 'Ngu canh gan day',
            records: classes.map((item) =>
              createTaskRecord(
                item.id,
                `${item.course.code} · ${item.course.name}`,
                `${item.startTime} - ${item.endTime} · ${item.room}`,
                item.semester.name,
                'Template tham chieu',
                'info',
              ),
            ),
          },
        ],
        primaryAction: { label: 'Luu ban nhap', kind: 'primary' },
        secondaryActions: [
          { label: 'Nhan ban tu buoi truoc', kind: 'secondary' },
          { label: 'Quay lai lich day', route: '/schedule', kind: 'secondary' },
        ],
        layout: 'narrow',
      };
    case 'attendance-session':
      return {
        eyebrow: 'Attendance',
        title: 'Attendance QR generation',
        subtitle: 'Tao phien diem danh QR, chon thoi luong va xu ly stale / permission states trong cung family.',
        badge: { label: 'Lecturer action', tone: 'success' },
        sections: [
          {
            title: 'Sessions can mo',
            records: sessions.map((item) =>
              createTaskRecord(
                item.id,
                `${item.courseCode} · ${item.courseName}`,
                `${item.room} · ${item.sessionWindow}`,
                `${item.checkedIn}/${item.expected} da vao`,
                item.status === 'live' ? 'Dang mo' : item.status === 'draft' ? 'Ban nhap' : 'Can review',
                item.status === 'live' ? 'success' : item.status === 'draft' ? 'info' : 'warning',
              ),
            ),
          },
          {
            title: 'Contract',
            infoRows: [
              { label: 'Mutation', value: 'POST /attendance/sessions' },
              { label: 'Payload', value: 'classId, expiresIn, allowLate, note' },
              { label: 'Realtime', value: 'Polling summary + QR payload expiry' },
            ],
          },
        ],
        primaryAction: { label: 'Tao QR moi', kind: 'primary' },
        secondaryActions: [
          { label: 'Mo attendance report', route: '/schedule/attendance-report', kind: 'secondary' },
        ],
      };
    case 'attendance-report':
      return {
        eyebrow: 'Attendance',
        title: 'Attendance report',
        subtitle: 'Tong hop present, late, absent va cac truong hop can manual override.',
        badge: { label: 'Report summary', tone: 'info' },
        sections: [
          {
            title: 'Bao cao gan day',
            records: reports.map((item) =>
              createTaskRecord(
                item.id,
                item.title,
                `${item.presentCount} co mat · ${item.lateCount} tre · ${item.absentCount} vang`,
                `Session gan nhat: ${item.lastSessionAt}`,
                item.actionRequired ? 'Can override' : 'On dinh',
                item.actionRequired ? 'warning' : 'success',
              ),
            ),
          },
          {
            title: 'Contract',
            infoRows: [
              { label: 'Read API', value: 'GET /attendance/reports, GET /attendance/reports/:id' },
              { label: 'Write API', value: 'PATCH /attendance/checkins/:id' },
            ],
          },
        ],
        primaryAction: { label: 'Xem phien dang mo', route: '/schedule/attendance-session', kind: 'primary' },
      };
    case 'grade-sheet':
      return {
        eyebrow: 'Grades management',
        title: 'Grade sheet entry / review',
        subtitle: 'Tap trung score entry, review state va publish cho lop hoc phan trong UIT.',
        badge: { label: 'Backend-ready', tone: 'success' },
        sections: [
          {
            title: 'Bang diem can xu ly',
            records: gradeSheets.map((item) =>
              createTaskRecord(
                item.id,
                `${item.courseCode} · ${item.courseName}`,
                `${item.classLabel} · ${item.studentsPending} sinh vien can cap nhat`,
                `Cap nhat: ${item.lastUpdated}`,
                item.reviewStatus === 'review'
                  ? 'Cho review'
                  : item.reviewStatus === 'draft'
                    ? 'Ban nhap'
                    : 'Da publish',
                item.reviewStatus === 'review'
                  ? 'warning'
                  : item.reviewStatus === 'draft'
                    ? 'info'
                    : 'success',
              ),
            ),
          },
          {
            title: 'Contract',
            infoRows: [
              { label: 'Read API', value: 'GET /grades/sheets, GET /grades/sheets/:id' },
              { label: 'Write API', value: 'POST /grades, PATCH /grades/:id, POST /grades/publish' },
            ],
          },
        ],
        primaryAction: { label: 'Nhap diem batch', kind: 'primary' },
        secondaryActions: [{ label: 'Quay lai class dashboard', route: '/schedule/class-dashboard', kind: 'secondary' }],
      };
    case 'class-notification':
      return {
        eyebrow: 'Class notifications',
        title: 'Class notification composer',
        subtitle: 'Thong bao lop cua lecturer duoc tach thanh task screen rieng de backend noi audience va delivery result.',
        badge: { label: 'Compose-ready', tone: 'primary' },
        sections: [
          {
            title: 'Audience options',
            records: getNotificationAudienceOptions(USER_ROLES.LECTURER).map((item) =>
              createTaskRecord(
                item.id,
                item.label,
                item.description,
                `Reach: ${item.reach}`,
                'Co the chon',
                'info',
              ),
            ),
          },
          {
            title: 'Contract',
            infoRows: [
              { label: 'Mutation', value: 'POST /notifications/class-broadcast' },
              { label: 'Fields', value: 'classId, audienceId, title, message, sendAt' },
              { label: 'Feedback', value: 'deliveryCount, failedCount, invalidTargets' },
            ],
          },
        ],
        primaryAction: { label: 'Luu draft thong bao', kind: 'primary' },
        secondaryActions: [{ label: 'Gui ngay', kind: 'secondary' }],
        layout: 'narrow',
      };
    default:
      return null;
  }
}

export function getOperationsTaskConfig(
  task: OperationsTaskKey,
  role: string | null | undefined,
  liveData?: OperationsLivePayload,
): TaskScreenConfig | null {
  const canManageSystem = isSuperAdminRole(role);

  switch (task) {
    case 'approvals':
      return {
        eyebrow: 'Operations',
        title: 'Approval queue',
        subtitle: 'Phong hoc, lab va cac request can quyet dinh approve / reject theo kieu mobile-first.',
        badge: { label: 'Admin queue', tone: 'warning' },
        sections: [
          {
            title: 'Requests dang cho',
            records: getRoomApprovalItems().map((item) =>
              createTaskRecord(
                item.id,
                `${item.roomName} · ${item.requesterName}`,
                item.purpose,
                item.timeRange,
                item.status === 'pending' ? 'Dang cho' : item.status === 'approved' ? 'Da duyet' : 'Tu choi',
                item.status === 'pending' ? 'warning' : item.status === 'approved' ? 'success' : 'danger',
              ),
            ),
          },
          {
            title: 'Decision sheet contract',
            infoRows: [
              { label: 'Mutation', value: 'PATCH /room-booking/:id/decision' },
              { label: 'Fields', value: 'status, reviewerNote, approvedRoom, approvedTime' },
            ],
          },
        ],
        primaryAction: { label: 'Mo decision sheet', kind: 'primary' },
      };
    case 'users':
      return {
        eyebrow: 'Operations',
        title: 'User summary list / detail',
        subtitle: 'Chot UI cho list, detail va role review truoc khi backend CRUD user day du.',
        badge: {
          label: canManageSystem ? 'RBAC-aware' : 'Admin summary',
          tone: 'info',
        },
        sections: [
          {
            title: 'Tai khoan can xu ly',
            records: getUserSummaryRecords(role),
          },
          {
            title: 'Contract',
            infoRows: [
              { label: 'Read API', value: 'GET /admin/users, GET /admin/users/:id' },
              {
                label: 'Write API',
                value: canManageSystem
                  ? 'PATCH /admin/users/:id/role, PATCH /admin/users/:id/status'
                  : 'PATCH /admin/users/:id/status',
              },
            ],
          },
        ],
        primaryAction: { label: 'Mo user detail', kind: 'primary' },
      };
    case 'catalog':
      return {
        eyebrow: 'Operations',
        title: 'Course / semester management',
        subtitle: 'Tap trung vao danh muc hoc ky, mo mon va thay doi can publish cho he UIT.',
        badge: { label: 'Catalog-ready', tone: 'success' },
        sections: [
          {
            title: 'Danh muc gan day',
            records: getCatalogRecords(),
          },
          {
            title: 'Contract',
            infoRows: [
              { label: 'Read API', value: 'GET /semesters, GET /courses' },
              { label: 'Write API', value: 'POST /semesters, PATCH /semesters/:id, POST /courses' },
            ],
          },
        ],
        primaryAction: { label: 'Tao / cap nhat hoc ky', kind: 'primary' },
      };
    case 'fire-alerts':
      return {
        eyebrow: 'Safety & security',
        title: 'Fire alert history / detail',
        subtitle: 'Canh bao chay cua he UIT can hien ro open / resolved, vi tri va context gateway.',
        badge: { label: 'High priority', tone: 'danger' },
        sections: [
          {
            title: 'Canh bao gan day',
            records: getFireAlertRecords(liveData?.fireAlerts),
          },
          {
            title: 'Contract',
            infoRows: [
              { label: 'Read API', value: 'GET /safety/fire-alerts, GET /safety/fire-alerts/:id' },
              { label: 'Write API', value: 'PATCH /safety/fire-alerts/:id/resolve' },
            ],
          },
        ],
        primaryAction: { label: 'Mo log dang mo', kind: 'primary' },
      };
    case 'parking-ops':
      return {
        eyebrow: 'Parking + IoT',
        title: 'Parking ops detail',
        subtitle: 'Ra soat active sessions, slot health va telemetry freshness cua bai xe UIT.',
        badge: { label: 'Ops snapshot', tone: 'success' },
        sections: [
          {
            title: 'Ops records',
            records: getParkingOpsRecords(liveData?.parking),
          },
          {
            title: 'Gateway zones',
            records: getGatewayZones(role).map((item) =>
              createTaskRecord(
                item.id,
                item.label,
                `${item.deviceCount} thiet bi`,
                `${item.lastUpdated} · ${item.issueSummary}`,
                item.health,
                item.health === 'offline'
                  ? 'danger'
                  : item.health === 'warning' || item.health === 'stale'
                    ? 'warning'
                    : 'success',
              ),
            ),
          },
        ],
        primaryAction: { label: 'Mo parking overview', route: '/parking', kind: 'primary' },
      };
    case 'notifications':
      return {
        eyebrow: 'Broadcast',
        title: 'Broadcast notification composer',
        subtitle: 'Admin / Super Admin soan, preview va chon audience ngay trong flow mobile.',
        badge: { label: 'Composer-ready', tone: 'primary' },
        sections: [
          {
            title: 'Audience options',
            records: getNotificationAudienceOptions(role).map((item) =>
              createTaskRecord(
                item.id,
                item.label,
                item.description,
                `Reach: ${item.reach}`,
                'Co the chon',
                'info',
              ),
            ),
          },
          {
            title: 'Contract',
            infoRows: [
              { label: 'Mutation', value: 'POST /notifications/broadcast' },
              { label: 'Fields', value: 'audience, title, body, sendAt, priority' },
              { label: 'Delivery result', value: 'queued / delivered / failed' },
            ],
          },
        ],
        primaryAction: { label: 'Luu draft broadcast', kind: 'primary' },
        secondaryActions: [{ label: 'Gui ngay', kind: 'secondary' }],
        layout: 'narrow',
      };
    default:
      return null;
  }
}

export function getSettingsTaskConfig(
  task: SettingsTaskKey,
  role?: string | null,
): TaskScreenConfig | null {
  if (task !== 'system-controls') {
    return null;
  }

  return {
    eyebrow: 'System controls',
    title: 'Role, gateway & retention controls',
    subtitle: 'Bien the Super Admin cho role management, zone status va chinh sach du lieu trong UIT Smart Campus.',
    badge: {
      label: isSuperAdminRole(role) ? 'Super Admin' : 'Restricted',
      tone: isSuperAdminRole(role) ? 'success' : 'warning',
    },
    sections: [
      {
        title: 'Role management summary',
        records: getRolePermissionSummary(role).map((item) =>
          createTaskRecord(
            item.id,
            item.label,
            item.description,
            `Access: ${item.accessLevel}`,
            item.accessLevel === 'full' ? 'Toan quyen' : item.accessLevel === 'limited' ? 'Co gioi han' : 'Chi xem',
            item.accessLevel === 'full' ? 'success' : 'info',
          ),
        ),
      },
      {
        title: 'Gateway / zone oversight',
        records: getGatewayZones(role).map((item) =>
          createTaskRecord(
            item.id,
            item.label,
            item.issueSummary,
            `${item.lastUpdated} · ${item.deviceCount} thiet bi`,
            item.health,
            item.health === 'offline'
              ? 'danger'
              : item.health === 'warning' || item.health === 'stale'
                ? 'warning'
                : 'success',
          ),
        ),
      },
      {
        title: 'Policy contracts',
        infoRows: [
          { label: 'Read API', value: 'GET /admin/system/summary, GET /admin/permissions' },
          { label: 'Write API', value: 'PATCH /admin/permissions, PATCH /admin/retention-policies' },
          { label: 'Scope', value: 'Role mapping, retention, gateway config, audit trail' },
        ],
      },
    ],
    primaryAction: { label: 'Mo role review flow', kind: 'primary' },
    secondaryActions: [{ label: 'Quay ve settings', route: '/settings', kind: 'secondary' }],
  };
}
