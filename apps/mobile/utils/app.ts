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
      return 'Sắp triển khai';
  }
}

export function getSupportStateTone(state: SupportState): StatusTone {
  switch (state) {
    case 'live':
      return 'success';
    case 'partial':
      return 'warning';
    default:
      return 'info';
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
      { id: 'services', label: 'Dịch vụ', icon: 'grid-outline', route: '/services' },
    ];
  }

  if (isLecturerRole(role)) {
    return [
      { id: 'schedule', label: 'Lịch dạy', icon: 'calendar-outline', route: '/schedule' },
      { id: 'grades', label: 'Điểm & GPA', icon: 'bar-chart-outline', route: '/services/grades' },
      { id: 'alerts', label: 'Cảnh báo', icon: 'notifications-outline', route: '/alerts' },
      { id: 'parking', label: 'Parking + IoT', icon: 'car-sport-outline', route: '/parking' },
    ];
  }

  return [
    { id: 'schedule', label: 'Lịch học', icon: 'calendar-outline', route: '/schedule' },
    { id: 'grades', label: 'Điểm & GPA', icon: 'bar-chart-outline', route: '/services/grades' },
    { id: 'parking', label: 'Parking + IoT', icon: 'car-sport-outline', route: '/parking' },
    { id: 'alerts', label: 'Cảnh báo', icon: 'notifications-outline', route: '/alerts' },
  ];
}

export function getServiceEntries(role?: string | null): ServiceEntry[] {
  const teachingCategory = 'Công cụ giảng dạy' as const;
  const adminCategory = 'Công cụ quản trị' as const;
  const isStudentRole = role === USER_ROLES.STUDENT;
  const isCanteenAdmin = role === USER_ROLES.CANTEEN_ADMIN;

  const entries: ServiceEntry[] = [
    {
      id: 'grades',
      title: 'Điểm & GPA',
      summary: 'Theo dõi bảng điểm theo học kỳ.',
      category: 'Học vụ',
      icon: 'bar-chart-outline',
      supportState: 'live',
      isInteractive: true,
      lastVerifiedSource: 'grades',
      primaryAction: 'Xem bảng điểm',
      route: '/services/grades',
      description: 'Hiển thị GPA, tổng tín chỉ và các học phần đã có điểm.',
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
      route: '/parking',
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
      summary: isStudentRole
        ? 'Đăng ký học phần theo lớp mở.'
        : 'Tính năng dành cho tài khoản sinh viên.',
      category: 'Học vụ',
      icon: 'document-text-outline',
      supportState: isStudentRole ? 'live' : 'unsupported',
      isInteractive: isStudentRole,
      disabledReason: isStudentRole ? undefined : 'Chỉ tài khoản sinh viên mới có thể đăng ký học phần.',
      lastVerifiedSource: 'schedule',
      primaryAction: isStudentRole ? 'Mở đăng ký' : 'Xem trạng thái',
      route: isStudentRole ? '/services/course-registration' : '/services',
      description: isStudentRole
        ? 'Đăng ký, hủy đăng ký và theo dõi trạng thái học phần.'
        : 'Tính năng đăng ký học phần chỉ áp dụng cho sinh viên.',
    },
    {
      id: 'attendance',
      title: 'Điểm danh QR',
      summary: 'Quét mã QR trên màn hình lớp để điểm danh (sinh viên).',
      category: isLecturerRole(role) ? teachingCategory : 'Học vụ',
      icon: 'qr-code-outline',
      supportState: 'live',
      isInteractive: true,
      lastVerifiedSource: 'schedule',
      primaryAction: isLecturerRole(role) ? 'Quản lý phiên QR' : 'Mở điểm danh QR',
      route: '/services/attendance',
      description: isLecturerRole(role)
        ? 'Giảng viên mở và đóng phiên QR cho lớp được phân công.'
        : 'Quét mã QR động trên màn hình lớp để ghi nhận có mặt.',
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
      summary: isCanteenAdmin
        ? 'Quản lý menu, đơn hàng và trạng thái phục vụ.'
        : 'Đặt món, thanh toán online và theo dõi hóa đơn.',
      category: 'Đời sống campus',
      icon: 'restaurant-outline',
      supportState: 'live',
      isInteractive: true,
      lastVerifiedSource: 'payments',
      primaryAction: isCanteenAdmin ? 'Mở quản trị canteen' : 'Mở menu canteen',
      route: isCanteenAdmin ? '/services/canteen/admin' : '/services/canteen',
      description: isCanteenAdmin
        ? 'Quản trị canteen cập nhật món ăn, xem đơn và hoàn thành đơn đã thanh toán.'
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
      route: '/services/library',
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
