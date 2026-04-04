import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';

import { ScheduleService } from './schedule.service';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let prisma: jest.Mocked<PrismaService>;

  const mockScheduleItem = {
    id: 'schedule-1',
    userId: 'user-1',
    courseId: 'course-1',
    semesterId: 'sem-1',
    instructor: 'Dr. Nguyen',
    room: 'A101',
    dayOfWeek: 2,
    startTime: '07:30',
    endTime: '09:30',
    startDate: new Date('2025-01-06'),
    endDate: new Date('2025-05-30'),
    course: { code: 'SE346', name: 'IoT', credits: 4 },
    semester: { name: 'HK2 2024-2025' },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ScheduleService,
        {
          provide: PrismaService,
          useValue: {
            semester: { findFirst: jest.fn(), findMany: jest.fn() },
            scheduleItem: { findMany: jest.fn(), findFirst: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get(ScheduleService);
    prisma = module.get(PrismaService);
  });

  describe('getSchedule', () => {
    it('should return schedule items for a given semester', async () => {
      (prisma.scheduleItem.findMany as jest.Mock).mockResolvedValue([mockScheduleItem]);

      const result = await service.getSchedule('user-1', 'sem-1');

      expect(result).toHaveLength(1);
      expect(result[0].room).toBe('A101');
      expect(prisma.scheduleItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', semesterId: 'sem-1' },
        }),
      );
    });

    it('should default to current semester when semesterId is not provided', async () => {
      (prisma.semester.findFirst as jest.Mock).mockResolvedValue({
        id: 'current-sem',
        isCurrent: true,
      });
      (prisma.scheduleItem.findMany as jest.Mock).mockResolvedValue([]);

      await service.getSchedule('user-1');

      expect(prisma.semester.findFirst).toHaveBeenCalledWith({
        where: { isCurrent: true },
      });
      expect(prisma.scheduleItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', semesterId: 'current-sem' },
        }),
      );
    });

    it('should return all items when no current semester and no semesterId', async () => {
      (prisma.semester.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.scheduleItem.findMany as jest.Mock).mockResolvedValue([]);

      await service.getSchedule('user-1');

      expect(prisma.scheduleItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });
  });

  describe('getSemesters', () => {
    it('should return semesters ordered by startDate desc', async () => {
      const semesters = [
        { id: 'sem-2', name: 'HK2', startDate: new Date('2025-01-06') },
        { id: 'sem-1', name: 'HK1', startDate: new Date('2024-09-01') },
      ];
      (prisma.semester.findMany as jest.Mock).mockResolvedValue(semesters);

      const result = await service.getSemesters();

      expect(result).toHaveLength(2);
      expect(prisma.semester.findMany).toHaveBeenCalledWith({
        orderBy: { startDate: 'desc' },
      });
    });
  });

  describe('getScheduleItemById', () => {
    it('should return schedule item when found', async () => {
      (prisma.scheduleItem.findFirst as jest.Mock).mockResolvedValue(mockScheduleItem);

      const result = await service.getScheduleItemById('schedule-1', 'user-1');

      expect(result.id).toBe('schedule-1');
    });

    it('should throw NotFoundException when item not found', async () => {
      (prisma.scheduleItem.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.getScheduleItemById('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
