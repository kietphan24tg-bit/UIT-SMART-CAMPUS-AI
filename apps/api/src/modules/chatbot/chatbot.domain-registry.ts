import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';

import type {
  ChatbotAction,
  ChatbotCapabilityScope,
  ChatbotDomainDefinition,
  ChatbotDomainId,
  ChatbotMessageContext,
  ChatbotSummaryScope,
} from './chatbot.types';
import { buildAction, uniqueStrings } from './chatbot.utils';

const DOMAIN_DEFINITIONS: ChatbotDomainDefinition[] = [
  {
    id: 'schedule',
    label: 'Lịch học / Lịch dạy',
    description: 'Tra cứu lịch học, lịch dạy và buổi học trong ngày hoặc trong tuần.',
    route: '/schedule',
    actionLabel: 'Mở lịch',
    roles: [Role.student, Role.lecturer],
    keywords: ['schedule', 'lich', 'hoc', 'giang', 'tiet', 'lop'],
    phrases: ['lich hoc', 'lich day', 'hom nay hoc gi', 'tuan nay', 'tiet hoc'],
    knowledgeSlug: 'schedule-service',
  },
  {
    id: 'grades',
    label: 'Điểm & GPA',
    description: 'Theo dõi bảng điểm, GPA hoặc sheet nhập điểm theo lớp học phần.',
    route: '/services/grades',
    actionLabel: 'Mở điểm',
    roles: [Role.student, Role.lecturer],
    keywords: ['diem', 'gpa', 'grade', 'mon', 'bang'],
    phrases: ['bang diem', 'gpa hien tai', 'nhap diem', 'sheet diem'],
    knowledgeSlug: 'grades-service',
  },
  {
    id: 'attendance',
    label: 'Điểm danh',
    description: 'Theo dõi lịch sử điểm danh, phiên QR đang mở và lớp cần xử lý.',
    route: '/services/attendance',
    actionLabel: 'Mở điểm danh',
    roles: [Role.student, Role.lecturer],
    keywords: ['attendance', 'qr', 'checkin', 'vang', 'danh'],
    phrases: ['diem danh', 'qr attendance', 'phien qr', 'lich su diem danh'],
    knowledgeSlug: 'attendance-service',
  },
  {
    id: 'registrations',
    label: 'Đăng ký môn học',
    description: 'Tra cứu đăng ký môn, lớp học phần đang mở và số lượng lớp đã đăng ký.',
    route: '/services/course-registration',
    actionLabel: 'Mở đăng ký môn',
    roles: [Role.student],
    keywords: ['registration', 'dang', 'ky', 'hoc', 'phan', 'lop'],
    phrases: ['dang ky mon', 'dang ky hoc phan', 'lop dang mo'],
    knowledgeSlug: 'registration-service',
  },
  {
    id: 'study-materials',
    label: 'Tài liệu',
    description: 'Tra cứu đề thi, giáo trình và tài liệu học tập trong kho dùng chung.',
    route: '/services/study-materials',
    actionLabel: 'Mở tài liệu',
    roles: [Role.student, Role.lecturer, Role.admin, Role.super_admin],
    keywords: ['study', 'material', 'tai', 'lieu', 'de', 'thi', 'giao', 'trinh', 'pdf', 'doc'],
    phrases: ['tai lieu', 'de thi', 'giao trinh', 'tai lieu moi'],
    knowledgeSlug: 'study-materials-service',
  },
  {
    id: 'canteen',
    label: 'Canteen',
    description: 'Xem đơn gần nhất, menu còn hàng hoặc queue cần xử lý của canteen.',
    route: '/services/canteen',
    actionLabel: 'Mở canteen',
    roles: [Role.student, Role.lecturer, Role.canteen_admin, Role.admin, Role.super_admin],
    keywords: ['canteen', 'mon', 'an', 'menu', 'order', 'don'],
    phrases: ['don canteen', 'hoa don canteen', 'menu hom nay', 'mon nao con'],
    knowledgeSlug: 'canteen-service',
  },
  {
    id: 'library',
    label: 'Thư viện',
    description: 'Tra cứu sách đang mượn, yêu cầu mượn hoặc kết quả tìm sách.',
    route: '/services/library',
    actionLabel: 'Mở thư viện',
    roles: [Role.student, Role.lecturer, Role.admin, Role.super_admin],
    keywords: ['library', 'sach', 'muon', 'book', 'copy'],
    phrases: ['thu vien', 'muon sach', 'sach dang muon', 'tim sach'],
    knowledgeSlug: 'library-service',
  },
  {
    id: 'room-bookings',
    label: 'Đặt phòng',
    description: 'Theo dõi yêu cầu đặt phòng của tôi hoặc queue phê duyệt phòng.',
    route: '/services/room-booking',
    actionLabel: 'Mở đặt phòng',
    roles: [Role.student, Role.lecturer, Role.admin, Role.super_admin],
    keywords: ['room', 'booking', 'phong', 'hop', 'approve', 'queue'],
    phrases: ['dat phong', 'phong trong', 'queue phe duyet', 'yeu cau phong'],
    knowledgeSlug: 'room-booking-service',
  },
  {
    id: 'parking',
    label: 'Parking + IoT',
    description: 'Theo dõi xe đã đăng ký, phiên gửi xe đang mở, telemetry và chỗ trống.',
    route: '/services/parking',
    actionLabel: 'Mở parking',
    roles: [Role.student, Role.lecturer, Role.admin, Role.super_admin],
    keywords: ['parking', 'xe', 'gui', 'slot', 'telemetry', 'fire'],
    phrases: ['gui xe', 'cho trong', 'slot trong', 'cam bien', 'fire alert'],
    knowledgeSlug: 'parking-service',
  },
  {
    id: 'events',
    label: 'Sự kiện',
    description: 'Xem sự kiện sắp diễn ra và danh sách đăng ký sự kiện.',
    route: '/services/events',
    actionLabel: 'Mở sự kiện',
    roles: [Role.student, Role.lecturer, Role.admin, Role.super_admin],
    keywords: ['event', 'su', 'kien', 'workshop', 'dang', 'ky'],
    phrases: ['su kien sap toi', 'workshop', 'dang ky su kien'],
    knowledgeSlug: 'event-service',
  },
  {
    id: 'notifications',
    label: 'Cảnh báo',
    description: 'Theo dõi thông báo chưa đọc, cảnh báo học vụ, thanh toán và khẩn cấp.',
    route: '/alerts',
    actionLabel: 'Mở cảnh báo',
    roles: [Role.student, Role.lecturer, Role.admin, Role.super_admin, Role.canteen_admin],
    keywords: ['notification', 'alert', 'thong', 'bao', 'canh'],
    phrases: ['thong bao', 'chua doc', 'canh bao'],
    knowledgeSlug: 'notification-service',
  },
  {
    id: 'sos',
    label: 'GPS / SOS',
    description: 'Theo dõi yêu cầu SOS gần nhất hoặc danh sách SOS đang hoạt động.',
    route: '/services/gps-sos',
    actionLabel: 'Mở GPS/SOS',
    roles: [Role.student, Role.lecturer, Role.admin, Role.super_admin, Role.canteen_admin],
    keywords: ['sos', 'gps', 'emergency', 'khan', 'cap'],
    phrases: ['gps sos', 'yeu cau sos', 'khan cap'],
    knowledgeSlug: 'sos-service',
  },
  {
    id: 'ops',
    label: 'Vận hành',
    description: 'Snapshot vận hành gồm queue, telemetry, fire alert và tình trạng hỗ trợ.',
    route: '/services/admin-tools',
    actionLabel: 'Mở quản trị',
    roles: [Role.admin, Role.super_admin, Role.canteen_admin],
    keywords: ['ops', 'queue', 'fire', 'telemetry', 'van', 'hanh', 'admin'],
    phrases: ['van hanh', 'snapshot van hanh', 'queue phe duyet', 'fire alert'],
    knowledgeSlug: 'ops-service',
  },
  {
    id: 'campus-map',
    label: 'Bản đồ khuôn viên',
    description: 'Điều hướng tới tour 3D và thông tin tham quan khuôn viên UIT.',
    route: '/services/campus-map',
    actionLabel: 'Mở bản đồ',
    roles: [Role.student, Role.lecturer, Role.admin, Role.super_admin, Role.canteen_admin],
    keywords: ['map', 'ban', 'do', 'tour', '360', 'khuon', 'vien'],
    phrases: ['ban do khuon vien', 'tour 360', 'bai do uit'],
    knowledgeSlug: 'campus-map-service',
  },
];

@Injectable()
export class ChatbotDomainRegistry {
  getDomain(id: ChatbotDomainId) {
    return DOMAIN_DEFINITIONS.find((item) => item.id === id) ?? null;
  }

  getVisibleDomains(role: Role) {
    return DOMAIN_DEFINITIONS.filter((item) => item.roles.includes(role));
  }

  rankDomains(context: ChatbotMessageContext) {
    const normalized = context.normalizedMessage;
    const visible = this.getVisibleDomains(context.role);
    return visible
      .map((domain) => ({
        domain,
        score: this.scoreDomainMatch(domain, context.tokens, normalized),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.domain);
  }

  buildDomainAction(domainId: ChatbotDomainId, route?: string): ChatbotAction {
    const domain = this.getDomain(domainId);
    if (!domain) {
      return buildAction('Mở dịch vụ', route ?? '/services');
    }

    return buildAction(domain.actionLabel, route ?? domain.route);
  }

  buildActionsFromRoutes(routes: string[]) {
    return uniqueStrings(routes).map((route) => {
      const matched = DOMAIN_DEFINITIONS.find((item) => item.route === route);
      return buildAction(matched?.actionLabel ?? 'Mở chi tiết', route);
    });
  }

  getCapabilityScopes(role: Role): ChatbotCapabilityScope[] {
    if (role === Role.student) {
      return [
        {
          scope: 'today',
          label: 'Hôm nay của tôi',
          description: 'Lịch học, điểm danh và thông báo gần nhất trong ngày.',
        },
        {
          scope: 'work',
          label: 'Học vụ của tôi',
          description: 'Điểm, đăng ký môn và tài liệu học tập liên quan.',
        },
      ];
    }

    if (role === Role.lecturer) {
      return [
        {
          scope: 'today',
          label: 'Lịch dạy hôm nay',
          description: 'Buổi dạy hôm nay, lớp cần điểm danh và thông báo liên quan.',
        },
        {
          scope: 'work',
          label: 'Lớp cần xử lý',
          description: 'Lớp nhập điểm, tài liệu đã đăng và room booking liên quan.',
        },
      ];
    }

    return [
      {
        scope: 'ops',
        label: 'Snapshot vận hành',
        description: 'Queue, telemetry, fire alert và SOS đang hoạt động.',
      },
      {
        scope: 'work',
        label: 'Queue của tôi',
        description: 'Các việc cần xử lý theo role quản trị hiện tại.',
      },
    ];
  }

  private scoreDomainMatch(
    domain: ChatbotDomainDefinition,
    tokens: string[],
    normalizedMessage: string,
  ) {
    const keywordScore = domain.keywords.reduce(
      (score, keyword) => score + (tokens.some((token) => token.includes(keyword)) ? 1 : 0),
      0,
    );
    const phraseScore = domain.phrases.reduce(
      (score, phrase) =>
        score + (normalizedMessage.includes(phrase.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')) ? 3 : 0),
      0,
    );

    return keywordScore + phraseScore;
  }
}
