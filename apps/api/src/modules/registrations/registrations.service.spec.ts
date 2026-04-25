import { ConflictException } from '@nestjs/common';
import { EnrollmentStatus } from '@prisma/client';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';

import { RegistrationsService } from './registrations.service';

describe('RegistrationsService', () => {
  let service: RegistrationsService;

  const prisma = {
    classSection: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    classEnrollment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    scheduleItem: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        RegistrationsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = moduleRef.get(RegistrationsService);
  });

  it('rejects registration when class section is full', async () => {
    prisma.classSection.findUnique.mockResolvedValue({
      id: 'section-1',
      registrationOpen: true,
      capacity: 1,
      meetings: [],
      _count: {
        enrollments: 1,
      },
    });
    prisma.classEnrollment.findUnique.mockResolvedValue(null);

    await expect(service.register('student-1', 'section-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects registration when schedule conflicts with active enrollment', async () => {
    prisma.classSection.findUnique.mockResolvedValue({
      id: 'section-1',
      registrationOpen: true,
      capacity: 40,
      meetings: [
        {
          id: 'meeting-1',
          dayOfWeek: 2,
          startTime: '07:30',
          endTime: '09:00',
          room: 'B1.02',
          startPeriod: 1,
          endPeriod: 2,
          sessionType: 'daytime',
          note: null,
        },
      ],
      _count: {
        enrollments: 0,
      },
    });
    prisma.classEnrollment.findUnique.mockResolvedValue(null);
    prisma.classEnrollment.findMany.mockResolvedValue([
      {
        classSection: {
          meetings: [
            {
              dayOfWeek: 2,
              startTime: '08:15',
              endTime: '09:45',
            },
          ],
        },
      },
    ]);

    await expect(service.register('student-1', 'section-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('creates enrollment and synchronizes schedule items when registration succeeds', async () => {
    const meetings = [
      {
        id: 'meeting-1',
        dayOfWeek: 2,
        room: 'B1.02',
        startTime: '07:30',
        endTime: '09:00',
        startPeriod: 1,
        endPeriod: 2,
        sessionType: 'daytime',
        note: null,
      },
    ];

    prisma.classSection.findUnique.mockResolvedValue({
      id: 'section-1',
      classCode: 'SE346.Q11',
      sectionCode: 'Q11',
      note: null,
      registrationOpen: true,
      capacity: 40,
      meetings,
      _count: {
        enrollments: 1,
      },
    });
    prisma.classEnrollment.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'enrollment-1',
        status: EnrollmentStatus.active,
        registeredAt: new Date('2026-04-25T01:00:00.000Z'),
        droppedAt: null,
        classSection: {
          id: 'section-1',
          classCode: 'SE346.Q11',
          sectionCode: 'Q11',
          note: null,
          registrationOpen: true,
          capacity: 40,
          course: {
            code: 'SE346',
            name: 'Internet of Things',
            credits: 4,
          },
          semester: {
            id: 'sem-1',
            name: 'HK2 2025-2026',
            isCurrent: true,
          },
          lecturer: null,
          meetings,
          _count: {
            enrollments: 2,
          },
        },
      });
    prisma.classEnrollment.findMany.mockResolvedValue([]);

    const tx = {
      classEnrollment: {
        upsert: jest.fn().mockResolvedValue({ id: 'enrollment-1' }),
      },
      scheduleItem: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    prisma.$transaction.mockImplementation(async (cb: (client: typeof tx) => Promise<void>) =>
      cb(tx),
    );

    await service.register('student-1', 'section-1');

    expect(tx.classEnrollment.upsert).toHaveBeenCalledWith({
      where: {
        studentId_classSectionId: {
          studentId: 'student-1',
          classSectionId: 'section-1',
        },
      },
      update: {
        status: EnrollmentStatus.active,
        registeredAt: expect.any(Date),
        droppedAt: null,
      },
      create: {
        studentId: 'student-1',
        classSectionId: 'section-1',
        status: EnrollmentStatus.active,
      },
    });
    expect(tx.scheduleItem.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'student-1',
        classSectionId: 'section-1',
      },
    });
    expect(tx.scheduleItem.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          userId: 'student-1',
          classSectionId: 'section-1',
          dayOfWeek: 2,
          startTime: '07:30',
          endTime: '09:00',
        }),
      ],
    });
  });
});
