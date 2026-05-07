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
    classEnrollment: {
      findMany: jest.fn(),
    },
    roomBooking: {
      findFirst: jest.fn(),
    },
    event: {
      findMany: jest.fn(),
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
    prisma.chatSession.create.mockResolvedValue({ id: 'session-1' });
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
    expect(result.suggestedQuestions).toBeDefined();
    expect(Array.isArray(result.suggestedQuestions)).toBe(true);
  });

  it('returns schedule_today intent when asking about class schedule', async () => {
    prisma.chatSession.create.mockResolvedValue({ id: 'session-2' });
    prisma.chatMessage.create.mockResolvedValue(undefined);
    prisma.classEnrollment.findMany.mockResolvedValue([
      {
        classSection: {
          course: { name: 'Toán cao cấp' },
          meetings: [{ startTime: '07:30', endTime: '09:00', room: 'A101' }],
        },
      },
    ]);

    const result = await service.query('student-1', Role.student, {
      message: 'lich hoc hom nay cua toi',
    });

    expect(result.intent).toBe('schedule_today');
    expect(result.answer).toContain('Toán cao cấp');
    expect(result.deepLinks).toEqual(['/services/schedule']);
  });

  it('returns event_upcoming intent when asking about events', async () => {
    prisma.chatSession.create.mockResolvedValue({ id: 'session-3' });
    prisma.chatMessage.create.mockResolvedValue(undefined);
    prisma.event.findMany.mockResolvedValue([
      {
        id: 'ev-1',
        title: 'Workshop AI 2026',
        startAt: new Date('2026-05-10'),
        location: 'Hội trường A',
      },
    ]);

    const result = await service.query('student-1', Role.student, {
      message: 'su kien sap toi',
    });

    expect(result.intent).toBe('event_upcoming');
    expect(result.answer).toContain('Workshop AI 2026');
    expect(result.deepLinks).toEqual(['/services/events']);
  });

  it('returns notification_unread intent when asking about notifications', async () => {
    prisma.chatSession.create.mockResolvedValue({ id: 'session-4' });
    prisma.chatMessage.create.mockResolvedValue(undefined);
    prisma.notification.count.mockResolvedValue(3);
    prisma.notification.findFirst.mockResolvedValue({
      id: 'notif-1',
      title: 'Sách gần hết hạn',
    });

    const result = await service.query('student-1', Role.student, {
      message: 'thong bao chua doc',
    });

    expect(result.intent).toBe('notification_unread');
    expect(result.answer).toContain('3');
    expect(result.deepLinks).toEqual(['/notifications']);
  });

  it('returns room_booking_status when asking about room booking', async () => {
    prisma.chatSession.create.mockResolvedValue({ id: 'session-5' });
    prisma.chatMessage.create.mockResolvedValue(undefined);
    prisma.roomBooking.findFirst.mockResolvedValue({
      id: 'rb-1',
      bookingDate: new Date('2026-05-08'),
      status: 'pending',
      room: { name: 'B203' },
    });

    const result = await service.query('student-1', Role.student, {
      message: 'dat phong cua toi',
    });

    expect(result.intent).toBe('room_booking_status');
    expect(result.answer).toContain('B203');
    expect(result.deepLinks).toEqual(['/services/room-booking']);
  });
});
