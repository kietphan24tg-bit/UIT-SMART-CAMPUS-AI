import { ForbiddenException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';

import type { AiAgentService } from './ai-agent.service';
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
      update: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
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
  let aiAgentService: jest.Mocked<
    Pick<AiAgentService, 'isEnabled' | 'query' | 'getProposal' | 'confirmProposal' | 'rejectProposal'>
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.chatSession.create.mockResolvedValue({ id: 'session-1' });
    prisma.chatMessage.create.mockResolvedValue(undefined);
    prisma.chatMessage.findMany.mockResolvedValue([]);
    prisma.chatSession.update.mockResolvedValue({ id: 'session-1' });
    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        chatSession: prisma.chatSession,
        chatMessage: prisma.chatMessage,
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
    aiAgentService = {
      isEnabled: jest.fn(() => false),
      query: jest.fn(),
      getProposal: jest.fn(),
      confirmProposal: jest.fn(),
      rejectProposal: jest.fn(),
    };
    service = new ChatbotService(prisma, orchestrator, registry, knowledge, aiAgentService);
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

  it('uses FastAPI agent response when feature flag is enabled', async () => {
    aiAgentService.isEnabled.mockReturnValue(true);
    aiAgentService.query.mockResolvedValue({
      answerType: 'confirmation_required',
      answer: 'Ban co chac muon huy dang ky lop NT101 khong?',
      citations: [
        {
          type: 'rag',
          label: 'Dieu 5',
          sourceId: 'quy-che.md',
          sourceFile: 'quy-che.md',
        },
      ],
      trace: [{ type: 'analysis', label: 'Da phan tich', status: 'completed' }],
      proposal: {
        id: '11111111-1111-1111-1111-111111111111',
        tool: 'drop_registration',
        operation: 'update',
        riskLevel: 'medium',
        summary: 'Huy dang ky lop NT101',
        status: 'pending',
        expiresAt: '2026-08-23T12:00:00.000Z',
        confirmPath: '/api/v1/chatbot/proposals/11111111-1111-1111-1111-111111111111/confirm',
        rejectPath: '/api/v1/chatbot/proposals/11111111-1111-1111-1111-111111111111/reject',
      },
    });

    const result = await service.query(
      'student-1',
      Role.student,
      { message: 'Huy dang ky lop NT101' },
      'Bearer token-1',
      'req-1',
    );

    expect(aiAgentService.query).toHaveBeenCalledWith(
      'Bearer token-1',
      Role.student,
      { message: 'Huy dang ky lop NT101', sessionId: 'session-1', history: [] },
      'req-1',
    );
    expect(result.answerType).toBe('confirmation_required');
    expect(result.proposal?.tool).toBe('drop_registration');
    expect(prisma.chatMessage.create).toHaveBeenCalledTimes(2);
    expect(prisma.chatSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: expect.objectContaining({
        updatedAt: expect.any(Date),
      }),
      select: { id: true },
    });
    expect(prisma.chatMessage.create.mock.calls[1]?.[0]?.data?.agentMetadata).toEqual(
      expect.objectContaining({
        answerType: 'confirmation_required',
      }),
    );
  });

  it('persists the answer without agent metadata when the database migration is pending', async () => {
    aiAgentService.isEnabled.mockReturnValue(true);
    aiAgentService.query.mockResolvedValue({
      answerType: 'answer',
      answer: 'Cau tra loi tu Agent',
      citations: [],
      trace: [],
      proposal: null,
    });
    prisma.chatMessage.create
      .mockResolvedValueOnce({ id: 'user-message' })
      .mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Missing column', {
          code: 'P2022',
          clientVersion: '6.0.0',
          meta: { column: 'agent_metadata' },
        }),
      )
      .mockResolvedValueOnce({ id: 'assistant-message' });

    const result = await service.query(
      'student-1',
      Role.student,
      { message: 'Xin chao' },
      'Bearer token-1',
    );

    expect(result.answer).toBe('Cau tra loi tu Agent');
    expect(prisma.chatMessage.create).toHaveBeenCalledTimes(3);
    expect(prisma.chatMessage.create.mock.calls[2]?.[0]?.data).not.toHaveProperty(
      'agentMetadata',
    );
  });

  it('loads the 10 latest messages in chronological order for agent history', async () => {
    aiAgentService.isEnabled.mockReturnValue(true);
    aiAgentService.query.mockResolvedValue({
      answerType: 'answer',
      answer: 'Da nho ngu canh.',
      citations: [],
      trace: [],
      proposal: null,
    });
    prisma.chatSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'student-1',
    });
    prisma.chatMessage.findMany.mockResolvedValue([
      { role: 'assistant', content: 'Tin nhan 12' },
      { role: 'user', content: 'Tin nhan 11' },
      { role: 'assistant', content: 'Tin nhan 10' },
      { role: 'user', content: 'Tin nhan 9' },
      { role: 'assistant', content: 'Tin nhan 8' },
      { role: 'user', content: 'Tin nhan 7' },
      { role: 'assistant', content: 'Tin nhan 6' },
      { role: 'user', content: 'Tin nhan 5' },
      { role: 'assistant', content: 'Tin nhan 4' },
      { role: 'user', content: 'Tin nhan 3' },
    ]);

    await service.query(
      'student-1',
      Role.student,
      { message: 'Con tiep theo?' , sessionId: 'session-1' },
      'Bearer token-1',
      'req-1',
    );

    expect(prisma.chatMessage.findMany).toHaveBeenCalledWith({
      where: {
        sessionId: 'session-1',
        userId: 'student-1',
        role: { in: ['user', 'assistant'] },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 10,
      select: {
        role: true,
        content: true,
      },
    });
    expect(aiAgentService.query).toHaveBeenCalledWith(
      'Bearer token-1',
      Role.student,
      {
        message: 'Con tiep theo?',
        sessionId: 'session-1',
        history: [
          { role: 'user', content: 'Tin nhan 3' },
          { role: 'assistant', content: 'Tin nhan 4' },
          { role: 'user', content: 'Tin nhan 5' },
          { role: 'assistant', content: 'Tin nhan 6' },
          { role: 'user', content: 'Tin nhan 7' },
          { role: 'assistant', content: 'Tin nhan 8' },
          { role: 'user', content: 'Tin nhan 9' },
          { role: 'assistant', content: 'Tin nhan 10' },
          { role: 'user', content: 'Tin nhan 11' },
          { role: 'assistant', content: 'Tin nhan 12' },
        ],
      },
      'req-1',
    );
  });

  it('bounds history by total characters before calling the agent', async () => {
    aiAgentService.isEnabled.mockReturnValue(true);
    aiAgentService.query.mockResolvedValue({
      answerType: 'answer',
      answer: 'Da nho ngu canh.',
      citations: [],
      trace: [],
      proposal: null,
    });
    prisma.chatSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'student-1',
    });
    prisma.chatMessage.findMany.mockResolvedValue([
      { role: 'assistant', content: 'b'.repeat(50) },
      { role: 'user', content: 'a'.repeat(16_000) },
    ]);

    await service.query(
      'student-1',
      Role.student,
      { message: 'Con tiep theo?', sessionId: 'session-1' },
      'Bearer token-1',
    );

    expect(aiAgentService.query).toHaveBeenCalledWith(
      'Bearer token-1',
      Role.student,
      {
        message: 'Con tiep theo?',
        sessionId: 'session-1',
        history: [{ role: 'assistant', content: 'b'.repeat(50) }],
      },
      undefined,
    );
  });

  it('does not include messages from a different session when building agent history', async () => {
    aiAgentService.isEnabled.mockReturnValue(true);
    aiAgentService.query.mockResolvedValue({
      answerType: 'answer',
      answer: 'Da nho ngu canh.',
      citations: [],
      trace: [],
      proposal: null,
    });
    prisma.chatSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'student-1',
    });
    prisma.chatMessage.findMany.mockResolvedValue([
      { role: 'assistant', content: 'Chi cua session-1' },
    ]);

    await service.query(
      'student-1',
      Role.student,
      { message: 'Con tiep theo?', sessionId: 'session-1' },
      'Bearer token-1',
    );

    expect(prisma.chatMessage.findMany).toHaveBeenCalledWith({
      where: {
        sessionId: 'session-1',
        userId: 'student-1',
        role: { in: ['user', 'assistant'] },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 10,
      select: {
        role: true,
        content: true,
      },
    });
    expect(aiAgentService.query).toHaveBeenCalledWith(
      'Bearer token-1',
      Role.student,
      {
        message: 'Con tiep theo?',
        sessionId: 'session-1',
        history: [{ role: 'assistant', content: 'Chi cua session-1' }],
      },
      undefined,
    );
  });

  it('falls back to legacy orchestrator only for gateway-style FastAPI failures', async () => {
    aiAgentService.isEnabled.mockReturnValue(true);
    aiAgentService.query.mockRejectedValue(new Error('network down'));
    prisma.studyMaterial.findMany.mockResolvedValue([
      {
        id: 'material-1',
        title: 'De cuong SE104',
        description: 'Tai lieu tham khao',
        category: 'other',
        fileName: 'se104.pdf',
        uploader: { firstName: 'Lan', lastName: 'Tran' },
      },
    ]);

    const result = await service.query(
      'student-1',
      Role.student,
      { message: 'Cho minh xem tai lieu' },
      'Bearer token-1',
    );

    expect(result.domain).toBe('study-materials');
    expect(result.answer).toContain('De cuong SE104');
  });
});
