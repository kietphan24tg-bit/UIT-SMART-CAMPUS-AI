import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';

import { ChatbotDomainRegistry } from './chatbot.domain-registry';
import { ChatbotKnowledgeService } from './chatbot.knowledge.service';
import { ChatbotLiveDomainHandlersService } from './chatbot.live-domain-handlers.service';
import type {
  ChatbotAnswer,
  ChatbotCapabilitiesResponse,
  ChatbotDomainId,
  ChatbotMessageContext,
  ChatbotSummaryScope,
} from './chatbot.types';
import {
  finalizeAnswer,
  normalizeSearchText,
  tokenize,
  uniqueStrings,
} from './chatbot.utils';

const SUMMARY_HINTS = [
  'tom tat',
  'tong quan',
  'snapshot',
  'dashboard',
  'hom nay cua toi',
  'queue cua toi',
  'hoc vu cua toi',
];

@Injectable()
export class ChatbotOrchestratorService {
  constructor(
    private readonly registry: ChatbotDomainRegistry,
    private readonly liveHandlers: ChatbotLiveDomainHandlersService,
    private readonly knowledge: ChatbotKnowledgeService,
  ) {}

  async answerMessage(userId: string, role: Role, message: string): Promise<ChatbotAnswer> {
    const trimmed = message.trim();
    if (!trimmed) {
      return finalizeAnswer({
        answer: 'Vui lòng nhập câu hỏi.',
        citations: [],
        actions: [],
        suggestedQuestions: ['Hôm nay của tôi', 'Lịch học hôm nay', 'Thông báo chưa đọc'],
        confidence: 0,
        intent: 'empty',
        domain: 'general',
        answerType: 'fallback',
      });
    }

    const context = this.createMessageContext(userId, role, trimmed);
    const summaryScope = this.detectSummaryScope(context);
    if (summaryScope) {
      return this.buildSummary(userId, role, summaryScope);
    }

    const rankedDomains = this.registry.rankDomains(context);
    for (const domain of rankedDomains) {
      const handler = this.liveHandlers.getHandler(domain.id);
      if (!handler || !handler.canHandle(context)) {
        continue;
      }

      try {
        const answer = await handler.answer(context);
        if (answer) {
          return answer;
        }
      } catch {
        continue;
      }
    }

    return this.knowledge.answerByKnowledgeBase(context, rankedDomains[0]?.id ?? null);
  }

  async buildSummary(userId: string, role: Role, scope: ChatbotSummaryScope) {
    const domainIds = this.pickSummaryDomains(role, scope);
    return this.liveHandlers.buildScopedSummary(
      {
        userId,
        role,
        scope,
        now: new Date(),
      },
      domainIds,
    );
  }

  getCapabilities(role: Role): ChatbotCapabilitiesResponse {
    const visibleDomains = this.registry.getVisibleDomains(role);
    const domains = visibleDomains.map((domain) => ({
      id: domain.id,
      label: domain.label,
      description: domain.description,
      route: domain.route,
      actionLabel: domain.actionLabel,
      quickPrompts: this.liveHandlers.getSuggestedQuestions(domain.id, role).slice(0, 3),
    }));

    return {
      quickPrompts: uniqueStrings(domains.flatMap((item) => item.quickPrompts)).slice(0, 8),
      summaryScopes: this.registry.getCapabilityScopes(role),
      domains,
    };
  }

  private createMessageContext(userId: string, role: Role, message: string): ChatbotMessageContext {
    return {
      userId,
      role,
      message,
      normalizedMessage: normalizeSearchText(message),
      tokens: tokenize(message),
      now: new Date(),
    };
  }

  private detectSummaryScope(context: ChatbotMessageContext): ChatbotSummaryScope | null {
    const looksLikeSummary = SUMMARY_HINTS.some((hint) => context.normalizedMessage.includes(hint));
    if (!looksLikeSummary && !context.tokens.some((token) => ['today', 'ops', 'work'].includes(token))) {
      return null;
    }

    if (
      context.normalizedMessage.includes('ops') ||
      context.normalizedMessage.includes('van hanh') ||
      context.normalizedMessage.includes('fire') ||
      context.normalizedMessage.includes('telemetry')
    ) {
      return 'ops';
    }

    if (
      context.normalizedMessage.includes('hom nay') ||
      context.normalizedMessage.includes('today')
    ) {
      return 'today';
    }

    return isAdminLike(context.role) ? 'work' : 'work';
  }

  private pickSummaryDomains(role: Role, scope: ChatbotSummaryScope): ChatbotDomainId[] {
    if (role === Role.student) {
      return scope === 'today'
        ? ['schedule', 'attendance', 'notifications', 'canteen']
        : ['grades', 'registrations', 'study-materials', 'library'];
    }

    if (role === Role.lecturer) {
      return scope === 'today'
        ? ['schedule', 'attendance', 'notifications']
        : ['grades', 'study-materials', 'room-bookings', 'canteen'];
    }

    return scope === 'ops'
      ? ['ops', 'parking', 'sos']
      : ['canteen', 'room-bookings', 'study-materials', 'library'];
  }
}

function isAdminLike(role: Role) {
  return role === Role.admin || role === Role.super_admin || role === Role.canteen_admin;
}
