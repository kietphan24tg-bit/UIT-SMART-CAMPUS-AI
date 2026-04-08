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
    ];
  }

  if (isLecturerRole(role)) {
    return [
      { id: 'schedule', label: 'Lịch dạy', icon: 'calendar-outline', route: '/schedule' },
      { id: 'grades', label: 'Điểm & GPA', icon: 'bar-chart-outline', route: '/services/grades' },
      { id: 'alerts', label: 'Cảnh báo', icon: 'notifications-outline', route: '/alerts' },
    ];
  }

  return [
    { id: 'schedule', label: 'Lịch học', icon: 'calendar-outline', route: '/schedule' },
    { id: 'grades', label: 'Điểm & GPA', icon: 'bar-chart-outline', route: '/services/grades' },
    { id: 'parking', label: 'Parking + IoT', icon: 'car-sport-outline', route: '/parking' },
  ];
}

export function getServiceEntries(role?: string | null): ServiceEntry[] {
  const teachingCategory = 'Công cụ giảng dạy' as const;
  const adminCategory = 'Công cụ quản trị' as const;

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
      description:
        'Hiển thị GPA, tổng tín chỉ và các học phần đã có điểm.',
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
      description:
        'Hỗ trợ A1-A4, cảm biến môi trường, đăng ký xe và thanh toán MoMo.',
    },
    {
      id: 'events',
      title: 'Sự kiện & cộng đồng',
      summary: 'Sắp triển khai lịch sự kiện trong campus.',
      category: 'Đời sống campus',
      icon: 'megaphone-outline',
      supportState: 'unsupported',
      isInteractive: false,
      disabledReason: 'Sắp triển khai lịch sự kiện và check-in.',
      lastVerifiedSource: 'manual',
      primaryAction: 'Theo dõi cập nhật',
      route: '/services/events',
      description:
        'Sắp triển khai lịch sự kiện, đăng ký tham gia và check-in.',
    },
    {
      id: 'course-registration',
      title: 'Đăng ký môn học',
      summary: 'Sắp triển khai đăng ký học phần theo đợt.',
      category: 'Học vụ',
      icon: 'document-text-outline',
      supportState: 'unsupported',
      isInteractive: false,
      disabledReason: 'Sắp triển khai đăng ký và hủy đăng ký học phần.',
      lastVerifiedSource: 'manual',
      primaryAction: 'Theo dõi cập nhật',
      route: '/services/course-registration',
      description:
        'Sắp triển khai đăng ký học phần và theo dõi trạng thái.',
    },
    {
      id: 'attendance',
      title: 'Điểm danh QR',
      summary: 'Sắp triển khai điểm danh QR theo buổi học.',
      category: isLecturerRole(role) ? teachingCategory : 'Học vụ',
      icon: 'qr-code-outline',
      supportState: 'unsupported',
      isInteractive: false,
      disabledReason: 'Sắp triển khai điểm danh QR.',
      lastVerifiedSource: 'manual',
      primaryAction: 'Theo dõi cập nhật',
      route: '/services/attendance',
      description:
        'Sắp triển khai điểm danh QR cho giảng viên và sinh viên.',
    },
    {
      id: 'room-booking',
      title: 'Đặt phòng',
      summary: 'Sắp triển khai đặt phòng học và phòng lab.',
      category: 'Tiện ích campus',
      icon: 'business-outline',
      supportState: 'unsupported',
      isInteractive: false,
      disabledReason: 'Sắp triển khai đặt phòng và theo dõi trạng thái.',
      lastVerifiedSource: 'manual',
      primaryAction: 'Theo dõi cập nhật',
      route: '/services/room-booking',
      description:
        'Sắp triển khai đặt phòng học hoặc phòng lab.',
    },
    {
      id: 'library',
      title: 'Thư viện',
      summary: 'Sắp triển khai dịch vụ thư viện.',
      category: 'Đời sống campus',
      icon: 'book-outline',
      supportState: 'unsupported',
      isInteractive: false,
      disabledReason: 'Sắp triển khai tra cứu và mượn trả.',
      lastVerifiedSource: 'manual',
      primaryAction: 'Theo dõi cập nhật',
      route: '/services/library',
      description:
        'Sắp triển khai tra cứu sách và lịch sử mượn trả.',
    },
    {
      id: 'campus-map',
      title: 'Bản đồ khuôn viên',
      summary: 'Sắp triển khai bản đồ khuôn viên và chỉ đường.',
      category: 'Đời sống campus',
      icon: 'map-outline',
      supportState: 'unsupported',
      isInteractive: false,
      disabledReason: 'Sắp triển khai bản đồ khuôn viên.',
      lastVerifiedSource: 'manual',
      primaryAction: 'Theo dõi cập nhật',
      route: '/services/campus-map',
      description:
        'Sắp triển khai bản đồ khuôn viên và chỉ đường.',
    },
    {
      id: 'chatbot',
      title: 'AI Chatbot',
      summary: 'Sắp triển khai trợ lý hỏi đáp cho campus.',
      category: 'Tiện ích campus',
      icon: 'chatbubble-ellipses-outline',
      supportState: 'unsupported',
      isInteractive: false,
      disabledReason: 'Sắp triển khai trợ lý hỏi đáp.',
      lastVerifiedSource: 'manual',
      primaryAction: 'Theo dõi cập nhật',
      route: '/services/chatbot',
      description:
        'Hiển thị phạm vi dự kiến và lưu ý quyền riêng tư.',
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
      description:
        'Sắp triển khai điều khiển thiết bị phòng học theo quyền.',
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
      description:
        'Ưu tiên các luồng đang hỗ trợ như parking và cảnh báo.',
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
