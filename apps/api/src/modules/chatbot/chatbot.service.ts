import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LibraryLoanStatus, Role } from '@prisma/client';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import type { QueryChatbotDto, UpsertKnowledgeDocumentDto } from './dto/chatbot.dto';

const MAX_KB_MATCHES = 4;

function tokenize(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function toInputJson(value: unknown) {
  return value as Prisma.InputJsonValue;
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
    const normalized = message.toLowerCase();
    if (normalized.includes('canteen') && normalized.includes('don')) {
      const latestOrder = await this.prisma.canteenOrder.findFirst({
        where: { createdById: userId },
        orderBy: [{ createdAt: 'desc' }],
      });
      if (!latestOrder) {
        return {
          answer: 'Bạn chưa có đơn canteen nào gần đây.',
          citations: [],
          deepLinks: ['/services/canteen'],
          confidence: 0.95,
          intent: 'canteen_order_status',
        };
      }
      return {
        answer: `Đơn gần nhất ${latestOrder.orderCode} đang ở trạng thái ${latestOrder.status}. Tổng tiền ${latestOrder.totalAmount.toLocaleString('vi-VN')}đ.`,
        citations: [{ type: 'db', table: 'canteen_orders', id: latestOrder.id }],
        deepLinks: ['/services/canteen'],
        confidence: 0.97,
        intent: 'canteen_order_status',
      };
    }

    if (normalized.includes('sach') && (normalized.includes('muon') || normalized.includes('thu vien'))) {
      const loans = await this.prisma.libraryLoan.findMany({
        where: {
          borrowerId: userId,
          status: { in: [LibraryLoanStatus.borrowed, LibraryLoanStatus.overdue] },
        },
        include: {
          copy: {
            include: {
              book: true,
            },
          },
        },
        orderBy: [{ dueAt: 'asc' }],
        take: 3,
      });
      if (!loans.length) {
        return {
          answer: 'Bạn hiện không có sách đang mượn.',
          citations: [],
          deepLinks: ['/services/library'],
          confidence: 0.95,
          intent: 'library_my_loans',
        };
      }
      const summary = loans
        .map((loan) => `${loan.copy.book.title} (hạn ${loan.dueAt.toLocaleDateString('vi-VN')})`)
        .join('; ');
      return {
        answer: `Bạn đang mượn ${loans.length} sách: ${summary}.`,
        citations: loans.map((loan) => ({ type: 'db', table: 'library_loans', id: loan.id })),
        deepLinks: ['/services/library'],
        confidence: 0.96,
        intent: 'library_my_loans',
      };
    }

    if (normalized.includes('sos')) {
      const sos = await this.prisma.sosRequest.findFirst({
        where: { requesterId: userId },
        orderBy: [{ createdAt: 'desc' }],
      });
      if (!sos) {
        return {
          answer: 'Bạn chưa có lịch sử SOS nào. Khi cần hỗ trợ khẩn cấp, hãy mở dịch vụ GPS/SOS.',
          citations: [],
          deepLinks: ['/services/gps-sos'],
          confidence: 0.95,
          intent: 'sos_status',
        };
      }
      return {
        answer: `Yêu cầu SOS gần nhất của bạn đang ở trạng thái ${sos.status}, tạo lúc ${sos.createdAt.toLocaleString(
          'vi-VN',
        )}.`,
        citations: [{ type: 'db', table: 'sos_requests', id: sos.id }],
        deepLinks: ['/services/gps-sos'],
        confidence: 0.95,
        intent: 'sos_status',
      };
    }

    if (role === Role.canteen_admin && normalized.includes('hoan thanh') && normalized.includes('don')) {
      const pendingOrders = await this.prisma.canteenOrder.count({
        where: { status: 'paid' },
      });
      return {
        answer: `Hiện có ${pendingOrders} đơn đã thanh toán đang chờ bạn hoàn thành.`,
        citations: [{ type: 'db', table: 'canteen_orders', query: 'status=paid' }],
        deepLinks: ['/services/canteen/admin'],
        confidence: 0.92,
        intent: 'canteen_admin_queue',
      };
    }

    return this.answerByKnowledgeBase(message);
  }

  private async answerByKnowledgeBase(message: string) {
    const tokens = tokenize(message);
    if (!tokens.length) {
      return {
        answer:
          'Mình chưa hiểu rõ câu hỏi. Bạn có thể hỏi cụ thể hơn, ví dụ: "đơn canteen của tôi", "sách tôi đang mượn", hoặc "SOS gần đây".',
        citations: [],
        deepLinks: ['/services'],
        confidence: 0.35,
        intent: 'unknown',
      };
    }

    const chunks = await this.prisma.knowledgeChunk.findMany({
      where: {
        keywordTokens: {
          hasSome: tokens,
        },
        document: {
          isActive: true,
        },
      },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            slug: true,
            sourceUrl: true,
          },
        },
      },
      take: 30,
    });

    const ranked = chunks
      .map((chunk) => {
        const hitCount = tokens.filter((token) => chunk.keywordTokens.includes(token)).length;
        return {
          chunk,
          score: hitCount / tokens.length,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_KB_MATCHES);

    if (!ranked.length || ranked[0]!.score < 0.2) {
      return {
        answer:
          'Mình chưa đủ chắc chắn để trả lời chính xác. Bạn có thể mở thẳng mục Dịch vụ liên quan hoặc hỏi lại với từ khóa cụ thể hơn.',
        citations: [],
        deepLinks: ['/services'],
        confidence: 0.2,
        intent: 'kb_low_confidence',
      };
    }

    const answer = ranked
      .map((item, index) => `${index + 1}. ${item.chunk.contentText}`)
      .join('\n');
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
      confidence: Math.max(...ranked.map((item) => item.score)),
      intent: 'kb_retrieval',
    };
  }
}
