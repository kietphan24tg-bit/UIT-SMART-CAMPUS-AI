import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

import { ChatbotDomainRegistry } from './chatbot.domain-registry';
import { ChatbotKnowledgeService } from './chatbot.knowledge.service';
import { ChatbotLiveDomainHandlersService } from './chatbot.live-domain-handlers.service';
import { ChatbotOrchestratorService } from './chatbot.orchestrator.service';
import { ChatbotService } from './chatbot.service';

describe('ChatbotService', () => {
  const prisma: any = {
    chatSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    canteenOrder: {
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    canteenCategory: {
      findMany: jest.fn(),
    },
    libraryLoan: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    libraryLoanRequest: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    libraryBook: {
      findMany: jest.fn(),
    },
    sosRequest: {
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    classSection: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    classEnrollment: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    attendanceSession: {
      findMany: jest.fn(),
    },
    attendanceRecord: {
      findFirst: jest.fn(),
    },
    roomBooking: {
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    event: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    notification: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    knowledgeChunk: {
      findMany: jest.fn(),
    },
    knowledgeDocument: {
      upsert: jest.fn(),
    },
    studyMaterial: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    vehicle: {
      findMany: jest.fn(),
    },
    parkingSlot: {
      count: jest.fn(),
    },
    telemetrySnapshot: {
      findFirst: jest.fn(),
    },
    grade: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: ChatbotService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.chatSession.create.mockResolvedValue({ id: 'session-1' });
    prisma.chatMessage.create.mockResolvedValue(undefined);
    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        knowledgeDocument: prisma.knowledgeDocument,
        knowledgeChunk: {
          deleteMany: jest.fn(),
          create: jest.fn(),
        },
      }),
    );

    const registry = new ChatbotDomainRegistry();
    const knowledge = new ChatbotKnowledgeService(prisma, registry);
    const liveHandlers = new ChatbotLiveDomainHandlersService(prisma, registry);
    const orchestrator = new ChatbotOrchestratorService(registry, liveHandlers, knowledge);
    service = new ChatbotService(prisma, orchestrator, registry, knowledge);
  });

  it('returns empty intent when message is blank', async () => {
    const result = await service.query('student-1', Role.student, {
      message: '   ',
    });

    expect(result.intent).toBe('empty');
    expect(prisma.chatSession.create).not.toHaveBeenCalled();
  });

  it('answers study materials queries before generic knowledge fallback', async () => {
    prisma.studyMaterial.findMany.mockResolvedValue([
      {
        id: 'material-1',
        title: 'Đề thi cuối kỳ SE346',
        description: 'Đề thi tham khảo',
        category: 'exam',
        fileName: 'se346-final.pdf',
        uploader: { firstName: 'Minh', lastName: 'Nguyen' },
      },
    ]);

    const result = await service.query('student-1', Role.student, {
      message: 'Cho minh xem tai lieu de thi moi',
    });

    expect(result.domain).toBe('study-materials');
    expect(result.intent).toBe('study_materials_search');
    expect(result.answer).toContain('Đề thi cuối kỳ SE346');
  });

  it('builds student summary without admin-only routes', async () => {
    prisma.classEnrollment.findMany.mockResolvedValue([
      {
        classSection: {
          course: { name: 'Toán rời rạc' },
          meetings: [{ id: 'meeting-1', startTime: '07:30', endTime: '09:00', room: 'A101', dayOfWeek: new Date().getDay() }],
        },
      },
    ]);
    prisma.attendanceRecord.findFirst.mockResolvedValue(null);
    prisma.notification.count.mockResolvedValue(2);
    prisma.notification.findFirst.mockResolvedValue({
      id: 'notif-1',
      title: 'Bạn có thông báo học vụ mới',
    });
    prisma.canteenOrder.findFirst.mockResolvedValue(null);

    const result = await service.getSummary('student-1', Role.student, 'today');

    expect(result.answerType).toBe('summary');
    expect(result.actions.some((item) => item.route === '/services/admin-tools')).toBe(false);
    expect(result.answer).toContain('Toán rời rạc');
  });

  it('forbids reading messages from a session owned by another user', async () => {
    prisma.chatSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'student-2',
    });

    await expect(service.getMessages('student-1', 'session-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('maps legacy deepLinks to friendly action labels when loading messages', async () => {
    prisma.chatSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'student-1',
    });
    prisma.chatMessage.findMany.mockResolvedValue([
      {
        id: 'msg-1',
        role: 'assistant',
        content: 'Bạn có một đơn canteen.',
        intent: 'canteen_order_status',
        confidence: 0.9,
        citations: [],
        deepLinks: ['/services/canteen'],
        createdAt: new Date('2026-06-02T01:00:00.000Z'),
      },
    ]);

    const messages = await service.getMessages('student-1', 'session-1');

    expect(messages[0]?.actions).toEqual([
      { label: 'Mở canteen', route: '/services/canteen', kind: 'navigate' },
    ]);
  });

  it('returns admin capabilities with ops scope', () => {
    const capabilities = service.getCapabilities(Role.admin);

    expect(capabilities.summaryScopes.some((item) => item.scope === 'ops')).toBe(true);
    expect(capabilities.quickPrompts.length).toBeGreaterThan(0);
  });
});
