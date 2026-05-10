import { USER_ROLES, formatFullName, formatGPA } from '@smart-campus/shared';

import type {
  AlertSeverity,
  DashboardSnapshot,
  ScheduleRecord,
  ServiceEntry,
  StatusTone,
  SupportState,
  TelemetryHealthState,
} from '@/types/app-data';

const DAY_LABELS: Record<number, string> = {
  1: 'Thứ hai',
  2: 'Thứ ba',
  3: 'Thứ tư',
  4: 'Thứ năm',
  5: 'Thứ sáu',
  6: 'Thứ bảy',
  7: 'Chủ nhật',
};

const DAY_LABELS_SHORT: Record<number, string> = {
  1: 'T2',
  2: 'T3',
  3: 'T4',
  4: 'T5',
  5: 'T6',
  6: 'T7',
  7: 'CN',
};

export function getRoleLabel(role?: string | null) {
  switch (role) {
    case USER_ROLES.LECTURER:
      return 'Giảng viên';
    case USER_ROLES.CANTEEN_ADMIN:
      return 'Quản trị canteen';
    case USER_ROLES.ADMIN:
      return 'Quản trị viên';
    case USER_ROLES.SUPER_ADMIN:
      return 'Quản trị hệ thống';
    default:
      return 'Sinh viên';
  }
}

export function getRoleScopedTabTitle(role?: string | null) {
  return isAdminRole(role) ? 'Vận hành' : 'Lịch';
}

export function isAdminRole(role?: string | null) {
  return role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN;
}

export function isSuperAdminRole(role?: string | null) {
  return role === USER_ROLES.SUPER_ADMIN;
}

export function isLecturerRole(role?: string | null) {
  return role === USER_ROLES.LECTURER;
}

export function isCanteenAdminRole(role?: string | null) {
  return role === USER_ROLES.CANTEEN_ADMIN;
}

export function canManageAttendanceRole(role?: string | null) {
  return isLecturerRole(role) || isSuperAdminRole(role);
}

export function canManageGradesRole(role?: string | null) {
  return isLecturerRole(role) || isSuperAdminRole(role);
}

export function canManageCanteenRole(role?: string | null) {
  return isCanteenAdminRole(role) || isAdminRole(role);
}

export function getGreetingName(
  user?: {
    firstName?: string | null;
    lastName?: string | null;
  } | null,
) {
  if (!user?.firstName && !user?.lastName) {
    return 'UITer';
  }

  return formatFullName(user.firstName ?? '', user.lastName ?? '');
}

export function getDayLabel(dayOfWeek: number) {
  return DAY_LABELS[dayOfWeek] ?? 'Khác';
}

export function getDayLabelShort(dayOfWeek: number) {
  return DAY_LABELS_SHORT[dayOfWeek] ?? '?';
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Chưa có dữ liệu';
  }

  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

export function formatShortDate(value?: string | null) {
  if (!value) {
    return 'Chưa có dữ liệu';
  }

  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatCurrency(value: number) {
  return value.toLocaleString('vi-VN');
}

export function formatSubscriptionDate(value?: string | null) {
  if (!value) {
    return 'Chưa kích hoạt';
  }

  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function groupScheduleByDay(schedule: ScheduleRecord[]) {
  return schedule.reduce<Record<number, ScheduleRecord[]>>((acc, item) => {
    acc[item.dayOfWeek] = [...(acc[item.dayOfWeek] ?? []), item];
    return acc;
  }, {});
}

export function getTodayDayOfWeek() {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
}

export function getTodaySchedule(schedule: ScheduleRecord[]) {
  const today = getTodayDayOfWeek();
  return schedule.filter((item) => item.dayOfWeek === today);
}

export function getNextClass(schedule: ScheduleRecord[]) {
  const today = getTodayDayOfWeek();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const ranked = [...schedule].sort((a, b) => {
    const dayDeltaA = (a.dayOfWeek + 7 - today) % 7;
    const dayDeltaB = (b.dayOfWeek + 7 - today) % 7;
    if (dayDeltaA !== dayDeltaB) {
      return dayDeltaA - dayDeltaB;
    }

    return a.startTime.localeCompare(b.startTime);
  });

  return (
    ranked.find((item) => {
      const dayDelta = (item.dayOfWeek + 7 - today) % 7;
      if (dayDelta > 0) {
        return true;
      }

      const [hours, minutes] = item.startTime.split(':').map(Number);
      return hours * 60 + minutes >= currentMinutes;
    }) ?? null
  );
}

export function getTelemetryHealthState(
  lastUpdated?: string | null,
  fireDetected?: boolean,
  isOffline = false,
): TelemetryHealthState {
  if (isOffline) {
    return 'offline';
  }

  if (!lastUpdated) {
    return 'no-data';
  }

  if (fireDetected) {
    return 'fire-alert';
  }

  const age = Date.now() - new Date(lastUpdated).getTime();
  if (age > 30_000) {
    return 'stale';
  }

  return 'online';
}

export function getTelemetryHealthLabel(state: TelemetryHealthState) {
  switch (state) {
    case 'fire-alert':
      return 'Cảnh báo cháy';
    case 'offline':
      return 'Mất kết nối';
    case 'stale':
      return 'Dữ liệu cũ';
    case 'no-data':
      return 'Chưa có dữ liệu';
    default:
      return 'Đang trực tuyến';
  }
}

export function getSeverityLabel(severity: AlertSeverity) {
  switch (severity) {
    case 'critical':
      return 'Khẩn cấp';
    case 'warning':
      return 'Cần chú ý';
    default:
      return 'Thông thường';
  }
}

export function getSupportStateLabel(state: SupportState) {
  switch (state) {
    case 'live':
      return 'Đang hỗ trợ';
    case 'partial':
      return 'Tạm thời chưa khả dụng';
    default:
      return 'Không khả dụng';
  }
}

export function getSupportStateTone(state: SupportState): StatusTone {
  switch (state) {
    case 'live':
      return 'success';
    case 'partial':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function getDashboardHeroSummary(snapshot: DashboardSnapshot) {
  if (isAdminRole(snapshot.role)) {
    return snapshot.parking
      ? `Bãi xe còn ${snapshot.parking.availableSlots}/${snapshot.parking.totalSlots} chỗ, ${snapshot.unreadCount} mục cần theo dõi.`
      : `${snapshot.unreadCount} mục vận hành cần theo dõi hôm nay.`;
  }

  if (snapshot.nextClass) {
    return `Buổi tiếp theo: ${snapshot.nextClass.course.name} lúc ${snapshot.nextClass.startTime}.`;
  }

  if (typeof snapshot.gpa?.gpa === 'number') {
    return `GPA hiện tại ${formatGPA(snapshot.gpa.gpa)} và ${snapshot.unreadCount} thông báo chưa đọc.`;
  }

  return 'Theo dõi lịch học, parking và thông báo trong một nơi duy nhất.';
}

export function getRoleQuickActions(role?: string | null) {
  if (isAdminRole(role)) {
    return [
      { id: 'operations', label: 'Vận hành', icon: 'pulse-outline', route: '/schedule' },
      { id: 'alerts', label: 'Cảnh báo', icon: 'notifications-outline', route: '/alerts' },
      { id: 'parking', label: 'Parking + IoT', icon: 'car-sport-outline', route: '/parking' },
      { id: 'campus-map', label: 'Bản đồ khuôn viên', icon: 'map-outline', route: '/services/campus-map' },
      { id: 'gps-sos', label: 'GPS/SOS', icon: 'locate-outline', route: '/services/gps-sos' },
      { id: 'services', label: 'Dịch vụ', icon: 'grid-outline', route: '/services' },
    ];
  }

  if (isLecturerRole(role)) {
    return [
      { id: 'schedule', label: 'Lịch dạy', icon: 'calendar-outline', route: '/schedule' },
      { id: 'attendance', label: 'Điểm danh QR', icon: 'qr-code-outline', route: '/services/attendance' },
      { id: 'grades', label: 'Nhập điểm', icon: 'bar-chart-outline', route: '/services/grades/lecturer' },
      { id: 'alerts', label: 'Cảnh báo', icon: 'notifications-outline', route: '/alerts' },
      { id: 'parking', label: 'Parking + IoT', icon: 'car-sport-outline', route: '/parking' },
    ];
  }

  return [
    { id: 'schedule', label: 'Lịch học', icon: 'calendar-outline', route: '/schedule' },
    { id: 'grades', label: 'Điểm & GPA', icon: 'bar-chart-outline', route: '/services/grades' },
    { id: 'parking', label: 'Parking + IoT', icon: 'car-sport-outline', route: '/parking' },
    { id: 'campus-map', label: 'Bản đồ khuôn viên', icon: 'map-outline', route: '/services/campus-map' },
    { id: 'alerts', label: 'Cảnh báo', icon: 'notifications-outline', route: '/alerts' },
  ];
}

export function getServiceEntries(role?: string | null): ServiceEntry[] {
  const teachingCategory = 'Công cụ giảng dạy' as const;
  const adminCategory = 'Công cụ quản trị' as const;
  const isStudentRole = role === USER_ROLES.STUDENT;
  const isOperatorAdminRole = role === USER_ROLES.ADMIN;
  const attendanceManager = canManageAttendanceRole(role);
  const gradesManager = canManageGradesRole(role);
  const canteenManager = canManageCanteenRole(role);
  const canOpenAttendance = isStudentRole || attendanceManager;
  const canOpenGrades = isStudentRole || gradesManager;
  const gradesBlockedReason = isOperatorAdminRole
    ? 'Tài khoản quản trị viên không có quyền nhập điểm. Chỉ giảng viên và quản trị hệ thống mới được truy cập.'
    : 'Vai trò này chưa được hỗ trợ luồng nhập điểm trong ứng dụng.';
  const attendanceBlockedReason = isOperatorAdminRole
    ? 'Tài khoản quản trị viên không có quyền mở điểm danh QR. Chỉ sinh viên, giảng viên và quản trị hệ thống mới được truy cập.'
    : 'Chỉ sinh viên, giảng viên và quản trị hệ thống mới có thể dùng điểm danh QR.';

  const entries: ServiceEntry[] = [
    {
      id: 'grades',
      title: isStudentRole ? 'Điểm & GPA' : 'Nhập điểm',
      summary: isStudentRole
        ? 'Theo dõi bảng điểm theo học kỳ.'
        : gradesManager
          ? 'Nhập điểm theo lớp, cấu hình trọng số và tự tính trung bình.'
          : isOperatorAdminRole
            ? 'Vai trò quản trị viên không thể mở bảng nhập điểm trong ứng dụng.'
            : 'Luồng nhập điểm cho vai trò này hiện chưa khả dụng.',
      category: gradesManager ? teachingCategory : 'Học vụ',
      icon: 'bar-chart-outline',
      supportState: canOpenGrades ? 'live' : 'unsupported',
      isInteractive: canOpenGrades,
      disabledReason: canOpenGrades ? undefined : gradesBlockedReason,
      lastVerifiedSource: 'grades',
      primaryAction: isStudentRole
        ? 'Xem bảng điểm'
        : gradesManager
          ? 'Mở bảng nhập điểm'
          : 'Xem lý do',
      route: isStudentRole
        ? '/services/grades'
        : gradesManager
          ? '/services/grades/lecturer'
          : '/services/grades',
      description: isStudentRole
        ? 'Hiển thị GPA, tổng tín chỉ và các học phần đã có điểm.'
        : gradesManager
          ? 'Giảng viên và quản trị hệ thống có thể nhập điểm theo lớp học phần.'
          : isOperatorAdminRole
            ? 'Role quản trị viên không có quyền nhập hoặc chỉnh sửa điểm trong ứng dụng.'
            : 'Chức năng nhập điểm cho vai trò này hiện chưa khả dụng trong ứng dụng.',
    },
    {
      id: 'parking',
      title: 'Parking + IoT',
      summary: 'Theo dõi chỗ trống, cảm biến và gói gửi xe.',
      category: 'Tiện ích campus',
      icon: 'car-sport-outline',
      supportState: 'live',
      isInteractive: true,
      lastVerifiedSource: 'parking',
      primaryAction: 'Mở Parking',
      route: '/services/parking',
      description: 'Hỗ trợ A1-A2, cảm biến môi trường, đăng ký xe và thanh toán MoMo.',
    },
    {
      id: 'events',
      title: 'Sự kiện & cộng đồng',
      summary: 'Theo dõi bản tin sự kiện và cộng đồng UIT.',
      category: 'Đời sống campus',
      icon: 'megaphone-outline',
      supportState: 'live',
      isInteractive: true,
      lastVerifiedSource: 'events',
      primaryAction: 'Xem sự kiện',
      route: '/services/events',
      description: 'Cập nhật bài viết sự kiện, hội thảo và hoạt động cộng đồng từ UIT.',
    },
    {
      id: 'course-registration',
      title: 'Đăng ký môn học',
      summary: 'Tính năng đang được cập nhật và tạm thời chưa khả dụng trong ứng dụng.',
      category: 'Học vụ',
      icon: 'document-text-outline',
      supportState: 'unsupported',
      isInteractive: false,
      disabledReason: 'Đăng ký môn học hiện đang được cập nhật và tạm thời chưa khả dụng trong ứng dụng.',
      lastVerifiedSource: 'schedule',
      primaryAction: 'Xem trạng thái',
      route: '/services',
      description: 'Tính năng đăng ký học phần đang được cập nhật và sẽ mở lại sau.',
    },
    {
      id: 'attendance',
      title: 'Điểm danh QR',
      summary: attendanceManager
        ? 'Quản lý phiên điểm danh và theo dõi check-in theo lớp.'
        : isStudentRole
          ? 'Quét mã QR trên màn hình lớp để điểm danh.'
          : isOperatorAdminRole
            ? 'Vai trò quản trị viên không thể mở khu vực điểm danh QR.'
            : 'Vai trò hiện tại không thể dùng điểm danh QR.',
      category: attendanceManager ? teachingCategory : 'Học vụ',
      icon: 'qr-code-outline',
      supportState: canOpenAttendance ? 'live' : 'unsupported',
      isInteractive: canOpenAttendance,
      disabledReason: canOpenAttendance ? undefined : attendanceBlockedReason,
      lastVerifiedSource: 'schedule',
      primaryAction: attendanceManager
        ? 'Quản lý phiên QR'
        : isStudentRole
          ? 'Mở điểm danh QR'
          : 'Xem lý do',
      route: '/services/attendance',
      description: attendanceManager
        ? 'Giảng viên và quản trị hệ thống có thể mở/đóng phiên QR và theo dõi điểm danh.'
        : isStudentRole
          ? 'Quét mã QR động trên màn hình lớp để ghi nhận có mặt.'
          : isOperatorAdminRole
            ? 'Role quản trị viên không có quyền quản lý hoặc quét điểm danh QR trong ứng dụng.'
            : 'Điểm danh QR chỉ dành cho sinh viên, giảng viên và quản trị hệ thống.',
    },
    {
      id: 'room-booking',
      title: 'Đặt phòng',
      summary: 'Đặt phòng và theo dõi trạng thái phê duyệt.',
      category: 'Tiện ích campus',
      icon: 'business-outline',
      supportState: 'live',
      isInteractive: true,
      lastVerifiedSource: 'manual',
      primaryAction: 'Mở đặt phòng',
      route: '/services/room-booking',
      description: 'Đặt phòng học, xem yêu cầu của tôi và queue phê duyệt.',
    },
    {
      id: 'canteen',
      title: 'Canteen',
      summary: canteenManager
        ? 'Quản lý menu, đơn hàng và trạng thái phục vụ.'
        : 'Đặt món, thanh toán online và theo dõi hóa đơn.',
      category: 'Đời sống campus',
      icon: 'restaurant-outline',
      supportState: 'live',
      isInteractive: true,
      lastVerifiedSource: 'payments',
      primaryAction: canteenManager ? 'Mở quản trị canteen' : 'Mở menu canteen',
      route: canteenManager ? '/services/canteen/admin' : '/services/canteen',
      description: canteenManager
        ? 'Canteen admin, admin và super admin có thể cập nhật menu, xem đơn và hoàn thành đơn.'
        : 'Sinh viên và giảng viên có thể đặt món, thanh toán và xem lịch sử hóa đơn.',
    },
    {
      id: 'gps-sos',
      title: 'GPS/SOS',
      summary: 'Gửi yêu cầu SOS theo vị trí snapshot và theo dõi hỗ trợ gần bạn.',
      category: 'Tiện ích campus',
      icon: 'locate-outline',
      supportState: 'live',
      isInteractive: true,
      lastVerifiedSource: 'manual',
      primaryAction: 'Mở GPS/SOS',
      route: '/services/gps-sos',
      description: 'Vị trí chỉ được ghi nhận khi bấm SOS, không theo dõi realtime liên tục.',
    },
    {
      id: 'library',
      title: 'Thư viện',
      summary: 'Tra cứu sách, giữ chỗ và theo dõi lịch sử mượn trả.',
      category: 'Đời sống campus',
      icon: 'book-outline',
      supportState: 'live',
      isInteractive: true,
      lastVerifiedSource: 'manual',
      primaryAction: 'Mở thư viện',
      route: isAdminRole(role) ? '/services/library/admin' : '/services/library',
      description: 'Theo dõi bản sao còn sẵn, giữ chỗ và gia hạn theo chính sách vai trò.',
    },
    {
      id: 'campus-map',
      title: 'Bản đồ khuôn viên',
      summary: 'Tra cứu không gian khuôn viên UIT bằng tour 360 tích hợp.',
      category: 'Đời sống campus',
      icon: 'map-outline',
      supportState: 'live',
      isInteractive: true,
      lastVerifiedSource: 'manual',
      primaryAction: 'Mở tour 3D UIT',
      route: '/services/campus-map',
      description: 'Trải nghiệm bản đồ 360 khuôn viên UIT trực tiếp trong ứng dụng.',
    },
    {
      id: 'chatbot',
      title: 'AI Chatbot',
      summary: 'Trợ lý nội bộ trả lời từ dữ liệu thật trong ứng dụng.',
      category: 'Tiện ích campus',
      icon: 'chatbubble-ellipses-outline',
      supportState: 'live',
      isInteractive: true,
      lastVerifiedSource: 'manual',
      primaryAction: 'Mở AI Chatbot',
      route: '/services/chatbot',
      description: 'Không gọi AI ngoài; truy vấn theo quyền và trả lời kèm nguồn/citation.',
    },
    {
      id: 'smart-classroom',
      title: 'Lớp học thông minh',
      summary: 'Sắp triển khai điều khiển IoT phòng học.',
      category: isLecturerRole(role) ? teachingCategory : adminCategory,
      icon: 'hardware-chip-outline',
      supportState: 'unsupported',
      isInteractive: false,
      disabledReason: 'Sắp triển khai lớp học thông minh.',
      lastVerifiedSource: 'iot',
      primaryAction: 'Theo dõi cập nhật',
      route: '/services/smart-classroom',
      description: 'Sắp triển khai điều khiển thiết bị phòng học theo quyền.',
    },
  ];

  if (isAdminRole(role)) {
    entries.push({
      id: 'admin-tools',
      title: 'Công cụ quản trị',
      summary: 'Tổng hợp công cụ dành cho quản trị viên.',
      category: adminCategory,
      icon: 'shield-checkmark-outline',
      supportState: 'live',
      isInteractive: true,
      lastVerifiedSource: 'manual',
      primaryAction: 'Mở công cụ quản trị',
      route: '/services/admin-tools',
      description: 'Ưu tiên các luồng đang hỗ trợ như parking và cảnh báo.',
    });
  }

  return entries;
}

export function formatGpaValue(value?: number | null) {
  if (typeof value !== 'number') {
    return '0.00';
  }

  return formatGPA(value);
}
