import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';

import { ScheduleService } from './schedule.service';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ScheduleService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn() },
            semester: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get(ScheduleService);
    prisma = module.get(PrismaService);
  });

  it('returns student schedules for all semesters', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: Role.student });
    (prisma.semester.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'sem-1',
        name: 'HK2 2025-2026',
        academicYear: '2025-2026',
        term: 2,
        startDate: new Date('2026-01-05'),
        endDate: new Date('2026-05-30'),
        isCurrent: true,
        classSections: [
          {
            classCode: 'SE346.Q22',
            sectionCode: 'Q22',
            note: 'IoT Lab',
            course: { code: 'SE346', name: 'IoT', credits: 4 },
            scheduleItems: [
              {
                id: 'schedule-2',
                instructor: 'Lecturer B',
                room: 'E3.2',
                dayOfWeek: 3,
                startTime: '09:00',
                endTime: '10:30',
                startPeriod: 2,
                endPeriod: 3,
                sessionType: 'daytime',
              },
              {
                id: 'schedule-1',
                instructor: 'Lecturer A',
                room: 'E3.1',
                dayOfWeek: 2,
                startTime: '07:30',
                endTime: '09:00',
                startPeriod: 1,
                endPeriod: 2,
                sessionType: 'daytime',
              },
            ],
          },
        ],
      },
    ]);

    const result = await service.getAllSemestersWithSchedules('student-1');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'student-1' },
      select: { role: true },
    });
    expect(prisma.semester.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { startDate: 'desc' },
      }),
    );
    expect(result).toEqual([
      expect.objectContaining({
        id: 'sem-1',
        isCurrent: true,
        sessions: [
          expect.objectContaining({ id: 'schedule-1', dayOfWeek: 2 }),
          expect.objectContaining({ id: 'schedule-2', dayOfWeek: 3 }),
        ],
      }),
    ]);
  });

  it('returns current semester schedule', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: Role.student });
    (prisma.semester.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'sem-current',
        name: 'HK2 2025-2026',
        academicYear: '2025-2026',
        term: 2,
        startDate: new Date('2026-01-05'),
        endDate: new Date('2026-05-30'),
        isCurrent: true,
        classSections: [],
      },
    ]);

    const result = await service.getCurrentSemesterSchedule('student-1');

    expect(result.id).toBe('sem-current');
    expect(prisma.semester.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { startDate: 'desc' },
      }),
    );
  });

  it('throws NotFoundException when current semester is missing', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: Role.student });
    (prisma.semester.findMany as jest.Mock).mockResolvedValue([]);

    await expect(service.getCurrentSemesterSchedule('student-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns current semester schedule for admin', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: Role.admin });
    (prisma.semester.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'sem-current',
        name: 'HK2 2025-2026',
        academicYear: '2025-2026',
        term: 2,
        startDate: new Date('2026-01-05'),
        endDate: new Date('2026-05-30'),
        isCurrent: true,
      },
    ]);

    const result = await service.getCurrentSemesterSchedule('admin-1');

    expect(result).toMatchObject({
      id: 'sem-current',
      sessions: [],
    });
  });

  it('returns lecturer schedules from class meetings', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: Role.lecturer });
    (prisma.semester.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'sem-1',
        name: 'HK2 2025-2026',
        academicYear: '2025-2026',
        term: 2,
        startDate: new Date('2026-01-05'),
        endDate: new Date('2026-05-30'),
        isCurrent: true,
        classSections: [
          {
            classCode: 'SE346.Q22',
            sectionCode: 'Q22',
            note: 'IoT Lab',
            course: { code: 'SE346', name: 'IoT', credits: 4 },
            lecturer: { firstName: 'An', lastName: 'Nguyen' },
            meetings: [
              {
                id: 'meeting-1',
                dayOfWeek: 2,
                startTime: '07:30',
                endTime: '09:00',
                startPeriod: 1,
                endPeriod: 2,
                sessionType: 'daytime',
                room: 'E3.1',
                note: null,
              },
            ],
          },
        ],
      },
    ]);

    const result = await service.getAllSemestersWithSchedules('lecturer-1');

    expect(result[0]?.sessions[0]).toMatchObject({
      id: 'meeting-1',
      classCode: 'SE346.Q22',
      instructor: 'Nguyen An',
      room: 'E3.1',
    });
  });

  it('returns empty sessions for admin/super_admin', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: Role.admin });
    (prisma.semester.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'sem-1',
        name: 'HK2 2025-2026',
        academicYear: '2025-2026',
        term: 2,
        startDate: new Date('2026-01-05'),
        endDate: new Date('2026-05-30'),
        isCurrent: true,
      },
    ]);

    const result = await service.getAllSemestersWithSchedules('admin-1');
    expect(result[0]).toMatchObject({
      id: 'sem-1',
      sessions: [],
    });
  });

  it('throws NotFoundException when user is missing', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.getAllSemestersWithSchedules('missing-user')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns semester by id', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: Role.student });
    (prisma.semester.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'sem-1',
        name: 'HK2 2025-2026',
        academicYear: '2025-2026',
        term: 2,
        startDate: new Date('2026-01-05'),
        endDate: new Date('2026-05-30'),
        isCurrent: true,
        classSections: [],
      },
    ]);

    const result = await service.getSemesterScheduleById('student-1', 'sem-1');
    expect(result.id).toBe('sem-1');
    expect(prisma.semester.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { startDate: 'desc' },
      }),
    );
  });

  it('throws NotFoundException when semester id is missing', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: Role.student });
    (prisma.semester.findMany as jest.Mock).mockResolvedValue([]);

    await expect(service.getSemesterScheduleById('student-1', 'missing')).rejects.toThrow(
      NotFoundException,
    );
  });
});
