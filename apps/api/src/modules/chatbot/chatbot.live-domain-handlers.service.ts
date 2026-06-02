import { Injectable } from '@nestjs/common';
import {
  AttendanceSessionStatus,
  EventStatus,
  LibraryLoanRequestStatus,
  LibraryLoanStatus,
  ParkingSessionStatus,
  Role,
  StudyMaterialCategory,
  SubscriptionStatus,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { ChatbotDomainRegistry } from './chatbot.domain-registry';
import type {
  ChatbotAnswer,
  ChatbotDomainHandler,
  ChatbotDomainId,
  ChatbotMessageContext,
  ChatbotSummaryContext,
} from './chatbot.types';
import {
  buildDbCitation,
  buildDerivedCitation,
  finalizeAnswer,
  getWeekdayLabel,
  includesAnyPhrase,
  isAdminRole,
  isOperatorRole,
} from './chatbot.utils';

const MATERIAL_CATEGORY_LABELS: Record<StudyMaterialCategory, string> = {
  exam: 'Đề thi',
  textbook: 'Giáo trình',
  other: 'Tài liệu khác',
};

function getLoanRequestStatusLabel(status: LibraryLoanRequestStatus) {
  switch (status) {
    case LibraryLoanRequestStatus.approved:
      return 'đã duyệt';
    case LibraryLoanRequestStatus.rejected:
      return 'bị từ chối';
    case LibraryLoanRequestStatus.cancelled:
      return 'đã hủy';
    default:
      return 'đang chờ duyệt';
  }
}

function getSummaryHeading(scope: ChatbotSummaryContext['scope']) {
  switch (scope) {
    case 'today':
      return 'Tóm tắt hôm nay';
    case 'ops':
      return 'Snapshot vận hành';
    default:
      return 'Tóm tắt công việc';
  }
}

@Injectable()
export class ChatbotLiveDomainHandlersService {
  private readonly handlers: Record<ChatbotDomainId, ChatbotDomainHandler>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: ChatbotDomainRegistry,
  ) {
    this.handlers = {
      general: this.createStaticHandler('general'),
      canteen: {
        canHandle: (context) =>
          context.tokens.some((token) => ['canteen', 'menu', 'mon', 'order', 'don'].includes(token)),
        answer: (context) => this.answerCanteen(context),
        buildSummary: (context) => this.buildCanteenSummary(context),
        getSuggestedQuestions: () => [
          'Đơn canteen gần nhất của tôi',
          'Canteen hôm nay còn món gì?',
          'Bao nhiêu đơn đã thanh toán đang chờ xử lý?',
        ],
      },
      library: {
        canHandle: (context) =>
          context.tokens.some((token) => ['library', 'loan', 'book', 'sach', 'muon'].includes(token)),
        answer: (context) => this.answerLibrary(context),
        buildSummary: (context) => this.buildLibrarySummary(context),
        getSuggestedQuestions: () => [
          'Sách tôi đang mượn',
          'Yêu cầu mượn gần nhất của tôi',
          'Tìm sách clean code',
        ],
      },
      schedule: {
        canHandle: (context) =>
          context.tokens.some((token) => ['schedule', 'lich', 'hoc', 'giang', 'tiet'].includes(token)),
        answer: (context) => this.answerSchedule(context),
        buildSummary: (context) => this.buildScheduleSummary(context),
        getSuggestedQuestions: (role) =>
          role === Role.lecturer
            ? ['Lịch dạy hôm nay', 'Tuần này tôi dạy lớp nào?', 'Lớp nào cần điểm danh?']
            : ['Lịch học hôm nay', 'Tuần này tôi học môn gì?', 'Phòng học hôm nay ở đâu?'],
      },
      grades: {
        canHandle: (context) =>
          context.tokens.some((token) => ['diem', 'gpa', 'grade', 'bang'].includes(token)),
        answer: (context) => this.answerGrades(context),
        buildSummary: (context) => this.buildGradesSummary(context),
        getSuggestedQuestions: (role) =>
          role === Role.lecturer
            ? ['Tôi đang quản lý bao nhiêu lớp nhập điểm?', 'Mở sheet điểm lớp của tôi']
            : ['GPA hiện tại của tôi', 'Môn mới có điểm là môn nào?', 'Bảng điểm hiện tại của tôi'],
      },
      attendance: {
        canHandle: (context) =>
          context.tokens.some((token) => ['attendance', 'diem', 'danh', 'checkin', 'qr'].includes(token)),
        answer: (context) => this.answerAttendance(context),
        buildSummary: (context) => this.buildAttendanceSummary(context),
        getSuggestedQuestions: (role) =>
          role === Role.lecturer
            ? ['Lớp nào đang có phiên QR?', 'Hôm nay tôi có lớp cần điểm danh không?']
            : ['Tôi đã điểm danh hôm nay chưa?', 'Lịch sử điểm danh của tôi'],
      },
      registrations: {
        canHandle: (context) =>
          context.role === Role.student &&
          context.tokens.some((token) => ['registration', 'dang', 'ky', 'hoc', 'phan'].includes(token)),
        answer: (context) => this.answerRegistrations(context),
        buildSummary: (context) => this.buildRegistrationSummary(context),
        getSuggestedQuestions: () => [
          'Tôi đã đăng ký bao nhiêu lớp?',
          'Hiện có bao nhiêu lớp đang mở đăng ký?',
        ],
      },
      'study-materials': {
        canHandle: (context) =>
          context.tokens.some((token) => ['study', 'material', 'tai', 'lieu', 'thi', 'trinh', 'pdf', 'doc'].includes(token)),
        answer: (context) => this.answerStudyMaterials(context),
        buildSummary: (context) => this.buildStudyMaterialsSummary(context),
        getSuggestedQuestions: () => [
          'Tài liệu mới nhất',
          'Đề thi mới được đăng',
          'Tìm giáo trình cơ sở dữ liệu',
        ],
      },
      'room-bookings': {
        canHandle: (context) =>
          context.tokens.some((token) => ['room', 'booking', 'phong', 'approve', 'queue'].includes(token)),
        answer: (context) => this.answerRoomBookings(context),
        buildSummary: (context) => this.buildRoomBookingsSummary(context),
        getSuggestedQuestions: () => [
          'Yêu cầu đặt phòng gần nhất của tôi',
          'Có bao nhiêu yêu cầu đặt phòng chờ duyệt?',
        ],
      },
      parking: {
        canHandle: (context) =>
          context.tokens.some((token) => ['parking', 'xe', 'slot', 'telemetry', 'fire'].includes(token)),
        answer: (context) => this.answerParking(context),
        buildSummary: (context) => this.buildParkingSummary(context),
        getSuggestedQuestions: () => [
          'Xe của tôi đang ở trạng thái nào?',
          'Bãi xe còn chỗ không?',
          'Telemetry gần nhất có ổn không?',
        ],
      },
      events: {
        canHandle: (context) =>
          context.tokens.some((token) => ['event', 'su', 'kien', 'workshop'].includes(token)),
        answer: (context) => this.answerEvents(context),
        buildSummary: (context) => this.buildEventsSummary(context),
        getSuggestedQuestions: () => [
          'Sự kiện sắp tới',
          'Tôi đã đăng ký sự kiện nào?',
        ],
      },
      notifications: {
        canHandle: (context) =>
          context.tokens.some((token) => ['notification', 'alert', 'bao', 'canh'].includes(token)),
        answer: (context) => this.answerNotifications(context),
        buildSummary: (context) => this.buildNotificationsSummary(context),
        getSuggestedQuestions: () => [
          'Thông báo chưa đọc',
          'Thông báo mới nhất của tôi',
        ],
      },
      sos: {
        canHandle: (context) =>
          context.tokens.some((token) => ['sos', 'gps', 'emergency', 'khan'].includes(token)),
        answer: (context) => this.answerSos(context),
        buildSummary: (context) => this.buildSosSummary(context),
        getSuggestedQuestions: () => [
          'SOS gần nhất của tôi',
          'Hiện có bao nhiêu SOS đang hoạt động?',
        ],
      },
      ops: {
        canHandle: (context) =>
          isOperatorRole(context.role) &&
          context.tokens.some((token) => ['ops', 'queue', 'fire', 'telemetry', 'admin', 'hanh'].includes(token)),
        answer: (context) => this.answerOps(context),
        buildSummary: (context) => this.buildOpsSummary(context),
        getSuggestedQuestions: () => [
          'Snapshot vận hành hiện tại',
          'Queue cần xử lý của tôi',
          'Fire alert gần nhất thế nào?',
        ],
      },
      'campus-map': {
        canHandle: (context) =>
          context.tokens.some((token) => ['map', 'ban', 'do', 'tour', '360', 'vien'].includes(token)),
        answer: (context) => this.answerCampusMap(context),
        buildSummary: async () => null,
        getSuggestedQuestions: () => ['Mở bản đồ khuôn viên', 'Tour 360 UIT ở đâu?'],
      },
    };
  }

  getHandler(domainId: ChatbotDomainId) {
    return this.handlers[domainId];
  }

  getSuggestedQuestions(domainId: ChatbotDomainId, role: Role) {
    return this.handlers[domainId]?.getSuggestedQuestions(role) ?? [];
  }

  async buildScopedSummary(context: ChatbotSummaryContext, domainIds: ChatbotDomainId[]) {
    const answers = (
      await Promise.all(
        domainIds.map(async (domainId) => {
          const handler = this.handlers[domainId];
          if (!handler) {
            return null;
          }
          try {
            return await handler.buildSummary(context);
          } catch {
            return null;
          }
        }),
      )
    ).filter((item): item is ChatbotAnswer => item != null);

    if (!answers.length) {
      return finalizeAnswer({
        answer: `${getSummaryHeading(context.scope)} hiện chưa có dữ liệu nổi bật cho role của bạn.`,
        citations: [],
        actions: [],
        suggestedQuestions: ['Lịch hôm nay của tôi', 'Thông báo chưa đọc', 'Tài liệu mới'],
        confidence: 0.45,
        intent: `summary_${context.scope}_empty`,
        domain: context.scope === 'ops' ? 'ops' : 'general',
        answerType: 'summary',
      });
    }

    const actionMap = new Map<string, ChatbotAnswer['actions'][number]>();
    const citationMap = new Map<string, ChatbotAnswer['citations'][number]>();

    for (const answer of answers) {
      for (const action of answer.actions) {
        actionMap.set(`${action.route}:${action.label}`, action);
      }
      for (const citation of answer.citations) {
        citationMap.set(`${citation.type}:${citation.sourceId}:${citation.label}`, citation);
      }
    }

    return finalizeAnswer({
      answer: `${getSummaryHeading(context.scope)}:\n${answers
        .map((item) => `• ${item.answer}`)
        .join('\n')}`,
      citations: Array.from(citationMap.values()),
      actions: Array.from(actionMap.values()),
      suggestedQuestions: Array.from(
        new Set(answers.flatMap((item) => item.suggestedQuestions)),
      ).slice(0, 6),
      confidence: Math.min(0.98, answers.reduce((sum, item) => sum + item.confidence, 0) / answers.length),
      intent: `summary_${context.scope}`,
      domain: context.scope === 'ops' ? 'ops' : 'general',
      answerType: 'summary',
    });
  }

  private createStaticHandler(_domainId: ChatbotDomainId): ChatbotDomainHandler {
    return {
      canHandle: () => false,
      answer: async () => null,
      buildSummary: async () => null,
      getSuggestedQuestions: () => [],
    };
  }

  private createDomainAnswer(
    domainId: ChatbotDomainId,
    payload: Omit<ChatbotAnswer, 'deepLinks' | 'domain'>,
  ) {
    return finalizeAnswer({
      ...payload,
      domain: domainId,
    });
  }

  private answerCampusMap(context: ChatbotMessageContext) {
    return Promise.resolve(
      this.createDomainAnswer('campus-map', {
        answer: 'Bản đồ khuôn viên UIT hiện có sẵn dưới dạng tour 3D ngay trong app.',
        citations: [buildDerivedCitation('Campus map entrypoint', 'campus-map', '/services/campus-map')],
        actions: [this.registry.buildDomainAction('campus-map')],
        suggestedQuestions: this.getSuggestedQuestions('campus-map', context.role),
        confidence: 0.92,
        intent: 'campus_map_entry',
        answerType: 'live',
      }),
    );
  }

  private async answerCanteen(context: ChatbotMessageContext) {
    const asksOrder =
      includesAnyPhrase(context.normalizedMessage, ['don canteen', 'hoa don canteen', 'don hang canteen']) ||
      context.tokens.some((token) => ['order', 'don'].includes(token));

    const asksAdminQueue =
      isOperatorRole(context.role) &&
      (includesAnyPhrase(context.normalizedMessage, ['queue canteen', 'don da thanh toan', 'cho xu ly']) ||
        context.tokens.some((token) => ['queue', 'paid', 'xu'].includes(token)));

    if (asksAdminQueue && context.role !== Role.student && context.role !== Role.lecturer) {
      const pendingOrders = await this.prisma.canteenOrder.count({
        where: { status: 'paid' },
      });
      const route =
        context.role === Role.canteen_admin || isAdminRole(context.role)
          ? '/services/canteen/admin'
          : '/services/canteen';
      return this.createDomainAnswer('canteen', {
        answer: `Hiện có ${pendingOrders} đơn canteen đã thanh toán đang chờ xử lý.`,
        citations: [buildDerivedCitation('Queue canteen đã thanh toán', 'canteen-paid-orders', route)],
        actions: [this.registry.buildDomainAction('canteen', route)],
        suggestedQuestions: this.getSuggestedQuestions('canteen', context.role),
        confidence: 0.93,
        intent: 'canteen_admin_queue',
        answerType: 'live',
      });
    }

    if (asksOrder) {
      const latestOrder = await this.prisma.canteenOrder.findFirst({
        where: { createdById: context.userId },
        orderBy: [{ createdAt: 'desc' }],
      });

      if (!latestOrder) {
        return this.createDomainAnswer('canteen', {
          answer: 'Bạn chưa có đơn canteen nào gần đây.',
          citations: [],
          actions: [this.registry.buildDomainAction('canteen')],
          suggestedQuestions: this.getSuggestedQuestions('canteen', context.role),
          confidence: 0.92,
          intent: 'canteen_order_empty',
          answerType: 'live',
        });
      }

      return this.createDomainAnswer('canteen', {
        answer: `Đơn gần nhất ${latestOrder.orderCode} đang ở trạng thái ${latestOrder.status}. Tổng tiền ${latestOrder.totalAmount.toLocaleString('vi-VN')}đ.`,
        citations: [buildDbCitation('Đơn canteen gần nhất', latestOrder.id, 'canteen_orders', '/services/canteen')],
        actions: [
          this.registry.buildDomainAction(
            'canteen',
            context.role === Role.canteen_admin || isAdminRole(context.role)
              ? '/services/canteen/admin'
              : '/services/canteen',
          ),
        ],
        suggestedQuestions: this.getSuggestedQuestions('canteen', context.role),
        confidence: 0.97,
        intent: 'canteen_order_status',
        answerType: 'live',
      });
    }

    const categories = await this.prisma.canteenCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        products: {
          where: { isActive: true, stock: { gt: 0 } },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          take: 2,
        },
      },
      take: 3,
    });

    const products = categories.flatMap((category) =>
      category.products.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        categoryName: category.name,
      })),
    );

    if (!products.length) {
      return this.createDomainAnswer('canteen', {
        answer: 'Hiện canteen chưa có món nào còn hàng để hiển thị.',
        citations: [],
        actions: [this.registry.buildDomainAction('canteen')],
        suggestedQuestions: this.getSuggestedQuestions('canteen', context.role),
        confidence: 0.88,
        intent: 'canteen_catalog_empty',
        answerType: 'live',
      });
    }

    return this.createDomainAnswer('canteen', {
      answer: `Hiện canteen còn ${products.length} món nổi bật: ${products
        .map((item) => `${item.name} (${item.price.toLocaleString('vi-VN')}đ, ${item.categoryName})`)
        .join('; ')}.`,
      citations: products.map((item) =>
        buildDbCitation(item.name, item.id, 'canteen_products', '/services/canteen'),
      ),
      actions: [this.registry.buildDomainAction('canteen')],
      suggestedQuestions: this.getSuggestedQuestions('canteen', context.role),
      confidence: 0.94,
      intent: 'canteen_catalog',
      answerType: 'live',
    });
  }

  private async buildCanteenSummary(context: ChatbotSummaryContext) {
    if (context.scope === 'ops' && isOperatorRole(context.role)) {
      const pendingOrders = await this.prisma.canteenOrder.count({
        where: { status: 'paid' },
      });
      return this.createDomainAnswer('canteen', {
        answer: `Canteen đang có ${pendingOrders} đơn đã thanh toán chờ hoàn thành.`,
        citations: [buildDerivedCitation('Queue canteen', 'canteen-summary', '/services/canteen/admin')],
        actions: [this.registry.buildDomainAction('canteen', '/services/canteen/admin')],
        suggestedQuestions: ['Mở quản trị canteen', 'Snapshot vận hành'],
        confidence: 0.9,
        intent: 'canteen_summary_ops',
        answerType: 'summary',
      });
    }

    if (context.role === Role.student || context.role === Role.lecturer) {
      const latestOrder = await this.prisma.canteenOrder.findFirst({
        where: { createdById: context.userId },
        orderBy: [{ createdAt: 'desc' }],
      });

      if (!latestOrder) {
        return null;
      }

      return this.createDomainAnswer('canteen', {
        answer: `Đơn canteen gần nhất của bạn là ${latestOrder.orderCode} (${latestOrder.status}).`,
        citations: [buildDbCitation('Đơn canteen gần nhất', latestOrder.id, 'canteen_orders', '/services/canteen')],
        actions: [this.registry.buildDomainAction('canteen')],
        suggestedQuestions: ['Đơn canteen gần nhất của tôi', 'Canteen hôm nay còn món gì?'],
        confidence: 0.9,
        intent: 'canteen_summary_personal',
        answerType: 'summary',
      });
    }

    return null;
  }

  private async answerLibrary(context: ChatbotMessageContext) {
    const asksRequests =
      includesAnyPhrase(context.normalizedMessage, ['yeu cau muon', 'don muon']) ||
      context.tokens.includes('request');
    const asksBorrowed =
      includesAnyPhrase(context.normalizedMessage, ['sach dang muon', 'muon sach']) ||
      context.tokens.includes('loan');

    if (asksRequests) {
      const requests = await this.prisma.libraryLoanRequest.findMany({
        where: {
          requesterId: context.userId,
          status: {
            in: [
              LibraryLoanRequestStatus.pending,
              LibraryLoanRequestStatus.approved,
              LibraryLoanRequestStatus.rejected,
              LibraryLoanRequestStatus.cancelled,
            ],
          },
        },
        include: {
          book: { select: { id: true, title: true } },
          copy: { select: { id: true, copyCode: true } },
        },
        orderBy: [{ createdAt: 'desc' }],
        take: 3,
      });

      if (!requests.length) {
        return this.createDomainAnswer('library', {
          answer: 'Bạn chưa có yêu cầu mượn sách nào gần đây.',
          citations: [],
          actions: [this.registry.buildDomainAction('library')],
          suggestedQuestions: this.getSuggestedQuestions('library', context.role),
          confidence: 0.92,
          intent: 'library_requests_empty',
          answerType: 'live',
        });
      }

      return this.createDomainAnswer('library', {
        answer: `Bạn có ${requests.length} yêu cầu mượn gần nhất: ${requests
          .map((item) => `"${item.book.title}" (${getLoanRequestStatusLabel(item.status)}, copy ${item.copy.copyCode})`)
          .join('; ')}.`,
        citations: requests.map((item) =>
          buildDbCitation(item.book.title, item.id, 'library_loan_requests', '/services/library'),
        ),
        actions: [this.registry.buildDomainAction('library')],
        suggestedQuestions: this.getSuggestedQuestions('library', context.role),
        confidence: 0.96,
        intent: 'library_loan_requests',
        answerType: 'live',
      });
    }

    if (asksBorrowed || context.role === Role.student || context.role === Role.lecturer) {
      const loans = await this.prisma.libraryLoan.findMany({
        where: {
          borrowerId: context.userId,
          status: { in: [LibraryLoanStatus.borrowed, LibraryLoanStatus.overdue] },
        },
        include: {
          copy: { include: { book: true } },
        },
        orderBy: [{ dueAt: 'asc' }],
        take: 3,
      });

      if (loans.length) {
        return this.createDomainAnswer('library', {
          answer: `Bạn đang mượn ${loans.length} cuốn: ${loans
            .map((loan) => `"${loan.copy.book.title}" (hạn ${loan.dueAt.toLocaleDateString('vi-VN')})`)
            .join('; ')}.`,
          citations: loans.map((loan) =>
            buildDbCitation(loan.copy.book.title, loan.id, 'library_loans', '/services/library'),
          ),
          actions: [this.registry.buildDomainAction('library')],
          suggestedQuestions: this.getSuggestedQuestions('library', context.role),
          confidence: 0.96,
          intent: 'library_my_loans',
          answerType: 'live',
        });
      }
    }

    const searchTokens = context.tokens.filter(
      (token) => !['library', 'loan', 'book', 'sach', 'muon'].includes(token),
    );
    const where: any = {
      isActive: true,
      ...(searchTokens.length
        ? {
            AND: searchTokens.map((token) => ({
              OR: [
                { title: { contains: token, mode: 'insensitive' } },
                { authors: { contains: token, mode: 'insensitive' } },
              ],
            })),
          }
        : {}),
    };

    const books = await this.prisma.libraryBook.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      take: 3,
    });

    if (!books.length) {
      return this.createDomainAnswer('library', {
        answer: 'Mình chưa tìm thấy đầu sách phù hợp trong thư viện với từ khóa bạn vừa hỏi.',
        citations: [],
        actions: [this.registry.buildDomainAction('library')],
        suggestedQuestions: ['Sách tôi đang mượn', 'Yêu cầu mượn gần nhất của tôi'],
        confidence: 0.7,
        intent: 'library_search_empty',
        answerType: 'live',
      });
    }

    return this.createDomainAnswer('library', {
      answer: `Mình tìm thấy ${books.length} đầu sách phù hợp: ${books
        .map((book) => `"${book.title}" (${book.authors})`)
        .join('; ')}.`,
      citations: books.map((book) =>
        buildDbCitation(book.title, book.id, 'library_books', '/services/library'),
      ),
      actions: [this.registry.buildDomainAction('library')],
      suggestedQuestions: this.getSuggestedQuestions('library', context.role),
      confidence: 0.9,
      intent: 'library_search',
      answerType: 'live',
    });
  }

  private async buildLibrarySummary(context: ChatbotSummaryContext) {
    if (isAdminRole(context.role)) {
      const pendingRequests = await this.prisma.libraryLoanRequest.count({
        where: { status: LibraryLoanRequestStatus.pending },
      });
      if (!pendingRequests) {
        return null;
      }

      return this.createDomainAnswer('library', {
        answer: `Thư viện đang có ${pendingRequests} yêu cầu mượn chờ xử lý.`,
        citations: [buildDerivedCitation('Pending library loan requests', 'library-summary', '/services/library/admin')],
        actions: [this.registry.buildDomainAction('library', '/services/library/admin')],
        suggestedQuestions: ['Mở thư viện', 'Tài liệu mới'],
        confidence: 0.88,
        intent: 'library_summary_admin',
        answerType: 'summary',
      });
    }

    const activeLoans = await this.prisma.libraryLoan.count({
      where: {
        borrowerId: context.userId,
        status: { in: [LibraryLoanStatus.borrowed, LibraryLoanStatus.overdue] },
      },
    });

    if (!activeLoans) {
      return null;
    }

    return this.createDomainAnswer('library', {
      answer: `Bạn hiện có ${activeLoans} sách đang mượn trong thư viện.`,
      citations: [buildDerivedCitation('Library active loans', 'library-personal-summary', '/services/library')],
      actions: [this.registry.buildDomainAction('library')],
      suggestedQuestions: ['Sách tôi đang mượn', 'Yêu cầu mượn gần nhất của tôi'],
      confidence: 0.87,
      intent: 'library_summary_personal',
      answerType: 'summary',
    });
  }

  private async answerSchedule(context: ChatbotMessageContext) {
    const asksWeek = includesAnyPhrase(context.normalizedMessage, ['tuan nay', 'ca tuan', 'lich tuan']);
    const todayDow = context.now.getDay();

    if (context.role === Role.lecturer) {
      const sections = await this.prisma.classSection.findMany({
        where: { lecturerId: context.userId },
        include: {
          course: true,
          meetings: asksWeek
            ? {
                orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
              }
            : {
                where: { dayOfWeek: todayDow },
                orderBy: [{ startTime: 'asc' }],
              },
        },
      });

      const meetings = sections.flatMap((section) =>
        section.meetings.map((meeting) => ({
          id: meeting.id,
          course: section.course.name,
          room: meeting.room ?? 'chưa xác định',
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          dayOfWeek: meeting.dayOfWeek,
        })),
      );

      if (!meetings.length) {
        return this.createDomainAnswer('schedule', {
          answer: asksWeek ? 'Tuần này bạn chưa có lịch dạy nào.' : 'Hôm nay bạn chưa có lịch dạy.',
          citations: [],
          actions: [this.registry.buildDomainAction('schedule')],
          suggestedQuestions: this.getSuggestedQuestions('schedule', context.role),
          confidence: 0.92,
          intent: asksWeek ? 'schedule_week_lecturer_empty' : 'schedule_today_lecturer_empty',
          answerType: 'live',
        });
      }

      const summary = asksWeek
        ? meetings
            .map((item) => `${getWeekdayLabel(item.dayOfWeek)}: ${item.course} (${item.startTime}-${item.endTime}, phòng ${item.room})`)
            .join(' | ')
        : meetings.map((item) => `${item.course} (${item.startTime}-${item.endTime}, phòng ${item.room})`).join('; ');

      return this.createDomainAnswer('schedule', {
        answer: asksWeek ? `Lịch dạy tuần này của bạn: ${summary}.` : `Hôm nay bạn có ${meetings.length} buổi dạy: ${summary}.`,
        citations: meetings.map((item) =>
          buildDbCitation(item.course, item.id, 'class_meetings', '/schedule'),
        ),
        actions: [this.registry.buildDomainAction('schedule')],
        suggestedQuestions: this.getSuggestedQuestions('schedule', context.role),
        confidence: 0.95,
        intent: asksWeek ? 'schedule_week_lecturer' : 'schedule_today_lecturer',
        answerType: 'live',
      });
    }

    const enrollments = await this.prisma.classEnrollment.findMany({
      where: { studentId: context.userId, status: 'active' },
      include: {
        classSection: {
          include: {
            course: true,
            meetings: asksWeek
              ? {
                  orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
                }
              : {
                  where: { dayOfWeek: todayDow },
                  orderBy: [{ startTime: 'asc' }],
                },
          },
        },
      },
    });

    const meetings = enrollments.flatMap((enrollment) =>
      enrollment.classSection.meetings.map((meeting) => ({
        id: meeting.id,
        course: enrollment.classSection.course.name,
        room: meeting.room ?? 'chưa xác định',
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        dayOfWeek: meeting.dayOfWeek,
      })),
    );

    if (!meetings.length) {
      return this.createDomainAnswer('schedule', {
        answer: asksWeek ? 'Tuần này bạn chưa có lịch học nào.' : 'Hôm nay bạn không có lịch học.',
        citations: [],
        actions: [this.registry.buildDomainAction('schedule')],
        suggestedQuestions: this.getSuggestedQuestions('schedule', context.role),
        confidence: 0.93,
        intent: asksWeek ? 'schedule_week_student_empty' : 'schedule_today_student_empty',
        answerType: 'live',
      });
    }

    const summary = asksWeek
      ? meetings
          .map((item) => `${getWeekdayLabel(item.dayOfWeek)}: ${item.course} (${item.startTime}-${item.endTime}, phòng ${item.room})`)
          .join(' | ')
      : meetings.map((item) => `${item.course} (${item.startTime}-${item.endTime}, phòng ${item.room})`).join('; ');

    return this.createDomainAnswer('schedule', {
      answer: asksWeek ? `Lịch học tuần này của bạn: ${summary}.` : `Hôm nay bạn có ${meetings.length} tiết: ${summary}.`,
      citations: meetings.map((item) =>
        buildDbCitation(item.course, item.id, 'class_meetings', '/schedule'),
      ),
      actions: [this.registry.buildDomainAction('schedule')],
      suggestedQuestions: this.getSuggestedQuestions('schedule', context.role),
      confidence: 0.95,
      intent: asksWeek ? 'schedule_week_student' : 'schedule_today_student',
      answerType: 'live',
    });
  }

  private async buildScheduleSummary(context: ChatbotSummaryContext) {
    if (context.scope !== 'today') {
      return null;
    }

    const scheduleAnswer = await this.answerSchedule({
      userId: context.userId,
      role: context.role,
      message: 'lich hom nay',
      normalizedMessage: 'lich hom nay',
      tokens: ['schedule', 'hom', 'nay'],
      now: context.now,
    });

    return this.createDomainAnswer('schedule', {
      answer: scheduleAnswer.answer,
      citations: scheduleAnswer.citations,
      actions: scheduleAnswer.actions,
      suggestedQuestions: scheduleAnswer.suggestedQuestions,
      confidence: scheduleAnswer.confidence,
      intent: scheduleAnswer.intent,
      answerType: 'summary',
    });
  }

  private async answerGrades(context: ChatbotMessageContext) {
    if (context.role === Role.lecturer) {
      const classSections = await this.prisma.classSection.findMany({
        where: { lecturerId: context.userId },
        include: { course: true, semester: true },
        orderBy: [{ updatedAt: 'desc' }],
        take: 3,
      });

      if (!classSections.length) {
        return this.createDomainAnswer('grades', {
          answer: 'Bạn chưa có lớp học phần nào để nhập điểm trong hệ thống.',
          citations: [],
          actions: [this.registry.buildDomainAction('grades', '/services/grades/lecturer')],
          suggestedQuestions: this.getSuggestedQuestions('grades', context.role),
          confidence: 0.88,
          intent: 'grades_lecturer_empty',
          answerType: 'live',
        });
      }

      return this.createDomainAnswer('grades', {
        answer: `Bạn đang quản lý ${classSections.length} lớp nhập điểm gần nhất: ${classSections
          .map((section) => `${section.course.name} (${section.classCode})`)
          .join('; ')}.`,
        citations: classSections.map((section) =>
          buildDbCitation(section.course.name, section.id, 'class_sections', '/services/grades/lecturer'),
        ),
        actions: [this.registry.buildDomainAction('grades', '/services/grades/lecturer')],
        suggestedQuestions: this.getSuggestedQuestions('grades', context.role),
        confidence: 0.9,
        intent: 'grades_lecturer_sections',
        answerType: 'live',
      });
    }

    const grades = await this.prisma.grade.findMany({
      where: { userId: context.userId },
      include: { course: true, semester: true },
      orderBy: [{ updatedAt: 'desc' }],
      take: 3,
    });

    if (!grades.length) {
      return this.createDomainAnswer('grades', {
        answer: 'Bạn chưa có dữ liệu điểm nào trong hệ thống.',
        citations: [],
        actions: [this.registry.buildDomainAction('grades')],
        suggestedQuestions: this.getSuggestedQuestions('grades', context.role),
        confidence: 0.88,
        intent: 'grades_student_empty',
        answerType: 'live',
      });
    }

    const gpa = await this.prisma.grade.aggregate({
      where: { userId: context.userId, gradePoint: { not: null } },
      _avg: { gradePoint: true },
    });

    return this.createDomainAnswer('grades', {
      answer: `GPA hiện tại của bạn khoảng ${Number(gpa._avg.gradePoint ?? 0).toFixed(2)}. Các môn cập nhật gần nhất: ${grades
        .map((grade) => `${grade.course.name} (${grade.letterGrade ?? 'chưa chốt'})`)
        .join('; ')}.`,
      citations: grades.map((grade) =>
        buildDbCitation(grade.course.name, grade.id, 'grades', '/services/grades'),
      ),
      actions: [this.registry.buildDomainAction('grades')],
      suggestedQuestions: this.getSuggestedQuestions('grades', context.role),
      confidence: 0.93,
      intent: 'grades_student_summary',
      answerType: 'live',
    });
  }

  private async buildGradesSummary(context: ChatbotSummaryContext) {
    if (context.scope !== 'work') {
      return null;
    }

    const answer = await this.answerGrades({
      userId: context.userId,
      role: context.role,
      message: 'diem hien tai',
      normalizedMessage: 'diem hien tai',
      tokens: ['diem', 'gpa'],
      now: context.now,
    });

    return this.createDomainAnswer('grades', {
      answer: answer.answer,
      citations: answer.citations,
      actions: answer.actions,
      suggestedQuestions: answer.suggestedQuestions,
      confidence: answer.confidence,
      intent: answer.intent,
      answerType: 'summary',
    });
  }

  private async answerAttendance(context: ChatbotMessageContext) {
    if (context.role === Role.lecturer) {
      const activeSessions = await this.prisma.attendanceSession.findMany({
        where: {
          lecturerId: context.userId,
          status: AttendanceSessionStatus.active,
        },
        include: {
          classSection: { include: { course: true } },
        },
        orderBy: [{ startedAt: 'desc' }],
        take: 3,
      });

      if (!activeSessions.length) {
        return this.createDomainAnswer('attendance', {
          answer: 'Bạn hiện chưa có phiên điểm danh QR nào đang mở.',
          citations: [],
          actions: [this.registry.buildDomainAction('attendance', '/services/attendance/lecturer')],
          suggestedQuestions: this.getSuggestedQuestions('attendance', context.role),
          confidence: 0.9,
          intent: 'attendance_lecturer_empty',
          answerType: 'live',
        });
      }

      return this.createDomainAnswer('attendance', {
        answer: `Bạn đang có ${activeSessions.length} phiên điểm danh mở: ${activeSessions
          .map((session) => `${session.classSection.course.name} (hết hạn ${session.expiresAt.toLocaleTimeString('vi-VN')})`)
          .join('; ')}.`,
        citations: activeSessions.map((session) =>
          buildDbCitation(session.classSection.course.name, session.id, 'attendance_sessions', '/services/attendance/lecturer'),
        ),
        actions: [this.registry.buildDomainAction('attendance', '/services/attendance/lecturer')],
        suggestedQuestions: this.getSuggestedQuestions('attendance', context.role),
        confidence: 0.93,
        intent: 'attendance_lecturer_active',
        answerType: 'live',
      });
    }

    const latestRecord = await this.prisma.attendanceRecord.findFirst({
      where: { studentId: context.userId },
      include: {
        session: {
          include: {
            classSection: { include: { course: true } },
          },
        },
      },
      orderBy: [{ checkinTime: 'desc' }],
    });

    if (!latestRecord) {
      return this.createDomainAnswer('attendance', {
        answer: 'Bạn chưa có lịch sử điểm danh nào trong hệ thống.',
        citations: [],
        actions: [this.registry.buildDomainAction('attendance')],
        suggestedQuestions: this.getSuggestedQuestions('attendance', context.role),
        confidence: 0.89,
        intent: 'attendance_student_empty',
        answerType: 'live',
      });
    }

    return this.createDomainAnswer('attendance', {
      answer: `Lần điểm danh gần nhất của bạn là ${latestRecord.session.classSection.course.name} lúc ${latestRecord.checkinTime.toLocaleString('vi-VN')}.`,
      citations: [
        buildDbCitation(
          latestRecord.session.classSection.course.name,
          latestRecord.id,
          'attendance_records',
          '/services/attendance/history',
        ),
      ],
      actions: [this.registry.buildDomainAction('attendance', '/services/attendance/history')],
      suggestedQuestions: this.getSuggestedQuestions('attendance', context.role),
      confidence: 0.92,
      intent: 'attendance_student_latest',
      answerType: 'live',
    });
  }

  private async buildAttendanceSummary(context: ChatbotSummaryContext) {
    if (context.scope !== 'today') {
      return null;
    }

    const answer = await this.answerAttendance({
      userId: context.userId,
      role: context.role,
      message: 'diem danh hom nay',
      normalizedMessage: 'diem danh hom nay',
      tokens: ['attendance', 'hom', 'nay'],
      now: context.now,
    });

    return this.createDomainAnswer('attendance', {
      answer: answer.answer,
      citations: answer.citations,
      actions: answer.actions,
      suggestedQuestions: answer.suggestedQuestions,
      confidence: answer.confidence,
      intent: answer.intent,
      answerType: 'summary',
    });
  }

  private async answerRegistrations(context: ChatbotMessageContext) {
    const [activeEnrollments, availableSections] = await Promise.all([
      this.prisma.classEnrollment.count({
        where: { studentId: context.userId, status: 'active' },
      }),
      this.prisma.classSection.count({
        where: { registrationOpen: true },
      }),
    ]);

    return this.createDomainAnswer('registrations', {
      answer: `Bạn đang có ${activeEnrollments} lớp đăng ký hoạt động. Hiện hệ thống có ${availableSections} lớp học phần đang mở đăng ký.`,
      citations: [
        buildDerivedCitation('Đăng ký môn hiện tại', 'registration-active', '/services/course-registration'),
      ],
      actions: [this.registry.buildDomainAction('registrations')],
      suggestedQuestions: this.getSuggestedQuestions('registrations', context.role),
      confidence: 0.9,
      intent: 'registration_status',
      answerType: 'live',
    });
  }

  private async buildRegistrationSummary(context: ChatbotSummaryContext) {
    if (context.role !== Role.student || context.scope !== 'work') {
      return null;
    }
    const answer = await this.answerRegistrations({
      userId: context.userId,
      role: context.role,
      message: 'dang ky mon',
      normalizedMessage: 'dang ky mon',
      tokens: ['registration'],
      now: context.now,
    });
    return this.createDomainAnswer('registrations', {
      answer: answer.answer,
      citations: answer.citations,
      actions: answer.actions,
      suggestedQuestions: answer.suggestedQuestions,
      confidence: answer.confidence,
      intent: answer.intent,
      answerType: 'summary',
    });
  }

  private async answerStudyMaterials(context: ChatbotMessageContext) {
    const searchTokens = context.tokens.filter(
      (token) => !['study', 'material', 'tai', 'lieu', 'de', 'thi', 'giao', 'trinh', 'pdf', 'doc'].includes(token),
    );
    const category =
      context.tokens.includes('exam')
        ? StudyMaterialCategory.exam
        : context.tokens.includes('textbook')
          ? StudyMaterialCategory.textbook
          : undefined;

    const where: any = {
      ...(category ? { category } : {}),
      ...(searchTokens.length
        ? {
            AND: searchTokens.map((token) => ({
              OR: [
                { title: { contains: token, mode: 'insensitive' } },
                { description: { contains: token, mode: 'insensitive' } },
                { fileName: { contains: token, mode: 'insensitive' } },
              ],
            })),
          }
        : {}),
    };

    const materials = await this.prisma.studyMaterial.findMany({
      where,
      include: {
        uploader: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 3,
    });

    if (!materials.length) {
      return this.createDomainAnswer('study-materials', {
        answer: 'Mình chưa tìm thấy tài liệu phù hợp với từ khóa bạn vừa hỏi.',
        citations: [],
        actions: [
          this.registry.buildDomainAction(
            'study-materials',
            isAdminRole(context.role) ? '/services/study-materials/admin' : '/services/study-materials',
          ),
        ],
        suggestedQuestions: this.getSuggestedQuestions('study-materials', context.role),
        confidence: 0.72,
        intent: 'study_materials_empty',
        answerType: 'live',
      });
    }

    return this.createDomainAnswer('study-materials', {
      answer: `Có ${materials.length} tài liệu phù hợp: ${materials
        .map(
          (item) =>
            `${item.title} (${MATERIAL_CATEGORY_LABELS[item.category]}, ${item.fileName}, đăng bởi ${item.uploader.lastName} ${item.uploader.firstName})`,
        )
        .join('; ')}.`,
      citations: materials.map((item) =>
        buildDbCitation(
          item.title,
          item.id,
          'study_materials',
          isAdminRole(context.role) ? '/services/study-materials/admin' : '/services/study-materials',
        ),
      ),
      actions: [
        this.registry.buildDomainAction(
          'study-materials',
          isAdminRole(context.role) ? '/services/study-materials/admin' : '/services/study-materials',
        ),
      ],
      suggestedQuestions: this.getSuggestedQuestions('study-materials', context.role),
      confidence: 0.92,
      intent: 'study_materials_search',
      answerType: 'live',
    });
  }

  private async buildStudyMaterialsSummary(context: ChatbotSummaryContext) {
    if (context.scope !== 'work' && context.scope !== 'ops') {
      return null;
    }

    const where =
      context.role === Role.lecturer
        ? { uploaderId: context.userId }
        : context.scope === 'ops'
          ? {}
          : {};
    const recentCount = await this.prisma.studyMaterial.count({ where });
    if (!recentCount) {
      return null;
    }

    const route = isAdminRole(context.role) ? '/services/study-materials/admin' : '/services/study-materials';
    return this.createDomainAnswer('study-materials', {
      answer:
        context.role === Role.lecturer
          ? `Bạn đang có ${recentCount} tài liệu đã đăng trong kho học tập.`
          : `Kho tài liệu hiện có ${recentCount} tài liệu khả dụng để tra cứu.`,
      citations: [buildDerivedCitation('Study materials summary', 'study-materials-summary', route)],
      actions: [this.registry.buildDomainAction('study-materials', route)],
      suggestedQuestions: ['Tài liệu mới nhất', 'Đề thi mới được đăng'],
      confidence: 0.88,
      intent: 'study_materials_summary',
      answerType: 'summary',
    });
  }

  private async answerRoomBookings(context: ChatbotMessageContext) {
    if (isAdminRole(context.role) && context.tokens.some((token) => ['queue', 'approve', 'phe', 'duyet'].includes(token))) {
      const pending = await this.prisma.roomBooking.count({
        where: { status: 'pending' },
      });
      return this.createDomainAnswer('room-bookings', {
        answer: `Hiện có ${pending} yêu cầu đặt phòng đang chờ phê duyệt.`,
        citations: [buildDerivedCitation('Queue đặt phòng', 'room-bookings-pending', '/services/room-booking/approvals')],
        actions: [this.registry.buildDomainAction('room-bookings', '/services/room-booking/approvals')],
        suggestedQuestions: this.getSuggestedQuestions('room-bookings', context.role),
        confidence: 0.92,
        intent: 'room_booking_queue',
        answerType: 'live',
      });
    }

    const latestBooking = await this.prisma.roomBooking.findFirst({
      where: { userId: context.userId },
      include: { room: true },
      orderBy: [{ createdAt: 'desc' }],
    });

    if (!latestBooking) {
      return this.createDomainAnswer('room-bookings', {
        answer: 'Bạn chưa có yêu cầu đặt phòng nào gần đây.',
        citations: [],
        actions: [this.registry.buildDomainAction('room-bookings')],
        suggestedQuestions: this.getSuggestedQuestions('room-bookings', context.role),
        confidence: 0.89,
        intent: 'room_booking_empty',
        answerType: 'live',
      });
    }

    return this.createDomainAnswer('room-bookings', {
      answer: `Yêu cầu đặt phòng gần nhất: phòng ${latestBooking.room.name ?? latestBooking.room.roomCode} ngày ${latestBooking.bookingDate.toLocaleDateString('vi-VN')}, trạng thái ${latestBooking.status}.`,
      citations: [
        buildDbCitation(
          latestBooking.room.name ?? latestBooking.room.roomCode,
          latestBooking.id,
          'room_bookings',
          '/services/room-booking/my',
        ),
      ],
      actions: [this.registry.buildDomainAction('room-bookings', '/services/room-booking/my')],
      suggestedQuestions: this.getSuggestedQuestions('room-bookings', context.role),
      confidence: 0.94,
      intent: 'room_booking_status',
      answerType: 'live',
    });
  }

  private async buildRoomBookingsSummary(context: ChatbotSummaryContext) {
    if (context.scope === 'ops' || (context.scope === 'work' && isAdminRole(context.role))) {
      const pending = await this.prisma.roomBooking.count({
        where: { status: 'pending' },
      });
      if (!pending) {
        return null;
      }

      return this.createDomainAnswer('room-bookings', {
        answer: `Queue đặt phòng đang có ${pending} yêu cầu chờ duyệt.`,
        citations: [buildDerivedCitation('Room booking queue', 'room-booking-summary', '/services/room-booking/approvals')],
        actions: [this.registry.buildDomainAction('room-bookings', '/services/room-booking/approvals')],
        suggestedQuestions: ['Có bao nhiêu yêu cầu đặt phòng chờ duyệt?'],
        confidence: 0.88,
        intent: 'room_booking_summary_admin',
        answerType: 'summary',
      });
    }

    return null;
  }

  private async answerParking(context: ChatbotMessageContext) {
    if (isAdminRole(context.role) && context.tokens.some((token) => ['telemetry', 'fire', 'slot', 'parking'].includes(token))) {
      const [latestTelemetry, occupiedSlots, totalSlots] = await Promise.all([
        this.prisma.telemetrySnapshot.findFirst({
          orderBy: [{ reportedAt: 'desc' }],
        }),
        this.prisma.parkingSlot.count({ where: { isOccupied: true } }),
        this.prisma.parkingSlot.count(),
      ]);

      return this.createDomainAnswer('parking', {
        answer: `Parking hiện có ${occupiedSlots}/${totalSlots || 0} chỗ đang sử dụng. Telemetry gần nhất lúc ${latestTelemetry?.reportedAt.toLocaleString('vi-VN') ?? 'chưa có dữ liệu'}, fire alert=${latestTelemetry?.fireDetected ? 'có' : 'không'}.`,
        citations: [buildDerivedCitation('Parking telemetry latest', 'parking-telemetry', '/services/parking')],
        actions: [this.registry.buildDomainAction('parking')],
        suggestedQuestions: this.getSuggestedQuestions('parking', context.role),
        confidence: 0.91,
        intent: 'parking_ops_status',
        answerType: 'live',
      });
    }

    const vehicles = await this.prisma.vehicle.findMany({
      where: { userId: context.userId },
      include: {
        subscription: true,
        parkingSessions: {
          where: { status: ParkingSessionStatus.active },
          orderBy: [{ entryTime: 'desc' }],
          take: 1,
        },
      },
      take: 3,
    });

    if (!vehicles.length) {
      return this.createDomainAnswer('parking', {
        answer: 'Bạn chưa đăng ký xe nào trong hệ thống parking.',
        citations: [],
        actions: [this.registry.buildDomainAction('parking')],
        suggestedQuestions: this.getSuggestedQuestions('parking', context.role),
        confidence: 0.87,
        intent: 'parking_vehicle_empty',
        answerType: 'live',
      });
    }

    return this.createDomainAnswer('parking', {
      answer: `Bạn có ${vehicles.length} xe đã đăng ký: ${vehicles
        .map((vehicle) => {
          const session = vehicle.parkingSessions[0];
          const subscription = vehicle.subscription?.status ?? SubscriptionStatus.inactive;
          return `${vehicle.plateNumber} (gói ${subscription}${session ? `, đang gửi từ ${session.entryTime.toLocaleTimeString('vi-VN')}` : ''})`;
        })
        .join('; ')}.`,
      citations: vehicles.map((vehicle) =>
        buildDbCitation(vehicle.plateNumber, vehicle.id, 'vehicles', '/services/parking'),
      ),
      actions: [this.registry.buildDomainAction('parking')],
      suggestedQuestions: this.getSuggestedQuestions('parking', context.role),
      confidence: 0.9,
      intent: 'parking_personal_status',
      answerType: 'live',
    });
  }

  private async buildParkingSummary(context: ChatbotSummaryContext) {
    if (context.scope !== 'ops') {
      return null;
    }
    const answer = await this.answerParking({
      userId: context.userId,
      role: context.role,
      message: 'parking telemetry',
      normalizedMessage: 'parking telemetry',
      tokens: ['parking', 'telemetry', 'slot'],
      now: context.now,
    });
    return this.createDomainAnswer('parking', {
      answer: answer.answer,
      citations: answer.citations,
      actions: answer.actions,
      suggestedQuestions: answer.suggestedQuestions,
      confidence: answer.confidence,
      intent: answer.intent,
      answerType: 'summary',
    });
  }

  private async answerEvents(context: ChatbotMessageContext) {
    const events = await this.prisma.event.findMany({
      where: {
        status: EventStatus.open,
        startAt: { gte: context.now },
      },
      orderBy: [{ startAt: 'asc' }],
      take: 3,
    });

    if (!events.length) {
      return this.createDomainAnswer('events', {
        answer: 'Hiện chưa có sự kiện nào đang mở đăng ký.',
        citations: [],
        actions: [this.registry.buildDomainAction('events')],
        suggestedQuestions: this.getSuggestedQuestions('events', context.role),
        confidence: 0.85,
        intent: 'event_upcoming_empty',
        answerType: 'live',
      });
    }

    return this.createDomainAnswer('events', {
      answer: `Có ${events.length} sự kiện sắp tới: ${events
        .map((event) => `"${event.title}" - ${event.startAt.toLocaleDateString('vi-VN')} tại ${event.location}`)
        .join('; ')}.`,
      citations: events.map((event) => buildDbCitation(event.title, event.id, 'events', '/services/events')),
      actions: [this.registry.buildDomainAction('events')],
      suggestedQuestions: this.getSuggestedQuestions('events', context.role),
      confidence: 0.92,
      intent: 'event_upcoming',
      answerType: 'live',
    });
  }

  private async buildEventsSummary(context: ChatbotSummaryContext) {
    if (context.scope !== 'today') {
      return null;
    }
    const eventsCount = await this.prisma.event.count({
      where: {
        status: EventStatus.open,
        startAt: { gte: context.now },
      },
    });
    if (!eventsCount) {
      return null;
    }

    return this.createDomainAnswer('events', {
      answer: `Hiện có ${eventsCount} sự kiện đang mở đăng ký trong hệ thống.`,
      citations: [buildDerivedCitation('Upcoming events count', 'events-summary', '/services/events')],
      actions: [this.registry.buildDomainAction('events')],
      suggestedQuestions: ['Sự kiện sắp tới'],
      confidence: 0.84,
      intent: 'event_summary',
      answerType: 'summary',
    });
  }

  private async answerNotifications(context: ChatbotMessageContext) {
    const [unreadCount, latest] = await Promise.all([
      this.prisma.notification.count({
        where: { userId: context.userId, isRead: false },
      }),
      this.prisma.notification.findFirst({
        where: { userId: context.userId },
        orderBy: [{ createdAt: 'desc' }],
      }),
    ]);

    if (!latest) {
      return this.createDomainAnswer('notifications', {
        answer: 'Bạn chưa có thông báo nào trong hệ thống.',
        citations: [],
        actions: [this.registry.buildDomainAction('notifications')],
        suggestedQuestions: this.getSuggestedQuestions('notifications', context.role),
        confidence: 0.86,
        intent: 'notification_empty',
        answerType: 'live',
      });
    }

    return this.createDomainAnswer('notifications', {
      answer: `Bạn có ${unreadCount} thông báo chưa đọc. Thông báo mới nhất là "${latest.title}".`,
      citations: [buildDbCitation(latest.title, latest.id, 'notifications', '/alerts')],
      actions: [this.registry.buildDomainAction('notifications')],
      suggestedQuestions: this.getSuggestedQuestions('notifications', context.role),
      confidence: 0.92,
      intent: 'notification_unread',
      answerType: 'live',
    });
  }

  private async buildNotificationsSummary(context: ChatbotSummaryContext) {
    if (context.scope !== 'today') {
      return null;
    }
    const answer = await this.answerNotifications({
      userId: context.userId,
      role: context.role,
      message: 'thong bao chua doc',
      normalizedMessage: 'thong bao chua doc',
      tokens: ['notification'],
      now: context.now,
    });
    return this.createDomainAnswer('notifications', {
      answer: answer.answer,
      citations: answer.citations,
      actions: answer.actions,
      suggestedQuestions: answer.suggestedQuestions,
      confidence: answer.confidence,
      intent: answer.intent,
      answerType: 'summary',
    });
  }

  private async answerSos(context: ChatbotMessageContext) {
    if (isAdminRole(context.role) && context.tokens.some((token) => ['active', 'ops', 'queue'].includes(token))) {
      const activeCount = await this.prisma.sosRequest.count({
        where: { status: 'active' },
      });
      return this.createDomainAnswer('sos', {
        answer: `Hiện có ${activeCount} yêu cầu SOS đang hoạt động.`,
        citations: [buildDerivedCitation('Active SOS requests', 'sos-active', '/services/gps-sos')],
        actions: [this.registry.buildDomainAction('sos')],
        suggestedQuestions: this.getSuggestedQuestions('sos', context.role),
        confidence: 0.9,
        intent: 'sos_active_count',
        answerType: 'live',
      });
    }

    const latest = await this.prisma.sosRequest.findFirst({
      where: { requesterId: context.userId },
      orderBy: [{ createdAt: 'desc' }],
    });

    if (!latest) {
      return this.createDomainAnswer('sos', {
        answer: 'Bạn chưa có lịch sử SOS nào. Khi cần hỗ trợ khẩn cấp, hãy mở GPS/SOS.',
        citations: [],
        actions: [this.registry.buildDomainAction('sos')],
        suggestedQuestions: this.getSuggestedQuestions('sos', context.role),
        confidence: 0.9,
        intent: 'sos_empty',
        answerType: 'live',
      });
    }

    return this.createDomainAnswer('sos', {
      answer: `Yêu cầu SOS gần nhất của bạn đang ở trạng thái ${latest.status}, tạo lúc ${latest.createdAt.toLocaleString('vi-VN')}.`,
      citations: [buildDbCitation('SOS gần nhất', latest.id, 'sos_requests', '/services/gps-sos')],
      actions: [this.registry.buildDomainAction('sos')],
      suggestedQuestions: this.getSuggestedQuestions('sos', context.role),
      confidence: 0.93,
      intent: 'sos_status',
      answerType: 'live',
    });
  }

  private async buildSosSummary(context: ChatbotSummaryContext) {
    if (context.scope !== 'ops') {
      return null;
    }

    const activeCount = await this.prisma.sosRequest.count({
      where: { status: 'active' },
    });
    if (!activeCount) {
      return null;
    }

    return this.createDomainAnswer('sos', {
      answer: `Đang có ${activeCount} yêu cầu SOS cần theo dõi.`,
      citations: [buildDerivedCitation('SOS active summary', 'sos-summary', '/services/gps-sos')],
      actions: [this.registry.buildDomainAction('sos')],
      suggestedQuestions: ['Hiện có bao nhiêu SOS đang hoạt động?'],
      confidence: 0.86,
      intent: 'sos_summary',
      answerType: 'summary',
    });
  }

  private async answerOps(context: ChatbotMessageContext) {
    const [paidOrders, pendingBookings, latestTelemetry, activeSos, studyMaterials] = await Promise.all([
      this.prisma.canteenOrder.count({ where: { status: 'paid' } }),
      this.prisma.roomBooking.count({ where: { status: 'pending' } }),
      this.prisma.telemetrySnapshot.findFirst({ orderBy: [{ reportedAt: 'desc' }] }),
      this.prisma.sosRequest.count({ where: { status: 'active' } }),
      this.prisma.studyMaterial.count(),
    ]);

    return this.createDomainAnswer('ops', {
      answer: `Snapshot vận hành hiện tại: ${paidOrders} đơn canteen chờ xử lý, ${pendingBookings} yêu cầu đặt phòng pending, ${activeSos} SOS active, kho tài liệu có ${studyMaterials} mục, telemetry gần nhất fire=${latestTelemetry?.fireDetected ? 'có' : 'không'}.`,
      citations: [
        buildDerivedCitation('Operations snapshot', 'ops-snapshot', '/services/admin-tools'),
      ],
      actions: [this.registry.buildDomainAction('ops')],
      suggestedQuestions: this.getSuggestedQuestions('ops', context.role),
      confidence: 0.94,
      intent: 'ops_snapshot',
      answerType: 'live',
    });
  }

  private async buildOpsSummary(context: ChatbotSummaryContext) {
    if (!isOperatorRole(context.role) || (context.scope !== 'ops' && context.scope !== 'work')) {
      return null;
    }
    const answer = await this.answerOps({
      userId: context.userId,
      role: context.role,
      message: 'snapshot van hanh',
      normalizedMessage: 'snapshot van hanh',
      tokens: ['ops', 'queue', 'telemetry', 'fire'],
      now: context.now,
    });
    return this.createDomainAnswer('ops', {
      answer: answer.answer,
      citations: answer.citations,
      actions: answer.actions,
      suggestedQuestions: answer.suggestedQuestions,
      confidence: answer.confidence,
      intent: answer.intent,
      answerType: 'summary',
    });
  }
}
