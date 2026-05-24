import { USER_ROLES } from '@smart-campus/shared';

import type {
  FireAlertsPayload,
  OperationsTaskKey,
  ScheduleTaskKey,
  SettingsTaskKey,
  StatusTone,
  TaskRecord,
  TaskScreenConfig,
} from '@/types/app-data';
import {
  formatDateTime,
  getRoleLabel,
  getSupportStateLabel,
  getSupportStateTone,
} from '@/utils/app';

interface PermissionCopy {
  title: string;
  description: string;
}

interface OperationsLivePayload {
  parking?: {
    availableSlots: number;
    totalSlots: number;
    activeSessions?: number;
    occupiedSlots?: number;
    lastUpdated?: string | null;
  } | null;
  fireAlerts?: FireAlertsPayload;
  telemetry?: {
    deviceIp?: string | null;
    reportedAt?: string;
    fireDetected?: boolean;
  } | null;
  unreadCount?: number;
  gpa?: {
    gpa: number;
    totalCredits: number;
    totalCourses: number;
  } | null;
}

function createTaskRecord(
  id: string,
  title: string,
  subtitle: string,
  meta: string,
  statusLabel: string,
  tone: StatusTone,
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

function buildUnavailableConfig({
  eyebrow,
  title,
  subtitle,
  reason,
  route,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  reason: string;
  route: string;
}): TaskScreenConfig {
  return {
    eyebrow,
    title,
    subtitle,
    badge: {
      label: getSupportStateLabel('unsupported'),
      tone: getSupportStateTone('unsupported'),
    },
    supportState: 'unsupported',
    disabledReason: reason,
    lastVerifiedSource: 'manual',
    sections: [
      {
        title: 'Trạng thái hiện tại',
        body: reason,
      },
      {
        title: 'Gợi ý',
        infoRows: [
          { label: 'Tình trạng', value: 'Tạm thời chưa khả dụng' },
          { label: 'Tiếp theo', value: 'Theo dõi cập nhật trong ứng dụng' },
        ],
      },
    ],
    primaryAction: {
      label: 'Quay lại',
      route,
      kind: 'primary',
      supportState: 'unsupported',
      lastVerifiedSource: 'manual',
    },
    layout: 'narrow',
  };
}

export function isSuperAdminRole(role?: string | null) {
  return role === USER_ROLES.SUPER_ADMIN;
}

export function getPermissionDeniedCopy(role?: string | null): PermissionCopy {
  return {
    title: 'Bạn chưa có quyền truy cập',
    description: `${getRoleLabel(role)} hiện không được mở màn này trong phiên bản đang hỗ trợ.`,
  };
}

export function getScheduleTaskConfig(task: ScheduleTaskKey): TaskScreenConfig | null {
  switch (task) {
    case 'class-dashboard':
      return buildUnavailableConfig({
        eyebrow: 'Công cụ giảng dạy',
        title: 'Bảng lớp học',
        subtitle: 'Tạm thời chưa khả dụng trong phiên bản hiện tại.',
        reason: 'Tính năng bảng lớp học đang được hoàn thiện. Theo dõi cập nhật trong ứng dụng.',
        route: '/schedule',
      });
    case 'session-editor':
      return buildUnavailableConfig({
        eyebrow: 'Công cụ giảng dạy',
        title: 'Tạo hoặc sửa buổi học',
        subtitle: 'Tạm thời chưa khả dụng trong phiên bản hiện tại.',
        reason: 'Tính năng tạo và chỉnh buổi học đang được hoàn thiện. Theo dõi cập nhật trong ứng dụng.',
        route: '/schedule',
      });
    case 'attendance-session':
      return {
        eyebrow: 'Điểm danh QR',
        title: 'Phiên điểm danh QR',
        subtitle: 'Quản lý phiên điểm danh theo lớp được phân công.',
        badge: {
          label: getSupportStateLabel('live'),
          tone: getSupportStateTone('live'),
        },
        supportState: 'live',
        lastVerifiedSource: 'schedule',
        sections: [
          {
            title: 'Tác vụ',
            body: 'Mở phiên QR, trình chiếu mã động và theo dõi danh sách sinh viên đã check-in.',
          },
        ],
        primaryAction: {
          label: 'Mở quản lý điểm danh',
          route: '/services/attendance/lecturer',
          kind: 'primary',
          supportState: 'live',
          lastVerifiedSource: 'schedule',
        },
      };
    case 'attendance-report':
      return {
        eyebrow: 'Điểm danh QR',
        title: 'Báo cáo điểm danh',
        subtitle: 'Xem lịch sử phiên và số lượng check-in theo lớp.',
        badge: {
          label: getSupportStateLabel('live'),
          tone: getSupportStateTone('live'),
        },
        supportState: 'live',
        lastVerifiedSource: 'schedule',
        sections: [
          {
            title: 'Nguồn dữ liệu',
            infoRows: [
              { label: 'Lịch sử phiên', value: 'GET /attendance/history' },
              { label: 'Danh sách check-in', value: 'GET /attendance/session/:id/records' },
            ],
          },
        ],
        primaryAction: {
          label: 'Mở quản lý điểm danh',
          route: '/services/attendance/lecturer',
          kind: 'primary',
          supportState: 'live',
          lastVerifiedSource: 'schedule',
        },
      };
    case 'grade-sheet':
      return buildUnavailableConfig({
        eyebrow: 'Điểm số',
        title: 'Bảng nhập điểm',
        subtitle: 'Phiên bản hiện tại mới hỗ trợ xem điểm và GPA của tài khoản đăng nhập.',
        reason: 'Tính năng nhập và công bố điểm đang được hoàn thiện. Theo dõi cập nhật trong ứng dụng.',
        route: '/services/grades',
      });
    case 'class-notification':
      return buildUnavailableConfig({
        eyebrow: 'Thông báo lớp',
        title: 'Soạn thông báo lớp',
        subtitle: 'Tạm thời chưa khả dụng trong phiên bản hiện tại.',
        reason: 'Tính năng thông báo theo lớp đang được hoàn thiện. Theo dõi cập nhật trong ứng dụng.',
        route: '/alerts',
      });
    default:
      return null;
  }
}

export function getOperationsTaskConfig(
  task: OperationsTaskKey,
  role: string | null | undefined,
  liveData?: OperationsLivePayload,
): TaskScreenConfig | null {
  switch (task) {
    case 'fire-alerts': {
      const items = liveData?.fireAlerts?.items ?? [];

      return {
        eyebrow: 'PCCC',
        title: 'Lịch sử cảnh báo cháy',
        subtitle: 'Tổng hợp fire alert mới nhất cho khu parking.',
        badge: {
          label: getSupportStateLabel('live'),
          tone: getSupportStateTone('live'),
        },
        supportState: 'live',
        lastVerifiedSource: 'safety',
        sections: [
          {
            title: 'Tổng quan',
            infoRows: [
              { label: 'Số cảnh báo', value: `${items.length}` },
              {
                label: 'Đang mở',
                value: `${items.filter((item) => !item.isResolved).length}`,
              },
              {
                label: 'Nguồn dữ liệu',
                value: 'GET /safety/fire-alerts',
              },
            ],
          },
          items.length > 0
            ? {
                title: 'Mục gần đây',
                records: items.slice(0, 5).map((item) =>
                  createTaskRecord(
                    item.id,
                    item.message,
                    `Cổng ${item.gateId}`,
                    formatDateTime(item.reportedAt),
                    item.isResolved ? 'Đã xử lý' : 'Đang mở',
                    item.isResolved ? 'info' : 'danger',
                    '/alerts',
                  ),
                ),
              }
            : {
                title: 'Mục gần đây',
                body: 'Hiện chưa có bản ghi cảnh báo cháy nào để hiển thị.',
              },
        ],
        primaryAction: {
          label: 'Mở trung tâm cảnh báo',
          route: '/alerts',
          kind: 'primary',
          supportState: 'live',
          lastVerifiedSource: 'safety',
        },
      };
    }
    case 'parking-ops':
      return {
        eyebrow: 'Parking + IoT',
        title: 'Tổng quan vận hành parking',
        subtitle: 'Snapshot vận hành thật của bãi xe UIT ở thời điểm hiện tại.',
        badge: {
          label: getSupportStateLabel('live'),
          tone: getSupportStateTone('live'),
        },
        supportState: 'live',
        lastVerifiedSource: 'parking',
        sections: [
          {
            title: 'Snapshot hiện tại',
            infoRows: [
              {
                label: 'Chỗ trống',
                value: liveData?.parking
                  ? `${liveData.parking.availableSlots}/${liveData.parking.totalSlots}`
                  : 'Chưa có dữ liệu',
              },
              {
                label: 'Phiên đang mở',
                value: `${liveData?.parking?.activeSessions ?? 0}`,
              },
              {
                label: 'Cập nhật',
                value: formatDateTime(liveData?.parking?.lastUpdated ?? null),
              },
              {
                label: 'Telemetry',
                value: liveData?.telemetry?.deviceIp
                  ? `${liveData.telemetry.deviceIp} · ${formatDateTime(liveData.telemetry.reportedAt)}`
                  : 'Chưa có snapshot telemetry',
              },
            ],
          },
        ],
        primaryAction: {
          label: 'Mở Parking + IoT',
          route: '/parking',
          kind: 'primary',
          supportState: 'live',
          lastVerifiedSource: 'parking',
        },
      };
    case 'notifications':
      return {
        eyebrow: 'Vận hành',
        title: 'Thông báo diện rộng',
        subtitle: 'Gửi thông báo toàn trường hoặc theo vai trò active.',
        badge: {
          label: getSupportStateLabel('live'),
          tone: getSupportStateTone('live'),
        },
        supportState: 'live',
        lastVerifiedSource: 'notifications',
        sections: [
          {
            title: 'Đang hỗ trợ',
            infoRows: [
              { label: 'Toàn trường', value: 'scope=all' },
              { label: 'Theo vai trò', value: 'student · lecturer · admin' },
              { label: 'Nguồn dữ liệu', value: 'POST /notifications' },
            ],
          },
        ],
        primaryAction: {
          label: 'Mở broadcast',
          route: '/operations/notifications',
          kind: 'primary',
          supportState: 'live',
          lastVerifiedSource: 'notifications',
        },
      };
    case 'approvals':
      return {
        eyebrow: 'Vận hành',
        title: 'Phê duyệt yêu cầu',
        subtitle: 'Duyệt yêu cầu đặt phòng theo queue pending.',
        badge: {
          label: getSupportStateLabel('live'),
          tone: getSupportStateTone('live'),
        },
        supportState: 'live',
        lastVerifiedSource: 'manual',
        sections: [
          {
            title: 'Nguồn dữ liệu',
            infoRows: [
              { label: 'Queue pending', value: 'GET /room-bookings?status=pending' },
              { label: 'Duyệt/Từ chối', value: 'PATCH /room-bookings/:id/approve|reject' },
            ],
          },
        ],
        primaryAction: {
          label: 'Mở queue phê duyệt',
          route: '/services/room-booking/approvals',
          kind: 'primary',
          supportState: 'live',
          lastVerifiedSource: 'manual',
        },
      };
    case 'users':
      return {
        eyebrow: 'Vận hành',
        title: 'Tài khoản người dùng',
        subtitle: 'Quản lý người dùng, vai trò và trạng thái đăng nhập.',
        badge: {
          label: getSupportStateLabel('live'),
          tone: getSupportStateTone('live'),
        },
        supportState: 'live',
        lastVerifiedSource: 'users',
        sections: [
          {
            title: 'Đang hỗ trợ',
            infoRows: [
              { label: 'Danh sách user', value: 'GET /users' },
              { label: 'Đổi role', value: 'PATCH /users/:id/role' },
              { label: 'Khóa/mở login', value: 'PATCH /users/:id/active' },
            ],
          },
        ],
        primaryAction: {
          label: 'Mở quản lý user',
          route: '/operations/users',
          kind: 'primary',
          supportState: 'live',
          lastVerifiedSource: 'users',
        },
      };
    case 'catalog':
      return {
        eyebrow: 'Vận hành',
        title: 'Danh mục học vụ',
        subtitle: 'Quản trị học phần, lớp học phần và lịch học.',
        badge: {
          label: getSupportStateLabel('live'),
          tone: getSupportStateTone('live'),
        },
        supportState: 'live',
        lastVerifiedSource: 'schedule',
        sections: [
          {
            title: 'Nguồn dữ liệu',
            infoRows: [
              { label: 'Danh mục', value: 'GET /catalog/*' },
              { label: 'Tạo lớp', value: 'POST /catalog/class-sections' },
              { label: 'Lịch học', value: 'PATCH /catalog/class-sections/:id/meetings' },
            ],
          },
        ],
        primaryAction: {
          label: 'Mở quản trị danh mục',
          route: '/services/admin-catalog',
          kind: 'primary',
          supportState: 'live',
          lastVerifiedSource: 'schedule',
        },
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
    eyebrow: 'Thiết lập hệ thống',
    title: 'Cấu hình hệ thống',
    subtitle: 'Khu vực cấu hình dành cho Super Admin.',
    badge: {
      label: getSupportStateLabel('unsupported'),
      tone: getSupportStateTone('unsupported'),
    },
    supportState: 'unsupported',
    disabledReason: 'Tạm thời chưa khả dụng. Theo dõi cập nhật trong ứng dụng.',
    lastVerifiedSource: 'manual',
    sections: [
      {
        title: 'Trạng thái hiện tại',
        body:
          role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN
            ? 'Tài khoản của bạn có quyền quản trị. Khu vực cấu hình hệ thống sẽ được mở trong các bản cập nhật sau.'
            : `${getRoleLabel(role)} không có quyền mở khu vực này.`,
      },
      {
        title: 'Đang hỗ trợ',
        infoRows: [
          { label: 'Parking + IoT', value: 'Theo dõi trạng thái bãi xe và cảm biến' },
          { label: 'Hồ sơ cá nhân', value: 'Cập nhật thông tin tài khoản' },
          { label: 'Thông báo', value: 'Danh sách và trạng thái đã đọc' },
        ],
      },
      {
        title: 'Sắp triển khai',
        infoRows: [
          { label: 'RBAC', value: 'Chưa hỗ trợ quản lý vai trò và phân quyền chi tiết' },
          { label: 'Cấu hình gateway', value: 'Chưa hỗ trợ thao tác cấu hình trực tiếp trên ứng dụng' },
          { label: 'Chính sách lưu trữ', value: 'Chưa hỗ trợ thiết lập trong phiên bản hiện tại' },
        ],
      },
    ],
    primaryAction: {
      label: 'Quay lại cài đặt',
      route: '/settings',
      kind: 'primary',
      supportState: 'unsupported',
      lastVerifiedSource: 'manual',
    },
  };
}
