import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Role } from '@prisma/client';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { ChatbotDomainRegistry } from './chatbot.domain-registry';
import { ChatbotKnowledgeService } from './chatbot.knowledge.service';
import { ChatbotOrchestratorService } from './chatbot.orchestrator.service';
import type { QueryChatbotDto, UpsertKnowledgeDocumentDto } from './dto/chatbot.dto';

function toInputJson(value: unknown) {
  return value as Prisma.InputJsonValue;
}

@Injectable()
export class ChatbotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: ChatbotOrchestratorService,
    private readonly registry: ChatbotDomainRegistry,
    private readonly knowledgeService: ChatbotKnowledgeService,
  ) {}

  async query(userId: string, role: Role, dto: QueryChatbotDto) {
    const message = dto.message.trim();
    const response = await this.orchestrator.answerMessage(userId, role, message);

    if (!message) {
      return response;
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

  async getSummary(userId: string, role: Role, scope: 'today' | 'work' | 'ops') {
    return this.orchestrator.buildSummary(userId, role, scope);
  }

  getCapabilities(role: Role) {
    return this.orchestrator.getCapabilities(role);
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
    return messages.map((item) => {
      const deepLinks = Array.isArray(item.deepLinks)
        ? item.deepLinks.filter((link): link is string => typeof link === 'string')
        : [];

      return {
        id: item.id,
        role: item.role,
        content: item.content,
        intent: item.intent,
        confidence: item.confidence,
        citations: item.citations,
        deepLinks: item.deepLinks,
        actions: this.registry.buildActionsFromRoutes(deepLinks),
        createdAt: item.createdAt.toISOString(),
      };
    });
  }

  upsertKnowledgeDocument(dto: UpsertKnowledgeDocumentDto) {
    return this.knowledgeService.upsertKnowledgeDocument(dto);
  }

  syncKnowledgeDocuments() {
    return this.knowledgeService.syncBuiltInKnowledgeDocuments();
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
}
