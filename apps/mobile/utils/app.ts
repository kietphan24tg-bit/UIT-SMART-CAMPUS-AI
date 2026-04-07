import { USER_ROLES, formatFullName, formatGPA } from '@smart-campus/shared';

import type {
  AlertSeverity,
  DashboardSnapshot,
  ScheduleRecord,
  ServiceEntry,
  TelemetryHealthState,
} from '@/types/app-data';

const DAY_LABELS: Record<number, string> = {
  1: 'Thu hai',
  2: 'Thu ba',
  3: 'Thu tu',
  4: 'Thu nam',
  5: 'Thu sau',
  6: 'Thu bay',
  7: 'Chu nhat',
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
      return 'Giang vien';
    case USER_ROLES.ADMIN:
      return 'Quan tri vien';
    case USER_ROLES.SUPER_ADMIN:
      return 'Quan tri he thong';
    default:
      return 'Sinh vien';
  }
}

export function getRoleScopedTabTitle(role?: string | null) {
  return isAdminRole(role) ? 'Van hanh' : 'Lich hoc';
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

export function getGreetingName(user?: {
  firstName?: string | null;
  lastName?: string | null;
} | null) {
  if (!user?.firstName && !user?.lastName) {
    return 'UITer';
  }

  return formatFullName(user.firstName ?? '', user.lastName ?? '');
}

export function getDayLabel(dayOfWeek: number) {
  return DAY_LABELS[dayOfWeek] ?? 'Khac';
}

export function getDayLabelShort(dayOfWeek: number) {
  return DAY_LABELS_SHORT[dayOfWeek] ?? '?';
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Chua co du lieu';
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
    return 'Chua co du lieu';
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
    return 'Chua kich hoat';
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
      return 'Canh bao chay';
    case 'offline':
      return 'Mat ket noi';
    case 'stale':
      return 'Du lieu cu';
    case 'no-data':
      return 'Chua co du lieu';
    default:
      return 'Dang truc tuyen';
  }
}

export function getSeverityLabel(severity: AlertSeverity) {
  switch (severity) {
    case 'critical':
      return 'Khan cap';
    case 'warning':
      return 'Can chu y';
    default:
      return 'Thong thuong';
  }
}

export function getDashboardHeroSummary(snapshot: DashboardSnapshot) {
  if (isSuperAdminRole(snapshot.role)) {
    return `${snapshot.unreadCount} canh bao can theo doi tren he UIT Smart Campus`;
  }

  if (isAdminRole(snapshot.role)) {
    return `${snapshot.unreadCount} hang doi van hanh can xu ly`;
  }

  if (snapshot.nextClass) {
    return `Buoi tiep theo: ${snapshot.nextClass.course.name}`;
  }

  return 'Chua co lich sap toi';
}

export function getRoleQuickActions(role?: string | null) {
  if (isSuperAdminRole(role)) {
    return [
      { id: 'operations', label: 'Operations', icon: 'pulse-outline', route: '/operations/fire-alerts' },
      { id: 'system', label: 'System controls', icon: 'settings-outline', route: '/settings/system-controls' },
      { id: 'parking', label: 'Parking + IoT', icon: 'car-sport-outline', route: '/parking' },
    ];
  }

  if (isAdminRole(role)) {
    return [
      { id: 'approvals', label: 'Approval queue', icon: 'git-pull-request-outline', route: '/operations/approvals' },
      { id: 'alerts', label: 'Fire alerts', icon: 'warning-outline', route: '/operations/fire-alerts' },
      { id: 'services', label: 'Admin tools', icon: 'grid-outline', route: '/services/admin-tools' },
    ];
  }

  if (isLecturerRole(role)) {
    return [
      { id: 'attendance', label: 'Attendance QR', icon: 'qr-code-outline', route: '/schedule/attendance-session' },
      { id: 'grades', label: 'Grade sheet', icon: 'create-outline', route: '/schedule/grade-sheet' },
      { id: 'notifications', label: 'Thong bao lop', icon: 'mail-outline', route: '/schedule/class-notification' },
    ];
  }

  return [
    { id: 'schedule', label: 'Lich hoc', icon: 'calendar-outline', route: '/schedule' },
    { id: 'grades', label: 'Diem & GPA', icon: 'bar-chart-outline', route: '/services/grades' },
    { id: 'parking', label: 'Parking + IoT', icon: 'car-sport-outline', route: '/parking' },
  ];
}

export function getServiceEntries(role?: string | null): ServiceEntry[] {
  const entries: ServiceEntry[] = [
    {
      id: 'grades',
      title: 'Diem & GPA',
      summary: 'Theo doi bang diem va hoc luc theo tung hoc ky.',
      category: 'Academic',
      icon: 'bar-chart-outline',
      availability: 'live',
      primaryAction: 'Xem bang diem',
      route: '/services/grades',
      description:
        'Hien thi GPA hien tai, tong tin chi da tich luy va danh sach diem cua cac hoc phan da co ket qua.',
    },
    {
      id: 'parking',
      title: 'Parking + IoT',
      summary: 'Theo doi bai xe, cam bien va goi gui xe thang.',
      category: 'Campus utilities',
      icon: 'car-sport-outline',
      availability: 'live',
      primaryAction: 'Mo Parking',
      route: '/parking',
      description:
        'Tinh trang cho trong A1-A4, nhiet do, do am, mua, lua, dang ky xe va thanh toan MoMo cho dich vu gui xe.',
    },
    {
      id: 'events',
      title: 'Su kien & Cong dong',
      summary: 'Kham pha workshop, CLB va cac hoat dong trong truong.',
      category: 'Campus life',
      icon: 'megaphone-outline',
      availability: 'preview',
      primaryAction: 'Xem chi tiet',
      route: '/services/events',
      description:
        'Module roadmap danh cho su kien, check-in QR va hoat dong cong dong cua UIT.',
    },
    {
      id: 'course-registration',
      title: 'Dang ky mon hoc',
      summary: 'Chuan bi cho giai doan dang ky tin chi tap trung.',
      category: 'Academic',
      icon: 'document-text-outline',
      availability: 'preview',
      primaryAction: 'Xem chi tiet',
      route: '/services/course-registration',
      description:
        'Ho tro xem mon mo, kiem tra tien quyet va dang ky hoac huy dang ky mon hoc.',
    },
    {
      id: 'attendance',
      title: 'Diem danh QR',
      summary: 'Diem danh nhanh cho buoi hoc va quan ly trang thai tham du.',
      category: isLecturerRole(role) ? 'Teaching tools' : 'Academic',
      icon: 'qr-code-outline',
      availability: 'preview',
      primaryAction: 'Xem chi tiet',
      route: '/services/attendance',
      description:
        'Dung chung mot template cho quet QR, tao phien diem danh va bao cao tinh trang tham du.',
    },
    {
      id: 'room-booking',
      title: 'Dat phong',
      summary: 'Tim va gui yeu cau su dung phong hoc hoac phong lab.',
      category: 'Campus utilities',
      icon: 'business-outline',
      availability: 'preview',
      primaryAction: 'Xem chi tiet',
      route: '/services/room-booking',
      description:
        'Luong du kien cho dat phong hoc, phe duyet va theo doi lich su yeu cau.',
    },
    {
      id: 'library',
      title: 'Thu vien',
      summary: 'Tim kiem tai lieu va quan ly luot muon trong tuong lai.',
      category: 'Campus life',
      icon: 'book-outline',
      availability: 'preview',
      primaryAction: 'Xem chi tiet',
      route: '/services/library',
      description:
        'Khung chi tiet dung chung cho tim sach, muon tra va dat cho hoc tap tai thu vien.',
    },
    {
      id: 'campus-map',
      title: 'Ban do khuon vien',
      summary: 'Tim duong trong campus va tra cuu vi tri phong hoc.',
      category: 'Campus life',
      icon: 'map-outline',
      availability: 'preview',
      primaryAction: 'Xem chi tiet',
      route: '/services/campus-map',
      description:
        'Trinh bay dinh huong module ban do voi cac section ngan gon, khong tao flow rieng qua dai.',
    },
    {
      id: 'chatbot',
      title: 'AI Chatbot',
      summary: 'Tro ly giai dap nhanh cac cau hoi pho bien cua UITer.',
      category: 'Campus utilities',
      icon: 'chatbubble-ellipses-outline',
      availability: 'preview',
      primaryAction: 'Xem chi tiet',
      route: '/services/chatbot',
      description:
        'Mo ta ngan vai tro chatbot, pham vi kien thuc va hanh vi chinh khi trien khai chinh thuc.',
    },
    {
      id: 'smart-classroom',
      title: 'Lop hoc thong minh',
      summary: 'Theo doi va dieu khien thiet bi IoT trong phong hoc.',
      category: isLecturerRole(role) ? 'Teaching tools' : 'Admin tools',
      icon: 'hardware-chip-outline',
      availability: 'preview',
      primaryAction: 'Xem chi tiet',
      route: '/services/smart-classroom',
      description:
        'Khung chi tiet dung chung cho dieu khien thiet bi, trang thai phong hoc va bai toan IoT mo rong.',
    },
  ];

  if (isAdminRole(role)) {
    entries.push({
      id: 'admin-tools',
      title: 'Bo cong cu van hanh',
      summary: 'Theo doi canh bao chay, parking ops va suc khoe gateway.',
      category: 'Admin tools',
      icon: 'shield-checkmark-outline',
      availability: 'preview',
      primaryAction: 'Xem chi tiet',
      route: '/services/admin-tools',
      description:
        'Diem tap trung cho quan tri vien de gom cac cong cu van hanh ma khong tao them screen family rieng.',
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
