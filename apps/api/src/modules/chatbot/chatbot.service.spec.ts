import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

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
    libraryLoan: {
      findMany: jest.fn(),
    },
    sosRequest: {
      findFirst: jest.fn(),
    },
    knowledgeChunk: {
      findMany: jest.fn(),
    },
    knowledgeDocument: {
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: ChatbotService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChatbotService(prisma);
  });

  it('returns empty intent when message is blank', async () => {
    const result = await service.query('student-1', Role.student, {
      message: '   ',
    });

    expect(result.intent).toBe('empty');
    expect(result.confidence).toBe(0);
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

  it('answers canteen order intent using real order data', async () => {
    prisma.chatSession.create.mockResolvedValue({
      id: 'session-1',
    });
    prisma.chatMessage.create.mockResolvedValue(undefined);
    prisma.canteenOrder.findFirst.mockResolvedValue({
      id: 'order-1',
      orderCode: 'CTN-20260426-ABCD',
      status: 'paid',
      totalAmount: 55000,
    });

    const result = await service.query('student-1', Role.student, {
      message: 'Cho minh xem don canteen gan nhat',
    });

    expect(result.intent).toBe('canteen_order_status');
    expect(result.answer).toContain('CTN-20260426-ABCD');
    expect(result.deepLinks).toEqual(['/services/canteen']);
  });
});
