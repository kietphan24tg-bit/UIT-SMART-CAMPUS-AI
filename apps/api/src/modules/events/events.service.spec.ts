import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventCategory, EventStatus } from '@prisma/client';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';

import { EventsService } from './events.service';

describe('EventsService', () => {
  let service: EventsService;
  const prisma = {
    event: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    eventRegistration: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = moduleRef.get(EventsService);
  });

  it('returns paginated list with registration flags', async () => {
    prisma.event.findMany.mockResolvedValue([
      {
        id: 'event-1',
        slug: 'smart-campus-workshop',
        title: 'Smart Campus Workshop',
        excerpt: 'Workshop',
        coverImageUrl: null,
        location: 'Room A1',
        status: EventStatus.open,
        category: EventCategory.workshop,
        startAt: new Date('2026-04-20T01:00:00.000Z'),
        endAt: new Date('2026-04-20T03:00:00.000Z'),
        maxAttendees: 100,
        createdAt: new Date('2026-04-01T01:00:00.000Z'),
        registrations: [{ id: 'reg-1' }],
        _count: { registrations: 1 },
      },
    ]);
    prisma.event.count.mockResolvedValue(1);

    const result = await service.listEvents('student-1', 1, 10);

    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.items[0]).toMatchObject({
      id: 'event-1',
      slug: 'smart-campus-workshop',
      attendeeCount: 1,
      isRegistered: true,
      status: EventStatus.open,
      category: EventCategory.workshop,
    });
  });

  it('rejects invalid slug format', async () => {
    await expect(service.getArticleBySlug('student-1', 'bad slug')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns event detail by slug', async () => {
    prisma.event.findUnique.mockResolvedValue({
      id: 'event-1',
      slug: 'smart-campus-workshop',
      title: 'Smart Campus Workshop',
      excerpt: 'Workshop',
      location: 'Room A1',
      contentHtml: '<p>Agenda</p>',
      coverImageUrl: null,
      status: EventStatus.open,
      category: EventCategory.workshop,
      startAt: new Date('2026-04-20T01:00:00.000Z'),
      endAt: new Date('2026-04-20T03:00:00.000Z'),
      maxAttendees: 100,
      owner: {
        id: 'lecturer-1',
        email: 'lecturer@uit.edu.vn',
        firstName: 'An',
        lastName: 'Nguyen',
      },
      registrations: [{ id: 'reg-1' }],
      _count: { registrations: 1 },
    });

    const result = await service.getArticleBySlug('student-1', 'smart-campus-workshop');

    expect(result).toMatchObject({
      id: 'event-1',
      slug: 'smart-campus-workshop',
      isRegistered: true,
      attendeeCount: 1,
      owner: {
        id: 'lecturer-1',
        fullName: 'Nguyen An',
      },
    });
  });

  it('throws not found when slug is missing', async () => {
    prisma.event.findUnique.mockResolvedValue(null);
    await expect(
      service.getArticleBySlug('student-1', 'missing-event'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects registration when event status is not open', async () => {
    prisma.event.findUnique.mockResolvedValue({
      id: 'event-1',
      status: EventStatus.closed,
      maxAttendees: null,
      _count: { registrations: 0 },
    });

    await expect(service.register('event-1', 'student-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects registration when event is full', async () => {
    prisma.event.findUnique.mockResolvedValue({
      id: 'event-1',
      status: EventStatus.open,
      maxAttendees: 100,
      _count: { registrations: 100 },
    });

    await expect(service.register('event-1', 'student-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns success when unregister is called for an already-cancelled registration', async () => {
    prisma.eventRegistration.findUnique.mockResolvedValue({
      id: 'reg-1',
      cancelledAt: new Date('2026-04-24T10:00:00.000Z'),
    });

    const result = await service.unregister('event-1', 'student-1');

    expect(result).toEqual({ success: true });
    expect(prisma.eventRegistration.update).not.toHaveBeenCalled();
  });
});
