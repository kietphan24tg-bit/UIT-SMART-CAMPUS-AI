import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';

import { ScheduleService } from './schedule.service';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let prisma: jest.Mocked<PrismaService>;

  const mockSemester = {
    id: 'sem-1',
    name: 'HK2 2024-2025',
    academicYear: '2024-2025',
    term: 2,
    startDate: new Date('2025-01-06'),
    endDate: new Date('2025-05-30'),
    isCurrent: true,
    classSections: [
      {
        classCode: 'SE346.Q22',
        sectionCode: 'Q22',
        note: 'Hoc tai phong lab IoT',
        course: { code: 'SE346', name: 'IoT', credits: 4 },
        scheduleItems: [
          {
            id: 'schedule-1',
            instructor: null,
            room: 'E3.1',
            dayOfWeek: 2,
            startTime: '07:30',
            endTime: '09:30',
            startPeriod: 1,
            endPeriod: 3,
            sessionType: 'daytime',
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ScheduleService,
        {
          provide: PrismaService,
          useValue: {
            semester: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get(ScheduleService);
    prisma = module.get(PrismaService);
  });

  describe('getAllSemestersWithSchedules', () => {
    it('should return all semesters with sessions for the current user', async () => {
      (prisma.semester.findMany as jest.Mock).mockResolvedValue([mockSemester]);

      const result = await service.getAllSemestersWithSchedules('user-1');

      expect(prisma.semester.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { startDate: 'desc' },
          include: expect.objectContaining({
            classSections: expect.objectContaining({
              include: expect.objectContaining({
                scheduleItems: expect.objectContaining({
                  where: { userId: 'user-1' },
                }),
              }),
            }),
          }),
        }),
      );
      expect(result).toEqual([
        expect.objectContaining({
          id: 'sem-1',
          academicYear: '2024-2025',
          term: 2,
          sessions: [
            expect.objectContaining({
              id: 'schedule-1',
              classCode: 'SE346.Q22',
              sectionCode: 'Q22',
              room: 'E3.1',
              course: { code: 'SE346', name: 'IoT', credits: 4 },
            }),
          ],
        }),
      ]);
    });
  });

  describe('getCurrentSemesterSchedule', () => {
    it('should return the current semester with sessions', async () => {
      (prisma.semester.findFirst as jest.Mock).mockResolvedValue(mockSemester);

      const result = await service.getCurrentSemesterSchedule('user-1');

      expect(prisma.semester.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isCurrent: true },
          include: expect.objectContaining({
            classSections: expect.objectContaining({
              include: expect.objectContaining({
                scheduleItems: expect.objectContaining({
                  where: { userId: 'user-1' },
                }),
              }),
            }),
          }),
        }),
      );
      expect(result).toMatchObject({
        id: 'sem-1',
        sessions: [
          {
            id: 'schedule-1',
            classCode: 'SE346.Q22',
          },
        ],
      });
    });

    it('should throw NotFoundException when current semester is not found', async () => {
      (prisma.semester.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getCurrentSemesterSchedule('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSemesterScheduleById', () => {
    it('should return the requested semester with sessions', async () => {
      (prisma.semester.findUnique as jest.Mock).mockResolvedValue({
        ...mockSemester,
        isCurrent: false,
      });

      const result = await service.getSemesterScheduleById('user-1', 'sem-1');

      expect(prisma.semester.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sem-1' },
          include: expect.objectContaining({
            classSections: expect.objectContaining({
              include: expect.objectContaining({
                scheduleItems: expect.objectContaining({
                  where: { userId: 'user-1' },
                }),
              }),
            }),
          }),
        }),
      );
      expect(result.id).toBe('sem-1');
    });

    it('should return empty sessions when semester exists but user has no schedule', async () => {
      (prisma.semester.findUnique as jest.Mock).mockResolvedValue({
        ...mockSemester,
        classSections: [
          {
            ...mockSemester.classSections[0],
            scheduleItems: [],
          },
        ],
      });

      const result = await service.getSemesterScheduleById('user-1', 'sem-1');

      expect(result.sessions).toEqual([]);
    });

    it('should throw NotFoundException when semester is not found', async () => {
      (prisma.semester.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getSemesterScheduleById('user-1', 'missing-semester')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
