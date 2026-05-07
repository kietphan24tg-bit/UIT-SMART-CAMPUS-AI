import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventStatus, LibraryLoanStatus, Role } from '@prisma/client';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import type { QueryChatbotDto, UpsertKnowledgeDocumentDto } from './dto/chatbot.dto';

const MAX_KB_MATCHES = 4;

// ---------------------------------------------------------------------------
// Vietnamese stopwords — ignored during keyword matching
// ---------------------------------------------------------------------------
const STOPWORDS = new Set([
  'ban', 'toi', 'cua', 'cho', 'voi', 'the', 'mot', 'cac', 'nhung', 'duoc',
  'khong', 'khi', 'nhu', 'tren', 'trong', 'den', 'hay', 'nao', 'nay', 'day',
  'tat', 'rat', 'gan', 'biet', 'bao', 'biet', 'moi', 'dau', 'sao', 'the',
  'con', 'roi', 'het', 'xem', 'qua', 'lai', 'vai', 'hon', 'nam', 'gio',
  'ngay', 'tuan', 'thang', 'hom', 'xin', 'vui', 'long', 'hien', 'tai',
]);

// ---------------------------------------------------------------------------
// Synonym normalization — maps common alternate forms to canonical tokens
// ---------------------------------------------------------------------------
const SYNONYMS: Record<string, string> = {
  'can tin': 'canteen',
  'nha an': 'canteen',
  'quan an': 'canteen',
  'dat mon': 'canteen',
  'thu vien': 'library',
  'sach': 'library',
  'muon sach': 'library',
  'gps': 'sos',
  'khan cap': 'sos',
  'lich hoc': 'schedule',
  'lich giang': 'schedule',
  'mon hoc': 'schedule',
  'tiet hoc': 'schedule',
  'dat phong': 'room',
  'phong hop': 'room',
  'su kien': 'event',
  'hoat dong': 'event',
  'thong bao': 'notification',
  'tin tuc': 'notification',
};

function applyAliases(text: string): string {
  let result = text;
  for (const [alias, canonical] of Object.entries(SYNONYMS)) {
    result = result.replace(new RegExp(alias, 'g'), canonical);
  }
  return result;
}

function tokenize(input: string): string[] {
  const normalized = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
  const aliased = applyAliases(normalized);
  return aliased
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function toInputJson(value: unknown) {
  return value as Prisma.InputJsonValue;
}

// ---------------------------------------------------------------------------
// Suggested questions per intent
// ---------------------------------------------------------------------------
const SUGGESTED: Record<string, string[]> = {
  canteen_order_status: [
    'Tôi đặt được những món gì hôm nay?',
    'Canteen mở cửa giờ nào?',
    'Làm sao thanh toán online?',
  ],
  library_my_loans: [
    'Làm sao gia hạn sách?',
    'Tìm sách theo tên như thế nào?',
    'Chính sách mượn sách của thư viện?',
  ],
  sos_status: [
    'Làm sao gửi yêu cầu SOS mới?',
    'Ai nhận được thông báo SOS của tôi?',
    'SOS theo dõi vị trí realtime không?',
  ],
  canteen_admin_queue: [
    'Xem chi tiết đơn đã thanh toán?',
    'Đánh dấu đơn hoàn thành như thế nào?',
  ],
  schedule_today: [
    'Lịch học tuần này như thế nào?',
    'Môn nào tôi chưa điểm danh?',
    'Phòng học hôm nay ở đâu?',
  ],
  room_booking_status: [
    'Đặt phòng mới ở đâu?',
    'Phòng nào đang trống?',
    'Quy trình duyệt đặt phòng mất bao lâu?',
  ],
  event_upcoming: [
    'Đăng ký sự kiện như thế nào?',
    'Xem danh sách sự kiện đầy đủ?',
    'Sự kiện này diễn ra ở đâu?',
  ],
  notification_unread: [
    'Xem tất cả thông báo?',
    'Bật thông báo đẩy như thế nào?',
  ],
  kb_retrieval: [
    'Hỏi thêm về dịch vụ này?',
    'Tôi cần hỗ trợ trực tiếp?',
  ],
  unknown: [
    'Đơn canteen của tôi',
    'Sách tôi đang mượn',
    'Lịch học hôm nay',
    'Sự kiện sắp tới',
    'Thông báo chưa đọc',
    'SOS gần đây',
  ],
};

function getSuggested(intent: string): string[] {
  return SUGGESTED[intent] ?? SUGGESTED['unknown']!;
}

@Injectable()
export class ChatbotService {
  constructor(private readonly prisma: PrismaService) {}

  async query(userId: string, role: Role, dto: QueryChatbotDto) {
    const message = dto.message.trim();
    if (!message) {
      return {
        answer: 'Vui lòng nhập câu hỏi.',
        citations: [],
        deepLinks: [],
        suggestedQuestions: SUGGESTED['unknown'],
        confidence: 0,
        intent: 'empty',
      };
    }

    const session = await this.resolveSession(userId, dto.sessionId, message);
    await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        userId,
        role: 'user',
        content: message,
      },
    });

    const response = await this.answerByIntent(userId, role, message);
    await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        userId,
        role: 'assistant',
        content: response.answer,
        intent: response.intent,
        confidence: response.confidence,
        citations: toInputJson(response.citations),
        deepLinks: toInputJson(response.deepLinks),
      },
    });

    return {
      sessionId: session.id,
      ...response,
    };
  }

  async listSessions(userId: string) {
    const sessions = await this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: [{ updatedAt: 'desc' }],
    });
    return sessions.map((item) => ({
      id: item.id,
      title: item.title,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
  }

  async getMessages(userId: string, sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true },
    });
    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên chat');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem phiên chat này');
    }

    const messages = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: [{ createdAt: 'asc' }],
    });
    return messages.map((item) => ({
      id: item.id,
      role: item.role,
      content: item.content,
      intent: item.intent,
      confidence: item.confidence,
      citations: item.citations,
      deepLinks: item.deepLinks,
      createdAt: item.createdAt.toISOString(),
    }));
  }

  async upsertKnowledgeDocument(dto: UpsertKnowledgeDocumentDto) {
    const contentText = dto.contentText.trim();
    const lines = contentText
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    const chunks = lines.length ? lines : [contentText];

    return this.prisma.$transaction(async (tx) => {
      const document = await tx.knowledgeDocument.upsert({
        where: { slug: dto.slug.trim() },
        update: {
          title: dto.title.trim(),
          source: dto.source ?? 'manual',
          sourceUrl: dto.sourceUrl?.trim() || null,
          contentText,
          isActive: true,
        },
        create: {
          slug: dto.slug.trim(),
          title: dto.title.trim(),
          source: dto.source ?? 'manual',
          sourceUrl: dto.sourceUrl?.trim() || null,
          contentText,
          isActive: true,
        },
      });

      await tx.knowledgeChunk.deleteMany({
        where: { documentId: document.id },
      });

      for (const [index, chunkText] of chunks.entries()) {
        await tx.knowledgeChunk.create({
          data: {
            documentId: document.id,
            chunkIndex: index,
            contentText: chunkText,
            keywordTokens: tokenize(chunkText),
          },
        });
      }

      return document;
    });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async resolveSession(userId: string, sessionId: string | undefined, message: string) {
    if (!sessionId) {
      return this.prisma.chatSession.create({
        data: {
          userId,
          title: message.length > 64 ? `${message.slice(0, 61)}...` : message,
        },
      });
    }

    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true },
    });
    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên chat');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền dùng phiên chat này');
    }
    return session;
  }

  private async answerByIntent(userId: string, role: Role, message: string) {
    const tokens = tokenize(message);
    const has = (...keywords: string[]) =>
      keywords.every((kw) => tokens.some((t) => t.includes(kw)));

    // ---- Canteen order status (user) ----------------------------------------
    if (has('canteen') || (has('don') && tokens.includes('canteen'))) {
      const latestOrder = await this.prisma.canteenOrder.findFirst({
        where: { createdById: userId },
        orderBy: [{ createdAt: 'desc' }],
      });
      if (!latestOrder) {
        return {
          answer: 'Bạn chưa có đơn canteen nào gần đây.',
          citations: [],
          deepLinks: ['/services/canteen'],
          suggestedQuestions: getSuggested('canteen_order_status'),
          confidence: 0.95,
          intent: 'canteen_order_status',
        };
      }
      return {
        answer: `Đơn gần nhất ${latestOrder.orderCode} đang ở trạng thái ${latestOrder.status}. Tổng tiền ${latestOrder.totalAmount.toLocaleString('vi-VN')}đ.`,
        citations: [{ type: 'db', table: 'canteen_orders', id: latestOrder.id }],
        deepLinks: ['/services/canteen'],
        suggestedQuestions: getSuggested('canteen_order_status'),
        confidence: 0.97,
        intent: 'canteen_order_status',
      };
    }

    // ---- Library loans (user) ------------------------------------------------
    if (has('library') || has('sach') || has('muon') || has('thu')) {
      const loans = await this.prisma.libraryLoan.findMany({
        where: {
          borrowerId: userId,
          status: { in: [LibraryLoanStatus.borrowed, LibraryLoanStatus.overdue] },
        },
        include: {
          copy: { include: { book: true } },
        },
        orderBy: [{ dueAt: 'asc' }],
        take: 3,
      });
      if (!loans.length) {
        return {
          answer: 'Bạn hiện không có sách đang mượn.',
          citations: [],
          deepLinks: ['/services/library'],
          suggestedQuestions: getSuggested('library_my_loans'),
          confidence: 0.95,
          intent: 'library_my_loans',
        };
      }
      const summary = loans
        .map((loan) => `"${loan.copy.book.title}" (hạn ${loan.dueAt.toLocaleDateString('vi-VN')})`)
        .join('; ');
      return {
        answer: `Bạn đang mượn ${loans.length} cuốn: ${summary}.`,
        citations: loans.map((loan) => ({ type: 'db', table: 'library_loans', id: loan.id })),
        deepLinks: ['/services/library'],
        suggestedQuestions: getSuggested('library_my_loans'),
        confidence: 0.96,
        intent: 'library_my_loans',
      };
    }

    // ---- SOS ----------------------------------------------------------------
    if (has('sos') || has('khan') || has('cap')) {
      const sos = await this.prisma.sosRequest.findFirst({
        where: { requesterId: userId },
        orderBy: [{ createdAt: 'desc' }],
      });
      if (!sos) {
        return {
          answer: 'Bạn chưa có lịch sử SOS nào. Khi cần hỗ trợ khẩn cấp, hãy mở dịch vụ GPS/SOS.',
          citations: [],
          deepLinks: ['/services/gps-sos'],
          suggestedQuestions: getSuggested('sos_status'),
          confidence: 0.95,
          intent: 'sos_status',
        };
      }
      return {
        answer: `Yêu cầu SOS gần nhất đang ở trạng thái ${sos.status}, tạo lúc ${sos.createdAt.toLocaleString('vi-VN')}.`,
        citations: [{ type: 'db', table: 'sos_requests', id: sos.id }],
        deepLinks: ['/services/gps-sos'],
        suggestedQuestions: getSuggested('sos_status'),
        confidence: 0.95,
        intent: 'sos_status',
      };
    }

    // ---- Schedule today (student) -------------------------------------------
    if (has('schedule') || has('lich') || has('hoc') || has('mon') || has('tiet')) {
      const todayDow = new Date().getDay(); // 0=Sun,1=Mon,...
      const enrollments = await this.prisma.classEnrollment.findMany({
        where: { studentId: userId, status: 'active' },
        include: {
          classSection: {
            include: {
              course: true,
              meetings: {
                where: { dayOfWeek: todayDow },
                orderBy: [{ startTime: 'asc' }],
              },
            },
          },
        },
      });

      const todayMeetings = enrollments.flatMap((e) =>
        e.classSection.meetings.map((m) => ({
          course: e.classSection.course.name,
          startTime: m.startTime,
          endTime: m.endTime,
          room: m.room ?? 'chưa xác định',
        })),
      );

      if (!todayMeetings.length) {
        return {
          answer: 'Hôm nay bạn không có lịch học.',
          citations: [],
          deepLinks: ['/services/schedule'],
          suggestedQuestions: getSuggested('schedule_today'),
          confidence: 0.95,
          intent: 'schedule_today',
        };
      }
      const summary = todayMeetings
        .map((m) => `${m.course} (${m.startTime}–${m.endTime}, phòng ${m.room})`)
        .join('; ');
      return {
        answer: `Hôm nay bạn có ${todayMeetings.length} tiết: ${summary}.`,
        citations: [],
        deepLinks: ['/services/schedule'],
        suggestedQuestions: getSuggested('schedule_today'),
        confidence: 0.95,
        intent: 'schedule_today',
      };
    }

    // ---- Room booking status (user) -----------------------------------------
    if (has('room') || has('phong') || has('dat') || has('phong')) {
      const booking = await this.prisma.roomBooking.findFirst({
        where: { userId },
        include: { room: { select: { name: true } } },
        orderBy: [{ createdAt: 'desc' }],
      });
      if (!booking) {
        return {
          answer: 'Bạn chưa có yêu cầu đặt phòng nào.',
          citations: [],
          deepLinks: ['/services/room-booking'],
          suggestedQuestions: getSuggested('room_booking_status'),
          confidence: 0.93,
          intent: 'room_booking_status',
        };
      }
      return {
        answer: `Yêu cầu đặt phòng gần nhất: phòng ${booking.room.name} ngày ${booking.bookingDate.toLocaleDateString('vi-VN')}, trạng thái ${booking.status}.`,
        citations: [{ type: 'db', table: 'room_bookings', id: booking.id }],
        deepLinks: ['/services/room-booking'],
        suggestedQuestions: getSuggested('room_booking_status'),
        confidence: 0.95,
        intent: 'room_booking_status',
      };
    }

    // ---- Upcoming events ---------------------------------------------------
    if (has('event') || has('kien') || has('hoat')) {
      const events = await this.prisma.event.findMany({
        where: {
          status: EventStatus.open,
          startAt: { gte: new Date() },
        },
        orderBy: [{ startAt: 'asc' }],
        take: 3,
      });
      if (!events.length) {
        return {
          answer: 'Hiện chưa có sự kiện nào đang mở đăng ký.',
          citations: [],
          deepLinks: ['/services/events'],
          suggestedQuestions: getSuggested('event_upcoming'),
          confidence: 0.93,
          intent: 'event_upcoming',
        };
      }
      const summary = events
        .map((ev) => `"${ev.title}" – ${ev.startAt.toLocaleDateString('vi-VN')} tại ${ev.location}`)
        .join('; ');
      return {
        answer: `Có ${events.length} sự kiện sắp tới: ${summary}.`,
        citations: events.map((ev) => ({ type: 'db', table: 'events', id: ev.id })),
        deepLinks: ['/services/events'],
        suggestedQuestions: getSuggested('event_upcoming'),
        confidence: 0.95,
        intent: 'event_upcoming',
      };
    }

    // ---- Unread notifications -----------------------------------------------
    if (has('notification') || has('thong') || has('tin')) {
      const unreadCount = await this.prisma.notification.count({
        where: { userId, isRead: false },
      });
      const latest = await this.prisma.notification.findFirst({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }],
      });
      if (!latest) {
        return {
          answer: 'Bạn chưa có thông báo nào.',
          citations: [],
          deepLinks: ['/notifications'],
          suggestedQuestions: getSuggested('notification_unread'),
          confidence: 0.93,
          intent: 'notification_unread',
        };
      }
      return {
        answer: `Bạn có ${unreadCount} thông báo chưa đọc. Thông báo mới nhất: "${latest.title}".`,
        citations: [{ type: 'db', table: 'notifications', id: latest.id }],
        deepLinks: ['/notifications'],
        suggestedQuestions: getSuggested('notification_unread'),
        confidence: 0.93,
        intent: 'notification_unread',
      };
    }

    // ---- Canteen admin queue ------------------------------------------------
    if (role === Role.canteen_admin && has('hoan') && has('don')) {
      const pendingOrders = await this.prisma.canteenOrder.count({
        where: { status: 'paid' },
      });
      return {
        answer: `Hiện có ${pendingOrders} đơn đã thanh toán đang chờ bạn hoàn thành.`,
        citations: [{ type: 'db', table: 'canteen_orders', query: 'status=paid' }],
        deepLinks: ['/services/canteen/admin'],
        suggestedQuestions: getSuggested('canteen_admin_queue'),
        confidence: 0.92,
        intent: 'canteen_admin_queue',
      };
    }

    return this.answerByKnowledgeBase(message, tokens);
  }

  private async answerByKnowledgeBase(message: string, tokens: string[]) {
    if (!tokens.length) {
      return {
        answer:
          'Mình chưa hiểu rõ câu hỏi. Bạn có thể hỏi như: "đơn canteen của tôi", "sách tôi đang mượn", "lịch học hôm nay", "sự kiện sắp tới".',
        citations: [],
        deepLinks: ['/services'],
        suggestedQuestions: getSuggested('unknown'),
        confidence: 0.35,
        intent: 'unknown',
      };
    }

    // Detect which service slug the question is most likely about
    const serviceHint = this.detectServiceSlug(tokens);

    const chunks = await this.prisma.knowledgeChunk.findMany({
      where: {
        keywordTokens: { hasSome: tokens },
        document: {
          isActive: true,
          ...(serviceHint ? { slug: serviceHint } : {}),
        },
      },
      include: {
        document: {
          select: { id: true, title: true, slug: true, sourceUrl: true },
        },
      },
      take: 30,
    });

    // If service-filtered search returned nothing, retry without the filter
    const fallbackChunks =
      serviceHint && chunks.length === 0
        ? await this.prisma.knowledgeChunk.findMany({
            where: {
              keywordTokens: { hasSome: tokens },
              document: { isActive: true },
            },
            include: {
              document: {
                select: { id: true, title: true, slug: true, sourceUrl: true },
              },
            },
            take: 30,
          })
        : chunks;

    const ranked = fallbackChunks
      .map((chunk) => {
        const hitCount = tokens.filter((token) => chunk.keywordTokens.includes(token)).length;
        return { chunk, score: hitCount / tokens.length };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_KB_MATCHES);

    if (!ranked.length || ranked[0]!.score < 0.2) {
      return {
        answer:
          'Mình chưa đủ chắc chắn để trả lời chính xác. Bạn có thể mở thẳng mục Dịch vụ liên quan hoặc hỏi lại với từ khóa cụ thể hơn.',
        citations: [],
        deepLinks: ['/services'],
        suggestedQuestions: getSuggested('unknown'),
        confidence: 0.2,
        intent: 'kb_low_confidence',
      };
    }

    const answer = ranked.map((item, index) => `${index + 1}. ${item.chunk.contentText}`).join('\n');
    const citations = ranked.map((item) => ({
      type: 'kb',
      documentId: item.chunk.document.id,
      documentTitle: item.chunk.document.title,
      slug: item.chunk.document.slug,
      sourceUrl: item.chunk.document.sourceUrl,
    }));

    return {
      answer,
      citations,
      deepLinks: ['/services'],
      suggestedQuestions: getSuggested('kb_retrieval'),
      confidence: Math.max(...ranked.map((item) => item.score)),
      intent: 'kb_retrieval',
    };
  }

  /** Map tokens to a KB document slug for pre-filtering */
  private detectServiceSlug(tokens: string[]): string | null {
    const has = (kw: string) => tokens.some((t) => t.includes(kw));
    if (has('canteen')) return 'canteen-service';
    if (has('library') || has('sach') || has('muon')) return 'library-service';
    if (has('sos') || has('gps')) return 'sos-service';
    if (has('room') || has('phong') || has('dat')) return 'room-booking-service';
    if (has('schedule') || has('lich') || has('hoc')) return 'schedule-service';
    if (has('event') || has('kien')) return 'event-service';
    if (has('notification') || has('thong')) return 'notification-service';
    return null;
  }
}
