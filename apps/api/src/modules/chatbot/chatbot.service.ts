import {
  BadGatewayException,
  ForbiddenException,
  GatewayTimeoutException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma, type Role } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import {
  type AgentProposalConfirmResult,
  type AgentProposalStatus,
  type AgentQueryMappedResponse,
  AiAgentService,
} from './ai-agent.service';
import { ChatbotDomainRegistry } from './chatbot.domain-registry';
import { ChatbotKnowledgeService } from './chatbot.knowledge.service';
import { ChatbotOrchestratorService } from './chatbot.orchestrator.service';
import type {
  AgentProposal,
  ChatbotAnswer,
  ChatbotAnswerType,
} from './chatbot.types';
import type { QueryChatbotDto, UpsertKnowledgeDocumentDto } from './dto/chatbot.dto';

const AGENT_HISTORY_LIMIT = 10;
const AGENT_HISTORY_MAX_CHARS = 16_000;

function toInputJson(value: unknown) {
  return value as Prisma.InputJsonValue;
}

type AgentHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

@Injectable()
export class ChatbotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: ChatbotOrchestratorService,
    private readonly registry: ChatbotDomainRegistry,
    private readonly knowledgeService: ChatbotKnowledgeService,
    @Inject(AiAgentService)
    private readonly aiAgentService: Pick<
      AiAgentService,
      'isEnabled' | 'query' | 'getProposal' | 'confirmProposal' | 'rejectProposal'
    >,
  ) {}

  async query(
    userId: string,
    role: Role,
    dto: QueryChatbotDto,
    authHeader = '',
    requestId?: string,
  ) {
    const message = dto.message.trim();

    if (!message) {
      return this.orchestrator.answerMessage(userId, role, message);
    }

    const session = await this.resolveSession(userId, dto.sessionId, message);
    const history = await this.loadRecentHistory(userId, session.id);
    const response = await this.answerMessageWithFallback(
      userId,
      role,
      message,
      session.id,
      history,
      authHeader,
      requestId,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.chatMessage.create({
        data: {
          sessionId: session.id,
          userId,
          role: 'user',
          content: message,
        },
        select: { id: true },
      });

      const assistantMessage = {
        sessionId: session.id,
        userId,
        role: 'assistant' as const,
        content: response.answer,
        intent: response.intent,
        confidence: response.confidence,
        citations: toInputJson(response.citations),
        deepLinks: toInputJson(response.deepLinks),
      };
      try {
        await tx.chatMessage.create({
          data: {
            ...assistantMessage,
            agentMetadata: toInputJson(this.buildAgentMetadata(response)),
          },
          select: { id: true },
        });
      } catch (error) {
        if (!this.isMissingAgentMetadataColumn(error)) {
          throw error;
        }
        await tx.chatMessage.create({
          data: assistantMessage,
          select: { id: true },
        });
      }

      await tx.chatSession.update({
        where: { id: session.id },
        data: { updatedAt: new Date() },
        select: { id: true },
      });
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
      throw new NotFoundException('Khong tim thay phien chat');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException('Ban khong co quyen xem phien chat nay');
    }

    let messages;
    try {
      messages = await this.prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: [{ createdAt: 'asc' }],
      });
    } catch (error) {
      if (!this.isMissingAgentMetadataColumn(error)) {
        throw error;
      }
      messages = await this.prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: [{ createdAt: 'asc' }],
        select: {
          id: true,
          role: true,
          content: true,
          intent: true,
          confidence: true,
          citations: true,
          deepLinks: true,
          createdAt: true,
        },
      });
    }
    return messages.map((item) => {
      const deepLinks = Array.isArray(item.deepLinks)
        ? item.deepLinks.filter((link): link is string => typeof link === 'string')
        : [];
      const agentMetadata =
        'agentMetadata' in item
          ? (item.agentMetadata as Prisma.JsonValue | null)
          : null;

      return {
        id: item.id,
        role: item.role,
        content: item.content,
        intent: item.intent,
        confidence: item.confidence,
        citations: item.citations,
        deepLinks: item.deepLinks,
        actions: this.registry.buildActionsFromRoutes(deepLinks),
        answerType: this.getStoredAnswerType(agentMetadata),
        proposal: this.getStoredProposal(agentMetadata),
        trace: [],
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

  async getProposal(userId: string, proposalId: string, authHeader: string, requestId?: string) {
    void userId;
    return this.aiAgentService.getProposal(authHeader, proposalId, requestId);
  }

  async confirmProposal(
    userId: string,
    proposalId: string,
    authHeader: string,
    requestId?: string,
  ): Promise<AgentProposalConfirmResult> {
    void userId;
    return this.aiAgentService.confirmProposal(authHeader, proposalId, requestId);
  }

  async rejectProposal(
    userId: string,
    proposalId: string,
    authHeader: string,
    requestId?: string,
  ): Promise<AgentProposalStatus> {
    void userId;
    return this.aiAgentService.rejectProposal(authHeader, proposalId, requestId);
  }

  private async answerMessageWithFallback(
    userId: string,
    role: Role,
    message: string,
    sessionId: string,
    history: AgentHistoryMessage[],
    authHeader: string,
    requestId?: string,
  ): Promise<ChatbotAnswer> {
    if (!this.aiAgentService.isEnabled()) {
      return this.orchestrator.answerMessage(userId, role, message);
    }

    try {
      const response = await this.aiAgentService.query(
        authHeader,
        role,
        { message, sessionId, history },
        requestId,
      );
      return this.mapAgentResponse(response);
    } catch (error) {
      if (this.shouldFallbackToLegacy(error)) {
        return this.orchestrator.answerMessage(userId, role, message);
      }
      throw error;
    }
  }

  private mapAgentResponse(response: AgentQueryMappedResponse): ChatbotAnswer {
    return {
      answer: response.answer,
      citations: response.citations,
      actions: [],
      deepLinks: [],
      suggestedQuestions: [],
      confidence: 0,
      intent: 'agent',
      domain: 'general',
      answerType: response.answerType,
      trace: response.trace,
      proposal: response.proposal,
    };
  }

  private shouldFallbackToLegacy(error: unknown): boolean {
    if (!(error instanceof HttpException)) {
      return true;
    }

    return (
      error instanceof BadGatewayException ||
      error instanceof ServiceUnavailableException ||
      error instanceof GatewayTimeoutException
    );
  }

  private buildAgentMetadata(answer: ChatbotAnswer) {
    if (answer.answerType !== 'answer' && answer.answerType !== 'confirmation_required') {
      return null;
    }

    return {
      answerType: answer.answerType,
      proposal: answer.proposal
        ? {
            id: answer.proposal.id,
            tool: answer.proposal.tool,
            operation: answer.proposal.operation,
            riskLevel: answer.proposal.riskLevel,
            summary: answer.proposal.summary,
            status: answer.proposal.status,
            expiresAt: answer.proposal.expiresAt,
            confirmPath: answer.proposal.confirmPath,
            rejectPath: answer.proposal.rejectPath,
          }
        : null,
    };
  }

  private getStoredAnswerType(value: Prisma.JsonValue | null): ChatbotAnswerType | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    const raw = value as { answerType?: unknown };
    return typeof raw.answerType === 'string' ? (raw.answerType as ChatbotAnswerType) : null;
  }

  private getStoredProposal(value: Prisma.JsonValue | null): AgentProposal | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    const raw = value as { proposal?: unknown };
    if (!raw.proposal || typeof raw.proposal !== 'object' || Array.isArray(raw.proposal)) {
      return null;
    }

    const proposal = raw.proposal as Record<string, unknown>;
    if (
      typeof proposal.id !== 'string' ||
      typeof proposal.tool !== 'string' ||
      typeof proposal.operation !== 'string' ||
      typeof proposal.riskLevel !== 'string' ||
      typeof proposal.summary !== 'string' ||
      typeof proposal.status !== 'string' ||
      typeof proposal.expiresAt !== 'string' ||
      typeof proposal.confirmPath !== 'string' ||
      typeof proposal.rejectPath !== 'string'
    ) {
      return null;
    }

    return {
      id: proposal.id,
      tool: proposal.tool,
      operation: proposal.operation,
      riskLevel: proposal.riskLevel,
      summary: proposal.summary,
      status: proposal.status,
      expiresAt: proposal.expiresAt,
      confirmPath: proposal.confirmPath,
      rejectPath: proposal.rejectPath,
    };
  }

  private isMissingAgentMetadataColumn(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2022') {
      return false;
    }
    return String(error.meta?.column ?? '').includes('agent_metadata');
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
      throw new NotFoundException('Khong tim thay phien chat');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException('Ban khong co quyen dung phien chat nay');
    }
    return session;
  }

  private async loadRecentHistory(userId: string, sessionId: string): Promise<AgentHistoryMessage[]> {
    const messages = await this.prisma.chatMessage.findMany({
      where: {
        sessionId,
        userId,
        role: { in: ['user', 'assistant'] },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: AGENT_HISTORY_LIMIT,
      select: {
        role: true,
        content: true,
      },
    });

    let remainingChars = AGENT_HISTORY_MAX_CHARS;
    const boundedHistory: AgentHistoryMessage[] = [];

    for (const item of messages) {
      const content = item.content.trim();
      if (!content) {
        continue;
      }

      if (content.length > remainingChars) {
        continue;
      }

      boundedHistory.push({
        role: item.role as AgentHistoryMessage['role'],
        content,
      });
      remainingChars -= content.length;
    }

    return boundedHistory.reverse();
  }
}
