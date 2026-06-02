import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { ChatbotDomainRegistry } from './chatbot.domain-registry';
import type {
  ChatbotAnswer,
  ChatbotDomainId,
  ChatbotMessageContext,
} from './chatbot.types';
import { finalizeAnswer, tokenize } from './chatbot.utils';

const MAX_KB_MATCHES = 4;

function toInputJson(value: unknown) {
  return value as Prisma.InputJsonValue;
}

@Injectable()
export class ChatbotKnowledgeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: ChatbotDomainRegistry,
  ) {}

  async upsertKnowledgeDocument(dto: {
    slug: string;
    title: string;
    source?: 'manual' | 'faq' | 'policy' | 'service';
    sourceUrl?: string;
    contentText: string;
  }) {
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

  async syncBuiltInKnowledgeDocuments() {
    const domains = [
      ...this.registry.getVisibleDomains(Role.student),
      ...this.registry.getVisibleDomains(Role.lecturer),
      ...this.registry.getVisibleDomains(Role.admin),
      ...this.registry.getVisibleDomains(Role.canteen_admin),
      ...this.registry.getVisibleDomains(Role.super_admin),
    ];
    const uniqueDomains = Array.from(new Map(domains.map((item) => [item.id, item])).values());

    const synced = [];
    for (const domain of uniqueDomains) {
      const contentText = [
        `${domain.label}: ${domain.description}`,
        `Lối vào chính: ${domain.actionLabel} tại ${domain.route}.`,
        `Từ khóa chính: ${domain.keywords.join(', ')}.`,
        `Câu hỏi mẫu: ${domain.phrases.slice(0, 3).join('; ')}.`,
      ].join('\n');

      const document = await this.upsertKnowledgeDocument({
        slug: domain.knowledgeSlug,
        title: domain.label,
        source: 'service',
        sourceUrl: domain.route,
        contentText,
      });
      synced.push(document.slug);
    }

    return {
      syncedCount: synced.length,
      slugs: synced,
    };
  }

  async answerByKnowledgeBase(
    context: ChatbotMessageContext,
    preferredDomainId?: ChatbotDomainId | null,
  ): Promise<ChatbotAnswer> {
    if (!context.tokens.length) {
      return finalizeAnswer({
        answer:
          'Mình chưa hiểu rõ câu hỏi. Bạn có thể hỏi cụ thể hơn về lịch học, điểm, tài liệu, thư viện, canteen hoặc các dịch vụ đang có trong app.',
        citations: [],
        actions: [this.registry.buildDomainAction('campus-map', '/services')],
        suggestedQuestions: [
          'Hôm nay của tôi',
          'Lịch học hôm nay',
          'Tài liệu mới',
          'Đơn canteen gần nhất',
        ],
        confidence: 0.25,
        intent: 'unknown',
        domain: preferredDomainId ?? 'general',
        answerType: 'fallback',
      });
    }

    const preferred = preferredDomainId ? this.registry.getDomain(preferredDomainId) : null;
    const initialChunks = await this.prisma.knowledgeChunk.findMany({
      where: {
        keywordTokens: { hasSome: context.tokens },
        document: {
          isActive: true,
          ...(preferred ? { slug: preferred.knowledgeSlug } : {}),
        },
      },
      include: {
        document: {
          select: { id: true, title: true, slug: true, sourceUrl: true },
        },
      },
      take: 30,
    });

    const chunks =
      preferred && initialChunks.length === 0
        ? await this.prisma.knowledgeChunk.findMany({
            where: {
              keywordTokens: { hasSome: context.tokens },
              document: { isActive: true },
            },
            include: {
              document: {
                select: { id: true, title: true, slug: true, sourceUrl: true },
              },
            },
            take: 30,
          })
        : initialChunks;

    const ranked = chunks
      .map((chunk) => {
        const hitCount = context.tokens.filter((token) => chunk.keywordTokens.includes(token)).length;
        return { chunk, score: hitCount / context.tokens.length };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_KB_MATCHES);

    if (!ranked.length || ranked[0]!.score < 0.2) {
      const fallbackDomain = preferredDomainId ?? 'campus-map';
      return finalizeAnswer({
        answer:
          'Mình chưa đủ chắc chắn để trả lời chính xác. Bạn có thể mở đúng dịch vụ liên quan hoặc hỏi lại bằng từ khóa cụ thể hơn.',
        citations: [],
        actions: [this.registry.buildDomainAction(fallbackDomain)],
        suggestedQuestions: [
          'Hôm nay của tôi',
          'Lịch học hôm nay',
          'Điểm hiện tại của tôi',
          'Tài liệu mới',
        ],
        confidence: 0.2,
        intent: 'kb_low_confidence',
        domain: fallbackDomain,
        answerType: 'fallback',
      });
    }

    return finalizeAnswer({
      answer: ranked.map((item, index) => `${index + 1}. ${item.chunk.contentText}`).join('\n'),
      citations: ranked.map((item) => ({
        type: 'kb',
        label: item.chunk.document.title,
        sourceId: item.chunk.document.id,
        slug: item.chunk.document.slug,
        route: item.chunk.document.sourceUrl ?? undefined,
        sourceUrl: item.chunk.document.sourceUrl,
      })),
      actions: preferredDomainId ? [this.registry.buildDomainAction(preferredDomainId)] : [],
      suggestedQuestions: [
        'Mình nên mở dịch vụ nào?',
        'Có hướng dẫn chi tiết hơn không?',
        'Tóm tắt hôm nay của tôi',
      ],
      confidence: Math.max(...ranked.map((item) => item.score)),
      intent: 'kb_retrieval',
      domain: preferredDomainId ?? 'general',
      answerType: 'knowledge',
    });
  }

  toInputJsonValue(value: unknown) {
    return toInputJson(value);
  }
}
